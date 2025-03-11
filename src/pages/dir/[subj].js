import Link from 'next/link'
import Head from 'next/head';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';

import SearchBar from '@/components/SearchBar';
import Footer from '@/components/footer';
import ErrorPage from 'next/error';

const SubjectDirectory = ({ courses, subject }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;

    const query = searchQuery.toLowerCase();
    return courses.filter(course =>
      course.value.title.toLowerCase().includes(query) ||
      `${course.value.subjectCode} ${course.value.courseCode}`.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  if (!courses || courses.length === 0) {
    return <ErrorPage statusCode={404} />;
  }

  return <>
    <Head>
      <title>{`${subject} Courses | BoilerClasses`}</title>
      <meta name="title" content={`${subject} Courses | BoilerClasses`} />
      <meta name="description" content={`Course catalog for Purdue ${subject} from BoilerClasses. BoilerClasses has over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more for ${subject}.`} />
      <meta name="keywords" content={`Purdue, Purdue University, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers, ${subject}`} />
      <meta name='og:locality' content='West Lafayette' />
      <meta name='og:region' content='IN' />
      <meta name='og:postal-code' content='47906' />
      <meta name='og:postal-code' content='47907' />

      <link rel="canonical" href={`https://boilerclasses.com/dir/${subject}`} />
    </Head>

    <div className='m-10'>
      <button onClick={() => router.back()} className='text-primary text-xl'>&lt;</button>
      <h1 className='font-bold text-primary text-3xl mb-4'>{subject} Courses</h1>
      <SearchBar
        placeholder="Filter courses..."
        value={searchQuery}
        onChange={setSearchQuery}
        className='mb-4'
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses && filteredCourses.length > 0 ? (
          filteredCourses.sort((a, b) => a.value.courseCode - b.value.courseCode).map((course) => (
            <Link key={course.value.detailId} href={`/detail/${course.value.detailId}`} className="p-6 bg-background rounded-md shadow-md text-lg font-semibold text-primary underline decoration-dotted underline-offset-4 hover:scale-[1.02] transition cursor-pointer">
              {course.value.subjectCode} {course.value.courseCode}: {course.value.title}
            </Link>
          ))
        ) : (
          <p className="text-center text-tertiary col-span-3">No courses match your search.</p>
        )}
      </div>
    </div>

    <Footer />
  </>;
};

export async function getServerSideProps(context) {
  const params = new URLSearchParams({
    q: "", sub: context.params.subj, term: [], gen: [], cmin: 0, cmax: 18, levels: [100, 200, 300, 400, 500, 600, 700, 800, 900], sched: ["Clinic",
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
    maxlim: 1000
  });
  const response = await fetch('http://localhost:3000/api/search?' + params);
  const data = await response.json();
  return {
    props: {
      courses: data.courses.documents || null,
      subject: context.params.subj
    },
  };
}

export default SubjectDirectory;