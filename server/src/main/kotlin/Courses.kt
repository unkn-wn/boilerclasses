package com.boilerclasses

import io.jooby.AttachedFile
import io.jooby.Environment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.decodeFromStream
import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.analysis.CharacterUtils
import org.apache.lucene.analysis.LowerCaseFilter
import org.apache.lucene.analysis.Tokenizer
import org.apache.lucene.analysis.core.DecimalDigitFilter
import org.apache.lucene.analysis.core.LetterTokenizer
import org.apache.lucene.analysis.core.WhitespaceTokenizer
import org.apache.lucene.analysis.en.EnglishAnalyzer
import org.apache.lucene.analysis.miscellaneous.PerFieldAnalyzerWrapper
import org.apache.lucene.analysis.ngram.EdgeNGramTokenFilter
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute
import org.apache.lucene.analysis.tokenattributes.OffsetAttribute
import org.apache.lucene.codecs.PostingsFormat
import org.apache.lucene.codecs.lucene99.Lucene99Codec
import org.apache.lucene.document.*
import org.apache.lucene.index.DirectoryReader
import org.apache.lucene.index.IndexWriter
import org.apache.lucene.index.IndexWriterConfig
import org.apache.lucene.index.Term
import org.apache.lucene.queryparser.classic.MultiFieldQueryParser
import org.apache.lucene.search.*
import org.apache.lucene.search.suggest.document.Completion99PostingsFormat
import org.apache.lucene.search.suggest.document.PrefixCompletionQuery
import org.apache.lucene.search.suggest.document.SuggestField
import org.apache.lucene.search.suggest.document.SuggestIndexSearcher
import org.apache.lucene.store.ByteBuffersDirectory
import org.apache.lucene.util.BytesRef
import org.slf4j.Logger
import java.io.File
import java.util.concurrent.TimeUnit
import kotlin.time.Duration.Companion.minutes

fun formatTerm(term: String): String {
    for (x in listOf("fall", "summer", "spring", "winter"))
        if (term.startsWith(x))
            return "${x.replaceFirstChar { it.uppercaseChar() }} ${term.substring(x.length)}"
    throw IllegalArgumentException("invalid term")
}

fun CourseData.Course.strId() = "$subject$course$name".filter {it.isLetter()}

class Courses(val env: Environment, val log: Logger) {
    @Serializable
    data class SearchReq(
        val query: String,
        val minCredits: Int?=null, val maxCredits: Int?=null,
        val minCourse: Int?=null, val maxCourse: Int?=null,
        val attributes: List<String> = emptyList(),
        val subjects: List<String> = emptyList(),
        val scheduleType: List<String> = emptyList(),
        val terms: List<String> = emptyList()
    )

    @Serializable
    data class SearchResult(
        val score: Float,
        val course: CourseData.Course
    )

    @Serializable
    data class SearchOutput(
        val completion: CourseData.Course?,
        val results: List<SearchResult>
    )

    val scrapeInterval = env.getProperty("scrapeInterval")!!.toInt().minutes
    val scrapeArgs = env.getProperty("scrapeArgs") ?: ""
    private val coursesFile = File("./data/courses.json")

    val mut = Mutex()
    private var courses: CourseData.Data? = null
    private val courseMap = mutableMapOf<String, CourseData.Course>()

