package com.boilerclasses

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.time.LocalTime
import java.time.format.DateTimeFormatterBuilder
import java.util.Locale

// just stowing the bodies here 🪦
object Schema {
    @Serializable
    data class RMPInfo(
        val avgDifficulty: Double,
        val avgRating: Double,
        val rmpUrl: String,
        val numRatings: Int,
        val wouldTakeAgainPercent: Double
    )

    @Serializable
    data class InstructorGrade(
        val grade: Map<String, Double>,
        val gpa: Double?, val gpaSections: Int,
        val numSections: Int
    )

    @Serializable
    data class Seats(
        val used: Int,
        val left: Int
    )

    @Serializable
    data class Section(
        val crn: Int,
        val section: String,
        val times: List<SectionTime>,
        val seats: Seats,
        val waitlist: Seats,
        val dateRange: List<String>,
        val scheduleType: String,
        val instructors: List<SectionInstructor>,
        val permissionOfInstructor: Boolean,
        val permissionOfDept: Boolean
    )

    @Serializable
    data class SectionTime(
        val day: String,
        val time: String,
    ) {
        companion object {
            val formatter = DateTimeFormatterBuilder().parseCaseInsensitive()
                .appendPattern("h:mm a").toFormatter(Locale.ENGLISH)
        }

        fun toTimes(): List<LocalTime> = time.split(" - ").map {
            LocalTime.parse(it, formatter)
        }
    }

    @Serializable
    data class SectionInstructor(
        val name: String,
        val primary: Boolean
    )

    @Serializable
    sealed class PreReq {
        @Serializable
        sealed class CourseLike(
            val minCredits: Int?=null,
            val minGPA: Double?=null,
            val grade: String?=null
        ): PreReq() {
            abstract val concurrent: Boolean
        }
        @Serializable
        @SerialName("course")
        data class Course(
            val level: String?=null,
            val subject: String,
            val course: String,
            override val concurrent: Boolean
        ): CourseLike()
        @Serializable
        @SerialName("courseRange")
        data class CourseRange(
            val subject: String,
            val course: String,
            val courseTo: String,
            override val concurrent: Boolean
        ): CourseLike()
        @Serializable
        @SerialName("subject")
        data class Subject(
            val subject: String,
            override val concurrent: Boolean
        ): CourseLike()
        @Serializable
        @SerialName("attribute")
        data class Attribute(
            val attribute: String,
            override val concurrent: Boolean
        ): CourseLike()
        @Serializable
        @SerialName("range")
        data class Range(
            val what: String,
            val min: Int,
            val max: Int
        ): PreReq()
        @Serializable
        @SerialName("test")
        data class Test(
            val test: String,
            val minScore: String
        ): PreReq()
        @Serializable
        @SerialName("gpa")
        data class Gpa(val minimum: Double): PreReq()
        @Serializable
        @SerialName("credits")
        data class Credits(val minimum: Int): PreReq()
        @Serializable
        @SerialName("studentAttribute")
        data class StudentAttribute(val attr: String): PreReq()
    }

    @Serializable
    sealed class Restriction {
        abstract val exclusive: Boolean

        @Serializable
        @SerialName("level")
        data class Level(
            val level: String, override val exclusive: Boolean
        ): Restriction()

        @Serializable
        @SerialName("major")
        data class Major(
            val major: String, override val exclusive: Boolean
        ): Restriction()

        @Serializable
        @SerialName("degree")
        data class Degree(
            val degree: String, override val exclusive: Boolean
        ): Restriction()

        @Serializable
        @SerialName("program")
        data class Program(
            val program: String, override val exclusive: Boolean
        ): Restriction()

        @Serializable
        @SerialName("college")
        data class College(
            val college: String, override val exclusive: Boolean
        ): Restriction()

        @Serializable
        @SerialName("class")
        data class Class(
            @SerialName("class")
            val className: String, //if professional, year is set otherwise minCredit is
            val minCredit: Int?=null,
            val maxCredit: Int?=null,
            val year: Int?=null,
            override val exclusive: Boolean
        ): Restriction()

