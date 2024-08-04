package com.boilerclasses

import com.boilerclasses.Courses.SearchResult
import io.jooby.AttachedFile
import io.jooby.Environment
import io.jooby.FileDownload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromStream
import org.apache.lucene.analysis.*
import org.apache.lucene.analysis.core.DecimalDigitFilter
import org.apache.lucene.analysis.core.LetterTokenizer
import org.apache.lucene.analysis.core.WhitespaceTokenizer
import org.apache.lucene.analysis.en.EnglishAnalyzer
import org.apache.lucene.analysis.miscellaneous.PerFieldAnalyzerWrapper
import org.apache.lucene.analysis.ngram.EdgeNGramTokenFilter
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute
import org.apache.lucene.analysis.tokenattributes.OffsetAttribute
import org.apache.lucene.document.*
import org.apache.lucene.index.*
import org.apache.lucene.queries.mlt.MoreLikeThis
import org.apache.lucene.queryparser.simple.SimpleQueryParser
import org.apache.lucene.search.*
import org.apache.lucene.store.MMapDirectory
import org.apache.lucene.util.BytesRef
import org.slf4j.Logger
import java.io.File
import java.time.Duration
import java.time.Instant
import java.time.LocalTime
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.math.min
import kotlin.time.Duration.Companion.minutes

val termTypes = listOf("fall", "summer", "spring", "winter")

fun parseTerm(term: String): Pair<Int,Int> {
    for ((i,x) in termTypes.withIndex())
        if (term.startsWith(x)) return i to term.substring(x.length).toInt()
    throw IllegalArgumentException("invalid term")
}

fun formatTerm(term: String): String = parseTerm(term).let {
    "${termTypes[it.first].replaceFirstChar {x->x.uppercase()}} ${it.second}"
}

fun termIdx(term: String) = parseTerm(term).let { it.second*termTypes.size + it.first }
fun timeToMin(x: LocalTime) = x.toSecondOfDay()/60

class Courses(val env: Environment, val log: Logger, val db: DB) {
    val numResults = 30
    val maxResults = 1000

    @Serializable
    data class SearchReq(
        val query: String,
        val minCredits: Int?=null, val maxCredits: Int?=null,
        val minCourse: Int?=null, val maxCourse: Int?=null,
        val attributes: List<String> = emptyList(),
        val subjects: List<String> = emptyList(),
        val scheduleType: List<String> = emptyList(),
        val terms: List<String> = emptyList(),
        val instructors: List<String> = emptyList(),
        val minMinute: Int? = null, val maxMinute: Int? = null,
        val minGPA: Float? = null, val maxGPA: Float? = null,
        val page: Int=0
    ) {
        fun isEmpty() = copy(query=query.trim(), page=0) == SearchReq("")
    }

    @Serializable
    data class SearchResult(
        val score: Float,
        val id: Int,
        val course: Schema.Course
    )

    @Serializable
    data class SearchOutput(
        val results: List<SearchResult>,
        val numHits: Int, val npage: Int,
        val ms: Double
    )

    val scrapeInterval = env.getProperty("scrapeInterval")
        ?.ifBlank {null}?.toInt()?.minutes
    val scrapeArgs = env.getProperty("scrapeArgs") ?: ""

    private val indexFile = File("./data/index")
    private val indexSwapFile = File("./data/index-tmp")

    val lock = RwLock()

    private fun crapAnalyzer() = object: Analyzer() {
        val tokenizer = object: Tokenizer() {
            private val termAttr = addAttribute(CharTermAttribute::class.java)
            private val offsetAttr = addAttribute(OffsetAttribute::class.java)
            private val buffer = CharacterUtils.newCharacterBuffer(4096)

            private var offset=0
            private var finalOffset=0
            private var dataLen=0
            private var bufferOffset=0

            override fun incrementToken(): Boolean {
                clearAttributes()
                var last = -1
                var start = -1
                var mode=0
                var termBuf = termAttr.buffer();

                while (true) {
                    if (offset>=dataLen+bufferOffset) {
                        CharacterUtils.fill(buffer, input)
                        bufferOffset+=dataLen
                        dataLen = buffer.length

                        if (dataLen==0) {
                            if (last>=0) break
                            else {
                                finalOffset=correctOffset(offset)
                                return false
                            }
                        }
                    }

                    //no support for wide chars :>)
                    val c = buffer.buffer[offset-bufferOffset]
                    var newMode=0
                    if (c.isDigit()) newMode=1
                    else if (c.isLetter()) newMode=2

                    if (mode==0 && newMode>0) {
                        start=offset
                        mode=newMode
                    } else if (mode!=newMode) {
                        break
                    }

                    if (mode>0) {
                        last=offset-start
                        if (last>=termBuf.size)
                            termBuf=termAttr.resizeBuffer(1+last)
                        termBuf[last]=c.lowercaseChar()
                    }

                    offset++
                }

                termAttr.setLength(last+1)
                offsetAttr.setOffset(correctOffset(start), correctOffset(start+last+1))
                return true
            }

            override fun reset() {
                super.reset()
                buffer.reset() //prolly unnecessary...? buffer should be filled next time
                offset=0
                dataLen=0
                bufferOffset=0
            }

            override fun end() {
                super.end()
                offsetAttr.setOffset(finalOffset, finalOffset);
            }
        }

        override fun createComponents(fieldName: String?): TokenStreamComponents {
            return TokenStreamComponents(tokenizer)
        }
    }

