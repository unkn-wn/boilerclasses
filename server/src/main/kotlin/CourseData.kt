package com.boilerclasses

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.json.*

// just stowing the bodies here 🪦
object CourseData {
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
        val time: String
    )

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
        ) : CourseLike()
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
        data class Gpa(val minimum: Double) : PreReq()
        @Serializable
        @SerialName("credits")
        data class Credits(val minimum: Int) : PreReq()
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
        ) : Restriction()

        @Serializable
        @SerialName("major")
        data class Major(
            val major: String, override val exclusive: Boolean
        ) : Restriction()

        @Serializable
        @SerialName("degree")
        data class Degree(
            val degree: String, override val exclusive: Boolean
        ) : Restriction()

        @Serializable
        @SerialName("program")
        data class Program(
            val program: String, override val exclusive: Boolean
        ) : Restriction()

        @Serializable
        @SerialName("college")
        data class College(
            val college: String, override val exclusive: Boolean
        ) : Restriction()

        @Serializable
        @SerialName("class")
        data class Class(
            @SerialName("class")
            val className: String, //if professional, year is set otherwise minCredit is
            val minCredit: Int?=null,
            val maxCredit: Int?=null,
            val year: Int?=null,
            override val exclusive: Boolean
        ) : Restriction()

        @Serializable
        @SerialName("cohort")
        data class Cohort(
            val cohort: String,
            override val exclusive: Boolean
        ) : Restriction()
    }

    @Serializable
    sealed class PreReqs {
        @Serializable
        @SerialName("leaf")
        data class Leaf(val leaf: PreReq) : PreReqs()
        @Serializable
        @SerialName("or")
        data class Or(val vs: List<PreReqs>) : PreReqs()
        @Serializable
        @SerialName("and")
        data class And(val vs: List<PreReqs>) : PreReqs()
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
        val restrictions: List<Restriction>
    ) {
        fun prereqs(): PreReqs? = when (prereqs) {
            is JsonObject -> Json.decodeFromJsonElement<PreReqs>(prereqs)
            else -> null
        }
    }

    @Serializable
    data class Term(val id: String, val name: String, val lastUpdated: String)
    @Serializable
    data class Subject(val abbr: String, val name: String)
    @Serializable
    data class Attribute(val id: String, val name: String)

    @Serializable
    data class Data(
        val courses: List<Course>,
        val rmp: Map<String, RMPInfo>,
        val terms: Map<String, Term>,
        val subjects: List<Subject>,
        val attributes: List<Attribute>,
        val scheduleTypes: List<String>
    )
}