    val crapAnalyzer = object: Analyzer() {
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
                        if (last>=termAttr.length)
                            termBuf=termAttr.resizeBuffer(1+termAttr.length)
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

    val subjectAnalyzer = object: Analyzer() {
        override fun createComponents(fieldName: String?): TokenStreamComponents {
            val tokenizer = object: LetterTokenizer() {
                override fun isTokenChar(c: Int): Boolean = Character.isAlphabetic(c)
            }
            return TokenStreamComponents(tokenizer, LowerCaseFilter(tokenizer))
        }
    }

    private val idAnalyzer = { withngrams: Boolean ->
        object: Analyzer() {
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
    }

    private var idx: ByteBuffersDirectory? = null
    private var dirReader: DirectoryReader? = null
    private var searcher: SuggestIndexSearcher? = null

    val analyzerMap = mapOf(
        "subject" to subjectAnalyzer, "course" to idAnalyzer(true),
        "prereqs" to crapAnalyzer, "instructor" to StandardAnalyzer(),
        "suggest" to crapAnalyzer
    )

    val fieldAnalyzer = PerFieldAnalyzerWrapper(EnglishAnalyzer(), analyzerMap)
    val queryFieldAnalyzer = PerFieldAnalyzerWrapper(EnglishAnalyzer(),
        analyzerMap + mapOf("course" to idAnalyzer(false)))

    private val weights = mapOf(
        //uh idk lemme just type some random numbers
        "subject" to 100,
        "course" to 80,
        "subjectName" to 150,
        "title" to 70,
        "desc" to 50,
        "instructor" to 20,
        "prereq" to 10,
        "term" to 100,
    ).mapValues { it.value.toFloat()/10.0f }

    val queryParser = MultiFieldQueryParser(
        weights.keys.toTypedArray(), queryFieldAnalyzer, weights
    )

    suspend fun loadCourses() {
        try {
            log.info("loading courses")
            val c = Json.decodeFromStream<CourseData.Data>(coursesFile.inputStream())

            val newIdx = ByteBuffersDirectory()
            val cfg = IndexWriterConfig(fieldAnalyzer)
            cfg.setCodec(object: Lucene99Codec() {
                override fun getPostingsFormatForField(field: String?): PostingsFormat {
                    if (field=="suggest")
                        return Completion99PostingsFormat()
                    return super.getPostingsFormatForField(field)
                }
            })
            val writer = IndexWriter(newIdx, cfg)

            log.info("indexing courses")
            writer.addDocuments(c.courses.withIndex().map { (i,course)->
                courseMap[course.strId()]=course
                val subjectMap = c.subjects.associateBy { it.abbr }
                val attrMap = c.attributes.associateBy { it.id }

                Document().apply {
                    add(Field("subject", course.subject, TextField.TYPE_NOT_STORED))
                    add(StringField("subjectString", course.subject, Field.Store.NO))
                    add(Field("subjectName",
                        subjectMap[course.subject]!!.name, TextField.TYPE_NOT_STORED))
                    add(Field("course", course.course.toString(), TextField.TYPE_NOT_STORED))
                    add(Field("title", course.name, TextField.TYPE_NOT_STORED))
                    add(SuggestField("suggest", "${course.subject}${course.course}", 1))
                    add(Field("desc", course.description, TextField.TYPE_NOT_STORED))
                    add(IntField("courseInt", course.course, Field.Store.NO))

                    val reqs = mutableListOf<CourseData.PreReq>()
                    course.prereqs()?.let { prereqs->
                        val stack = ArrayDeque<CourseData.PreReqs>()
                        stack.addLast(prereqs)
                        while (stack.size>0) {
                            when (val x=stack.removeLast()) {
                                is CourseData.PreReqs.Or -> x.vs.forEach {stack.addLast(it)}
                                is CourseData.PreReqs.And -> x.vs.forEach {stack.addLast(it)}
                                is CourseData.PreReqs.Leaf -> reqs.add(x.leaf)
                            }
                        }
                    }

                    //didnt really work...
//                    fun c(x: Int) = if (x==1) "1 credit" else "$x credits"
                    val (min,max) = when (course.credits) {
                        is CourseData.Credits.Fixed->
                            course.credits.values.min() to course.credits.values.max()
//                                course.credits.values.joinToString(" or ") { c(it) })
                        is CourseData.Credits.Range->
                            course.credits.min to course.credits.max
//                                    "${c(course.credits.min)} to ${c(course.credits.max)}")
                    }
//
//                    add(Field("creditText", txt, TextField.TYPE_NOT_STORED))
                    add(IntField("minCredits", min, Field.Store.NO))
                    add(IntField("maxCredits", min, Field.Store.NO))

                    reqs.mapNotNull {
                        if (it is CourseData.PreReq.Course) "${it.subject} ${it.course}"
                        else null
                    }.joinToString(" ").let {
                        add(Field("prereq", it, TextField.TYPE_NOT_STORED))
                    }

                    course.instructor.values.flatten()
                        .joinToString(" ") { it.name }.let {
                            add(Field("instructor", it, TextField.TYPE_NOT_STORED))
                        }

                    course.sections.keys.forEach {
                        add(StringField("termId", it, Field.Store.NO))
                    }

                    course.sections.keys.joinToString(" ") {c.terms[it]!!.name}.let {
                        add(Field("term", it, TextField.TYPE_NOT_STORED))
                    }

                    course.sections.values.flatten().map {it.scheduleType}
                        .distinct().forEach {
                            add(StringField("scheduleType", it, Field.Store.NO))
                        }

                    course.attributes.flatMap { listOfNotNull(it, attrMap[it]?.name) }.forEach {
                        add(StringField("attributes", it, Field.Store.NO))
                    }
                }
            })

            writer.close()

            log.info("finished indexing")
            mut.withLock {
                courses = c
                dirReader?.close()
                idx?.close()

                idx=newIdx
                dirReader=DirectoryReader.open(idx)
                searcher= SuggestIndexSearcher(dirReader)
            }
        } catch (e: Throwable) {
            log.error("error parsing course data:", e)
        }
    }

    suspend fun searchCourses(req: SearchReq) = mut.withLock {
        if (searcher==null) throw APIErrTy.Loading.err("courses not indexed yet")

        val q1: Query = queryParser.parse(req.query)
        val bq = BooleanQuery.Builder().add(q1, BooleanClause.Occur.SHOULD)
        for ((k,v) in weights) {
            if (v<5) continue

            val term = queryFieldAnalyzer.normalize(k,req.query)
            bq.add(BoostQuery(FuzzyQuery(Term(k, term)), v*3f), BooleanClause.Occur.SHOULD)
            bq.add(BoostQuery(PhraseQuery(k, term), v*2), BooleanClause.Occur.SHOULD)
        }

        val suggestion = searcher!!.suggest(PrefixCompletionQuery(crapAnalyzer, Term(
            "suggest", req.query
        )), 1, true)
            .scoreDocs.firstOrNull()?.doc?.let {courses!!.courses[it]}

        if (req.minCourse!=null || req.maxCourse!=null)
            bq.add(IntField.newRangeQuery("courseInt",
                req.minCourse ?: 0, req.maxCourse ?: Int.MAX_VALUE),
                BooleanClause.Occur.FILTER)

        if (req.minCredits!=null)
            bq.add(IntField.newRangeQuery("minCredits", req.minCredits, Int.MAX_VALUE),
                BooleanClause.Occur.FILTER)
        if (req.maxCredits!=null)
            bq.add(IntField.newRangeQuery("maxCredits", 0, req.maxCredits),
                BooleanClause.Occur.FILTER)

        listOf(
            req.scheduleType to "scheduleType",
            req.terms to "termId",
            req.subjects to "subjectString"
        ).forEach { (a,b)->
            if (a.isNotEmpty())
                bq.add(TermInSetQuery(b,a.map {
                    BytesRef(it.toByteArray())
                }), BooleanClause.Occur.FILTER)
        }

        val q = bq.build()
        val res = searcher!!.search(q, 35, Sort(), true)
        log.info(searcher!!.explain(q, res.scoreDocs[0].doc).toString())

        SearchOutput(suggestion, res.scoreDocs.map {
            SearchResult(it.score, courses!!.courses[it.doc])
        })
    }

    suspend fun courses() = mut.withLock {
        courses ?: throw APIErrTy.Loading.err("courses not loaded")
    }

    suspend fun download() = mut.withLock {
        if (courses==null) throw APIErrTy.Loading.err("courses not loaded")
        AttachedFile(coursesFile.toPath())
    }

    suspend fun courseById(id: String) = mut.withLock {
        courseMap[id] ?: throw APIErrTy.NotFound.err("course with id $id not found")
    }

    suspend fun runScraper() {
        if (coursesFile.exists()) loadCourses()

        while (true) {
            if (courses!=null) delay(scrapeInterval)

            log.info("starting scrape")
            val (res,proc) = withContext(Dispatchers.IO) {
                val args = mutableListOf(
                    "./scripts/node_modules/.bin/tsx",
                    "./scripts/fetch.ts",
                    "-o", coursesFile.path
                )

                if (coursesFile.exists())
                    args += listOf("-i", coursesFile.path)

                val proc = ProcessBuilder().command(
                    args + scrapeArgs.split(" ").filterNot {it.isEmpty()}
                ).inheritIO().start()

                proc.waitFor(1, TimeUnit.HOURS) to proc
            }

            if (!res) {
                log.error("scraper took too long, rerunning")
                continue
            }

            log.info("scraper exited with ${proc.exitValue()}")
            if (proc.exitValue()==0) loadCourses()
            delay(5000) //minimum delay between invocations (in case of error)
        }
    }
}