    private fun subjectAnalyzer() = object: Analyzer() {
        override fun createComponents(fieldName: String?): TokenStreamComponents {
            val tokenizer = object: LetterTokenizer() {
                override fun isTokenChar(c: Int): Boolean = Character.isAlphabetic(c)
            }
            return TokenStreamComponents(tokenizer, LowerCaseFilter(tokenizer))
        }
    }

    private fun idAnalyzer(withngrams: Boolean) = object: Analyzer() {
        override fun createComponents(fieldName: String?): TokenStreamComponents {
            val tokenizer = WhitespaceTokenizer()
            return TokenStreamComponents(tokenizer,
                DecimalDigitFilter(tokenizer).let {
                    if (withngrams)
                        EdgeNGramTokenFilter(it, 1, 5, true)
                    else it
                })
        }
    }

    private var idx: MMapDirectory? = null
    private var dirReader: DirectoryReader? = null
    private var moreLike: MoreLikeThis? = null
    private var searcher: IndexSearcher? = null

    private var courseById = emptyMap<Int,Schema.Course>()
    private var sortedCourses = listOf<Schema.CourseId>()

    private val fieldAnalyzer = PerFieldAnalyzerWrapper(EnglishAnalyzer(), mapOf(
        "subject" to subjectAnalyzer(), "course" to idAnalyzer(true),
        "prereqs" to crapAnalyzer(), "instructor" to StandardAnalyzer(),
        "suggest" to crapAnalyzer()
    ))

    //same thing but course is crap, function (above is only for indexing)
    private fun queryFieldAnalyzer() = PerFieldAnalyzerWrapper(EnglishAnalyzer(), mapOf(
        "subject" to subjectAnalyzer(), "course" to crapAnalyzer(),
        "prereqs" to crapAnalyzer(), "instructor" to StandardAnalyzer(),
        "suggest" to crapAnalyzer()
    ))

    private val weights = mapOf(
        //uh idk lemme just type some random numbers
        "subject" to 130,
        "course" to 150,
        "subjectName" to 150,
        "title" to 150,
        "desc" to 35,
        "instructor" to 80,
        "prereq" to 10,
        "term" to 100,
    ).mapValues { it.value.toFloat()/10.0f }

    private val similarFields = listOf(
        "subject", "subjectName", "title", "desc", "instructor", "term"
    )

    private fun makeQueryParser(analyzer: Analyzer) = SimpleQueryParser(analyzer, weights)

