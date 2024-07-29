package com.boilerclasses

import io.jooby.Environment
import kotlinx.coroutines.Dispatchers
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.javatime.timestamp
import org.jetbrains.exposed.sql.json.json
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.*
import kotlin.io.path.Path
import kotlin.io.path.absolutePathString

fun ByteArray.base64(): String = Base64.getEncoder().encodeToString(this)
fun String.base64(): ByteArray = Base64.getDecoder().decode(this)

object InstantSerializer : KSerializer<Instant> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("Instant", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: Instant) = encoder.encodeString(value.toString())
    override fun deserialize(decoder: Decoder): Instant = Instant.parse(decoder.decodeString())
}

class DB(env: Environment) {
    val db = Database.connect("jdbc:sqlite:${Path(env.getProperty("db.path")!!).absolutePathString()}?foreign_keys=on", "org.sqlite.JDBC")
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

    private suspend fun<T> query(block: suspend Transaction.() -> T): T =
        newSuspendedTransaction<T>(Dispatchers.IO,db,statement=block)
}