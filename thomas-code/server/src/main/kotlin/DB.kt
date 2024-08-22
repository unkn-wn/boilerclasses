package com.boilerclasses

import io.jooby.Environment
import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.json.jsonb
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction
import java.io.File
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.*

fun ByteArray.base64(): String = Base64.getEncoder().encodeToString(this)
fun String.base64(): ByteArray = Base64.getDecoder().decode(this)

object InstantSerializer: KSerializer<Instant> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("Instant", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: Instant) = encoder.encodeString(value.toString())
    override fun deserialize(decoder: Decoder): Instant = Instant.parse(decoder.decodeString())
}

class DB(env: Environment) {
    val dbFile = File("./data/db.sqlite")
    val db = Database.connect("jdbc:sqlite:${dbFile.path.toString()}?foreign_keys=on", "org.sqlite.JDBC")
    val rng = SecureRandom()

    fun genKey(): String {
        val key = ByteArray(32)
        rng.nextBytes(key)
        return key.base64()
    }

    fun hash(data: String): ByteArray = MessageDigest.getInstance("SHA-256").run {
        update(data.toByteArray())
        digest()
    }

    init {
        transaction(db) {
            SchemaUtils.createMissingTablesAndColumns()
        }
    }

    val json = Json.Default

    // constraints and indices are created by migrations in scripts with knex so we don't worry about that here...

    object Course: Table("course") {
        val id = integer("id")

        val subject = text("subject")
        val course = integer("course")
        val name = text("name")

        val data = jsonb<Schema.Course>("data", json)
    }

//    object User: Table("user") {
//        val id = integer("id")
//        val email = text("email")
//        val admin = bool("admin")
//    }
//
//    object Session: Table("session") {
//        val id = text("id")
//        val user = integer("user").references(User.id).nullable()
//        val key = binary("key")
//    }
//
//    object CourseContribution: Table("course_contribution") {
//        val id = integer("id")
//        val course = integer("course").references(Course.id)
//        val pending = bool("pending")
//        val user = integer("user").references(User.id)
//        val tag = text("tag")
//
//        val text = text("text_content").nullable()
//        val file = blob("file").nullable()
//        val filename = text("filename").nullable()
//    }

    object Instructor: Table("instructor") {
        val id = integer("id")
        val name = text("name")
        val rmp = jsonb<Schema.RMPInfo>("rmp", json).nullable()
        val data = jsonb<Schema.Instructor>("data", json)
    }

    object CourseInstructor: Table("course_instructor") {
        val course = integer("course").references(Course.id)
        val instructor = text("instructor").references(Instructor.name)
    }

    object Term: Table("term") {
        val id = text("id")
        val purdueId = text("purdue_id")
        val name = text("name")
        val lastUpdated = timestamp("last_updated")
    }

    object Subject: Table("subject") {
        val abbr = text("abbr")
        val name = text("name")
    }

    object Attribute: Table("attribute") {
        val id = text("id")
        val name = text("name")
    }

    object ScheduleType: Table("scheduleType") {
        val name = text("name")
    }

    private suspend fun<T> query(block: suspend Transaction.() -> T): T =
        newSuspendedTransaction<T>(Dispatchers.IO,db,statement=block)

    //this could be considered sucky, by some
    suspend fun getInfo(): Schema.Info = query {
        Schema.Info(
            Term.selectAll().associate {
                it[Term.id] to Schema.Term(it[Term.purdueId], it[Term.name], it[Term.lastUpdated].toString())
            },
            Subject.selectAll().map { Schema.Subject(it[Subject.abbr], it[Subject.name]) },
            Attribute.selectAll().map { Schema.Attribute(it[Attribute.id], it[Attribute.name]) },
            ScheduleType.selectAll().map { it[ScheduleType.name] }
        )
    }

    private fun toCourseId(it: ResultRow) = Schema.CourseId(it[Course.id], it[Course.data])

    //these *seem* slow but sqlite is pretty fast so imma just keep things organized and store everything in db
    //https://www.sqlite.org/np1queryprob.html

    private suspend fun toInstructorId(it: ResultRow) =
        Schema.InstructorId(it[Instructor.id], it[Instructor.data], it[Instructor.rmp],
            (CourseInstructor leftJoin Course).select(Course.id, Course.data)
                .where { CourseInstructor.instructor eq it[Instructor.name] }
                .map { Schema.CourseId(it[Course.id], it[Course.data]) })

    suspend fun getCourseRange(n: Int, from: Int) = query {
        Course.select(Course.id, Course.data)
            .limit(n, from.toLong())
            .orderBy(Course.subject to SortOrder.ASC, Course.course to SortOrder.ASC)
            .map { toCourseId(it) }
    }

    suspend fun lookupCourses(sub: String, num: Int) = query {
        Course.select(Course.id, Course.data).where {
            (Course.subject eq sub) and (Course.course eq num)
        }.map { Schema.CourseId(it[Course.id], it[Course.data]) }
    }

    suspend fun allCourses() = query {
        Course.select(Course.id, Course.data).map { toCourseId(it) }
    }

    suspend fun allInstructors() = query {
        Instructor.select(Instructor.id, Instructor.data)
            .associate { it[Instructor.id] to it[Instructor.data] }
    }

    suspend fun getRMPs(profs: List<String>) = query {
        val m = Instructor.select(Instructor.name, Instructor.rmp)
            .where { Instructor.name inList profs }
            .associate { it[Instructor.name] to it[Instructor.rmp] }
        profs.map { m[it] }
    }

    suspend fun getInstructorByName(name: String) = query {
        Instructor.select(Instructor.id, Instructor.data, Instructor.rmp, Instructor.name)
            .where {Instructor.name eq name}.firstOrNull()?.let { toInstructorId(it) }
    }

    suspend fun getInstructor(id: Int) = query {
        Instructor.select(Instructor.id, Instructor.data, Instructor.rmp, Instructor.name)
            .where {Instructor.id eq id}.firstOrNull()?.let { toInstructorId(it) }
    }

//    suspend fun auth(id: String, key: String) = query {
//        val ses = (Session leftJoin User)
//            .select(Session.key, Session.user, User.admin, User.email)
//            .where { Session.id eq id }
//            .firstOrNull() ?: throw APIErrTy.Unauthorized.err("Session not found")
//
//        val khash = hash(key)
//        if (!MessageDigest.isEqual(khash, ses[Session.key]))
//            throw APIErrTy.Unauthorized.err("invalid session key")
//
//        SessionDB(id, khash.base64(), ses[Session.user], ses[User.email], ses[User.admin] ?: false)
//    }
//
//    inner class SessionDB(val sesId: String, val state: String,
//                          val id: Int?, val email: String?, val admin: Boolean?) {
//
//        suspend fun withEmail(email: String) {
//        }
//
//        suspend fun remove() = query { Session.deleteWhere { id eq sesId } }
//
//    }
}