    private suspend fun loadCourses() {
        try {
            log.info("loading courses")

            var c = db.allCourses()
            val info = db.getInfo()
            val subjectMap = info.subjects.associateBy { it.abbr }

            val newCourseById = c.associate { it.id to it.course }
            val newSortedCourses = c.sortedWith(
                compareBy<Schema.CourseId>({it.course.subject}, {it.course.course})
            )

            if (indexSwapFile.exists()) indexSwapFile.deleteRecursively()

            val newIdx = MMapDirectory(indexSwapFile.toPath())
            val cfg = IndexWriterConfig(fieldAnalyzer)
            val writer = IndexWriter(newIdx, cfg)

            log.info("indexing courses")

            val instructorNicks = db.allInstructors().values.associate {it.name to it.nicknames}

            writer.addDocuments(c.map { cid->
                Document().apply {
                    val textTermVec = FieldType().apply {
                        setIndexOptions(IndexOptions.DOCS_AND_FREQS_AND_POSITIONS);
                        setTokenized(true)
                        setStoreTermVectors(true)
                        freeze()
                    }

                    add(IntField("id", cid.id, Field.Store.YES))
                    add(SortedDocValuesField("subjectSort", BytesRef(cid.course.subject)))
                    add(SortedDocValuesField("courseSort", BytesRef(cid.course.course)))

                    add(Field("subject", cid.course.subject, textTermVec))
                    add(StringField("subjectString", cid.course.subject, Field.Store.NO))
                    add(Field("subjectName",
                        subjectMap[cid.course.subject]!!.name, textTermVec))
                    add(Field("course", cid.course.course.toString(), TextField.TYPE_NOT_STORED))
                    add(Field("title", cid.course.name, textTermVec))
                    add(Field("desc", cid.course.description, textTermVec))
                    add(IntField("courseInt", cid.course.course, Field.Store.NO))

                    val reqs = mutableListOf<Schema.PreReq>()
                    cid.course.prereqs()?.let { prereqs->
                        val stack = ArrayDeque<Schema.PreReqs>()
                        stack.addLast(prereqs)
                        while (stack.size>0) {
                            when (val x=stack.removeLast()) {
                                is Schema.PreReqs.Or -> x.vs.forEach {stack.addLast(it)}
                                is Schema.PreReqs.And -> x.vs.forEach {stack.addLast(it)}
                                is Schema.PreReqs.Leaf -> reqs.add(x.leaf)
                            }
                        }
                    }

                    //didnt really work...
                    val (min,max) = when (val x = cid.course.credits) {
                        is Schema.Credits.Fixed-> x.values.min() to x.values.max()
                        is Schema.Credits.Range-> x.min to x.max
                    }

                    add(IntField("minCredits", min, Field.Store.NO))
                    add(IntField("maxCredits", max, Field.Store.NO))

                    reqs.mapNotNull {
                        if (it is Schema.PreReq.Course) "${it.subject} ${it.course}"
                        else null
                    }.joinToString(" ").let {
                        add(Field("prereq", it, TextField.TYPE_NOT_STORED))
                    }

                    cid.course.sections.values.asSequence().flatten().flatMap {it.instructors}
                        .also { instructors->
                            instructors.map {it.name}.distinct().forEach {
                                add(StringField("instructorString", it, Field.Store.NO))
                            }
                        }
                        .flatMap { (instructorNicks[it.name] ?: emptyList()) + it.name }.distinct()
                        .joinToString(" ").let {
                            add(Field("instructor", it, textTermVec))
                        }

                    cid.course.sections.keys.forEach {
                        add(StringField("termId", it, Field.Store.NO))
                    }

                    cid.course.sections.keys.joinToString(" ") {info.terms[it]!!.name}.let {
                        add(Field("term", it, textTermVec))
                    }

                    cid.course.sections.values.flatten().map {it.scheduleType}
                        .distinct().forEach {
                            add(StringField("scheduleType", it, Field.Store.NO))
                        }

                    cid.course.sections.maxBy {termIdx(it.key)}.value
                        .flatMap { it.times }.mapNotNull {it.toTimes().firstOrNull()}.forEach {
                        add(IntField("time", timeToMin(it), Field.Store.NO))
                    }

                    cid.course.avgGPA(null)?.let {
                        add(FloatField("gpa", it.toFloat(), Field.Store.NO))
                    }

                    cid.course.attributes.forEach { add(StringField("attributes", it, Field.Store.NO)) }
                }
            })

            writer.close()

            log.info("finished indexing")
            newIdx?.close()
            lock.write {
                dirReader?.close()
                idx?.close()

                indexFile.deleteRecursively()
                indexSwapFile.copyRecursively(indexFile, overwrite = true)
                
                sortedCourses = newSortedCourses
                courseById = newCourseById

                idx=MMapDirectory(indexFile.toPath())
                dirReader=DirectoryReader.open(idx)
                searcher=IndexSearcher(dirReader)
                moreLike=MoreLikeThis(dirReader).apply {
                    fieldNames=similarFields.toTypedArray()
                }
            }
        } catch (e: Throwable) {
            log.error("error parsing/indexing course data:", e)
        } finally {
            indexSwapFile.deleteRecursively()
        }
    }

    private suspend fun scoreDocsToCourses(scoredocs: List<ScoreDoc>): List<SearchResult> {
        val fields = searcher!!.storedFields()

        return scoredocs.map { scoredoc ->
            val id = fields.document(scoredoc.doc).getField("id").numericValue().toInt()
            SearchResult(
                if (scoredoc.score.isNaN()) 0.0f else scoredoc.score,
                id, courseById[id]!!
            )
        }
    }

    suspend fun similarCourses(id: Int): List<SearchResult> = lock.read {
        if (searcher==null) throw APIErrTy.Loading.err("courses not indexed yet")
        val doc = searcher!!.search(IntField.newExactQuery("id", id), 1).scoreDocs[0]

        searcher!!.search(moreLike!!.like(doc.doc), 10).scoreDocs.filter {
            it.doc!=doc.doc && it.score>4.5
        }.let { scoreDocsToCourses(it) }
    }

