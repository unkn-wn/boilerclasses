package com.boilerclasses

import com.boilerclasses.CourseData.Attribute
import com.boilerclasses.CourseData.Subject
import com.boilerclasses.CourseData.Term
import io.jooby.*
import io.jooby.exception.NotFoundException
import io.jooby.kt.runApp
import io.jooby.netty.NettyServer
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.*
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

val json = Json {
    classDiscriminatorMode= ClassDiscriminatorMode.NONE
    encodeDefaults=true
}

enum class APIErrTy {
    NotFound,
    Unauthorized,
    BadRequest,
    Loading,
    RateLimited,
    Other;

    fun code() = when(this) {
        NotFound -> StatusCode.NOT_FOUND
        Unauthorized -> StatusCode.UNAUTHORIZED
        BadRequest -> StatusCode.BAD_REQUEST
        RateLimited -> StatusCode.TOO_MANY_REQUESTS
        Other,Loading -> StatusCode.SERVER_ERROR
    }

    fun str() = when(this) {
        NotFound -> "notFound"
        Unauthorized -> "unauthorized"
        BadRequest -> "badRequest"
        Loading -> "loading"
        RateLimited -> "rateLimited"
        Other -> "other"
    }

    fun err(msg: String?=null) = APIError(this, msg)
}

data class APIError(val ty: APIErrTy, val msg: String?): Throwable(msg ?: ty.str())

inline fun<reified T> Context.json() =
    runCatching {
        json.decodeFromString<T>(body().value())
    }.getOrElse {
        throw APIErrTy.BadRequest.err("Invalid JSON: ${it.message}")
    }

@OptIn(ExperimentalSerializationApi::class)
inline fun<reified T> Context.resp(x: T): Context {
    val stream = responseStream(MediaType.json)

    json.encodeToStream(buildJsonObject {
        if (x is APIError) {
            put("status", "error")
            put("error", x.ty.str())
            put("message", x.msg)
        } else {
            put("status", "ok")
            put("result", Json.encodeToJsonElement(x))
        }
    }, stream)

    stream.close()
    return this
}

suspend fun main(args: Array<String>) = coroutineScope {
    runApp(args) {
        val db = DB(environment)
        val courses = Courses(environment, log)

        launch { courses.runScraper() }

        before {
            if (ctx.remoteAddress=="127.0.0.1")
                ctx.header("X-Forwarded-For").valueOrNull()?.let {
                    ctx.remoteAddress=it.split(",").last().trim()
                }
        }

        install(NettyServer())

        coroutine {
            @Serializable
            data class Info(
                val terms: Map<String, Term>,
                val subjects: List<Subject>,
                val attributes: List<Attribute>,
                val scheduleTypes: List<String>
            )

            post("/info") {
                courses.courses().let {
                    ctx.resp(Info(it.terms, it.subjects, it.attributes, it.scheduleTypes))
                }
            }

            post("/all") {
                ctx.resp(courses.courses().courses.map {
                    buildJsonObject {
                        put("id", it.strId())
                        put("lastUpdated", it.lastUpdated)
                    }
                })
            }

            post("/search") {
                val req = ctx.json<Courses.SearchReq>()
                ctx.resp(courses.searchCourses(req))
            }

            post("/course") {
                ctx.json<String>().let {
                    ctx.resp(courses.courseById(it))
                }
            }

            post("/rmp") {
                val profs = ctx.json<List<String>>()
                ctx.resp(courses.courses().let { c->
                    profs.map { c.rmp[it] }
                })
            }

            get("/data") { courses.download() }
        }

        error { ctx, cause, code ->
            log.error("Request error", cause)

            when (cause) {
                is APIError -> {
                    ctx.setResponseCode(cause.ty.code())
                    ctx.resp(cause)
                }
                is NotFoundException -> {
                    ctx.setResponseCode(StatusCode.NOT_FOUND)
                    ctx.resp(APIErrTy.NotFound.err())
                }
                else -> {
                    ctx.setResponseCode(code)
                    ctx.resp(APIErrTy.Other.err(cause.message))
                }
            }
        }
    }
}