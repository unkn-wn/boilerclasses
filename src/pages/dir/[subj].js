import Link from 'next/link'


const SubjectDirectory = ({ courses }) => {
  
  return <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 m-10">
      {courses && courses.length > 0 ? (
        courses.sort((a, b) => a.value.courseCode - b.value.courseCode).map((course) => (
          <Link key={course.value.detailId} href={`/detail/${course.value.detailId}`} className="p-6 bg-zinc-900 p-6 rounded-md shadow-md text-lg font-semibold text-white underline decoration-dotted underline-offset-4 hover:scale-[1.02] hover:transition cursor-pointer">
              {course.value.subjectCode} {course.value.courseCode}: {course.value.title}
          </Link>
        ))
      ) : (
        <p className="text-center text-gray-500">No courses available.</p>
      )}
    </div>
  </>
};



export async function getServerSideProps(context) {
  const params = new URLSearchParams({ q: "", sub: context.params.subj, term: [], gen: [], cmin: 0, cmax: 18, levels: [100, 200, 300, 400, 500, 600, 700, 800, 900], sched: ["Clinic",
    "Distance Learning",
    "Experiential",
    "Individual Study",
    "Laboratory",
    "Laboratory Preparation",
    "Lecture",
    "Practice Study Observation",
    "Presentation",
    "Recitation",
    "Research",
    "Studio"],
    maxlim: 1000});
  const response = await fetch('http://localhost:3000/api/search?' + params);
  const data = await response.json();
  return {
    props: {
      courses: data.courses.documents || null
    },
  };
}

export default SubjectDirectory;