    suspend fun searchCourses(req: SearchReq): SearchOutput = lock.read {
        if (searcher==null) throw APIErrTy.Loading.err("courses not indexed yet")
        if (req.page<0) throw APIErrTy.BadRequest.err("page is negative");

        if (req.isEmpty())
            return@read sortedCourses.subList(req.page*numResults,
                min(sortedCourses.size,(req.page+1)*numResults)).map {

                SearchResult(0.0f,it.id,it.course)
            }.let {
                SearchOutput(it, sortedCourses.size,
                    (sortedCourses.size+numResults-1)/numResults, 0.0)
            }

        val startTime = Instant.now()
        val trimQuery = req.query.trim()

        val analyzer = queryFieldAnalyzer()

        val bq = BooleanQuery.Builder()
        val parser = makeQueryParser(analyzer)
        if (trimQuery.isNotEmpty()) {
            bq.add(parser.parse(trimQuery), BooleanClause.Occur.SHOULD)

            for ((k,v) in weights) {
                val term = analyzer.normalize(k,trimQuery)
                bq.add(BoostQuery(FuzzyQuery(Term(k, term)), v), BooleanClause.Occur.SHOULD)
                parser.createPhraseQuery(k, trimQuery)?.let {
                    bq.add(BoostQuery(it, v), BooleanClause.Occur.SHOULD)
                }
                bq.add(BoostQuery(PrefixQuery(Term(k, term)), v*3f), BooleanClause.Occur.SHOULD)
            }
        }

        if (req.minCourse!=null || req.maxCourse!=null)
            bq.add(IntField.newRangeQuery("courseInt",
                req.minCourse?.times(100) ?: 0,
                req.maxCourse?.times(100) ?: Int.MAX_VALUE),
                BooleanClause.Occur.FILTER)

        if (req.minMinute!=null || req.maxMinute!=null)
            bq.add(IntField.newRangeQuery("time", req.minMinute ?: 0,
                req.maxMinute ?: Int.MAX_VALUE), BooleanClause.Occur.FILTER)

        if (req.minCredits!=null)
            bq.add(IntField.newRangeQuery("maxCredits", req.minCredits, Int.MAX_VALUE),
                BooleanClause.Occur.FILTER)
        if (req.maxCredits!=null)
            bq.add(IntField.newRangeQuery("minCredits", 0, req.maxCredits),
                BooleanClause.Occur.FILTER)

        if (req.minGPA!=null || req.maxGPA!=null)
            bq.add(FloatField.newRangeQuery("gpa",
                req.minGPA ?: 0.0f, req.maxGPA ?: Float.MAX_VALUE),
                BooleanClause.Occur.FILTER)

        listOf(
            req.scheduleType to "scheduleType",
            req.terms to "termId",
            req.subjects to "subjectString",
            req.attributes to "attributes",
            req.instructors to "instructorString"
        ).forEach { (a,b)->
            if (a.isNotEmpty())
                bq.add(TermInSetQuery(b,a.map {
                    BytesRef(it.toByteArray())
                }), BooleanClause.Occur.FILTER)
        }

        val q = bq.build()
        val cnt = min(maxResults, (req.page+1)*numResults)
        val res = searcher!!.search(q, cnt,
            if (trimQuery.isNotEmpty()) Sort.RELEVANCE
            else Sort(SortField("subjectSort", SortField.Type.STRING), SortField("courseSort", SortField.Type.STRING)))
//        println(searcher!!.explain(q, res.scoreDocs[0].doc).toString())

        val intHits = res.totalHits.value.toInt()
        //num pages may change as numhits increases...
        return@read SearchOutput(
            res.scoreDocs.takeLast((res.scoreDocs.size-1)%numResults +1)
                .let { scoreDocsToCourses(it) },
            intHits, max(1,min(intHits+numResults-1, maxResults)/numResults),
            Duration.between(startTime, Instant.now()).toNanos().toDouble()/1e6
        )
    }

    suspend fun getCourse(id: Int) = lock.read { courseById[id] }

    suspend fun download() = lock.read {
        val json = Json.encodeToString(sortedCourses)
        FileDownload(FileDownload.Mode.INLINE, json.toByteArray(), "courses.json")
    }

    suspend fun runScraper() {
        loadCourses()

        while (scrapeInterval!=null) {
            delay(scrapeInterval)

            log.info("starting scrape")
            val (res,proc) = withContext(Dispatchers.IO) {
                val args = mutableListOf(
                    "./scripts/node_modules/.bin/tsx",
                    "./scripts/main.ts",
                    "-d", db.dbFile.absolutePath
                )

                val proc = ProcessBuilder().command(
                    args + scrapeArgs.split(" ").filterNot {it.isEmpty()}
                ).inheritIO().start()

                proc.waitFor(1, TimeUnit.HOURS) to proc
            }

            if (!res) {
                log.error("scraper took too long")
                continue
            }

            log.info("scraper exited with ${proc.exitValue()}")
            loadCourses()
        }
    }
}