        @Serializable
        @SerialName("cohort")
        data class Cohort(
            val cohort: String,
            override val exclusive: Boolean
        ): Restriction()
    }

    @Serializable
    sealed class PreReqs {
        @Serializable
        @SerialName("leaf")
        data class Leaf(val leaf: PreReq): PreReqs()
        @Serializable
        @SerialName("or")
        data class Or(val vs: List<PreReqs>): PreReqs()
        @Serializable
        @SerialName("and")
        data class And(val vs: List<PreReqs>): PreReqs()
    }

    @Serializable
    sealed class Credits {
        @Serializable
        @SerialName("range")
        data class Range(
            val min: Int,
            val max: Int
        ): Credits()

        @Serializable
        @SerialName("fixed")
        data class Fixed(val values: List<Int>): Credits()
    }

    @Serializable
    data class SmallCourse(
        val id: Int,

        val name: String,
        val subject: String,
        val course: Int,
        val termInstructors: Map<String, List<SectionInstructor>>,

        val lastUpdated: String,
        val description: String,
        val credits: Credits,
        val attributes: List<String>,
        val scheduleTypes: List<String>,

        val grades: InstructorGrade
    )

    @Serializable
    data class Course(
        val name: String,
        val subject: String,
        val course: Int,
        val instructor: Map<String, Map<String, InstructorGrade>>,
        val sections: Map<String, List<Section>>,
        val lastUpdated: String,
        val description: String,
        val credits: Credits,
        val attributes: List<String>,
        val prereqs: JsonElement,
        val restrictions: List<Restriction>,
    ) {
        fun prereqs(): PreReqs? = when (prereqs) {
            is JsonObject -> Json.decodeFromJsonElement<PreReqs>(prereqs)
            else -> null
        }

        fun grades(terms: Set<String>?): InstructorGrade = instructor.values.flatMap {
            if (terms==null) it.values else it.filterKeys { x->terms.contains(x) }.values
        }.fold(InstructorGrade(emptyMap(), null, 0, 0)) { acc, x ->
            InstructorGrade(acc.grade + x.grade.mapValues {
                (acc.grade[it.key]?:0.0)+it.value
            },
                if (acc.gpaSections>0 || x.gpaSections>0) (acc.gpa?:0.0) + (x.gpa?:0.0) else null,
                acc.gpaSections+x.gpaSections,
                acc.numSections+x.numSections)
        }.let { g->
            g.copy(grade=g.grade.mapValues { it.value/g.numSections }, gpa=g.gpa?.let {it/g.gpaSections})
        }
    }

    @Serializable
    data class Instructor(
        val name: String,
        val grades: List<GradeData>,
        val nicknames: List<String>,
        val dept: String? = null,
        val title: String? = null,
        val office: String? = null,
        val site: String? = null,
        val email: String? = null,
        val lastUpdated: String
    )

    @Serializable
    data class InstructorId(
        val id: Int,
        val instructor: Instructor,
        val rmp: RMPInfo?=null,
        val courses: List<CourseId>
    )

    @Serializable
    data class CourseId(
        val id: Int,
        val course: Course
    ) {
        fun toSmall() = SmallCourse(
            id, course.name, course.subject, course.course,
            course.sections.mapValues {(k,v)->
                v.flatMap {it.instructors}.groupingBy {it.name}
                    .reduce { a,b,c-> SectionInstructor(a,b.primary||c.primary) }
                    .values.toList()
            },
            course.lastUpdated, course.description, course.credits,
            course.attributes,
            course.sections.values.flatten().map {it.scheduleType}.distinct(),
            course.grades(null)
        )
    }

    @Serializable
    data class GradeData(
        val subject: String,
        val course: String,
        val term: String,
        val data: Map<String, Double?>
    )

    @Serializable
    data class Term(val id: String, val name: String, val lastUpdated: String)
    @Serializable
    data class Subject(val abbr: String, val name: String)
    @Serializable
    data class Attribute(val id: String, val name: String)
    @Serializable
    data class Info(
        val terms: Map<String, Term>,
        val subjects: List<Subject>,
        val attributes: List<Attribute>,
        val scheduleTypes: List<String>
    )
}
