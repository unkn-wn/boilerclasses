/*
 * Details page for a specific course - includes course description, instructors, GPA, RMP ratings,
 * prerequisites, and a calendar view of lecture times.
 */

// ----- Next.js imports -----
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
import ErrorPage from 'next/error';
import { useRouter } from 'next/router';
import { useBackOrHome } from '@/hooks/useRouteHistory';
// ---------------------

// ----- React imports -----
import { useEffect, useState } from 'react';

// ----- Component imports -----
import { semesters, sanitizeDescription } from "@/lib/utils";

import Footer from '@/components/footer';
import Calendar from '@/components/calendar';
import GpaModal from '@/components/gpaModal';
import { Spinner } from '@chakra-ui/react';

// Detail components
import DetailPageHead from '@/components/detail/DetailPageHead';
import CourseHeader from '@/components/detail/CourseHeader';
import CourseLinks from '@/components/detail/CourseLinks';
import CourseDescription from '@/components/detail/CourseDescription';
import InstructorTabs from '@/components/detail/InstructorTabs';

// Context Provider
import { DetailProvider } from '@/components/detail/context/DetailContext';
// ------------------------

const CardDetails = ({ courseData, semData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const backOrHome = useBackOrHome();

  // Calculate available semesters
  const availableSemesters = [];
  semesters.forEach((sem) => {
    try {
      if (courseData.terms?.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch {}
  });

  // Initialize the course data
  useEffect(() => {
    if (!courseData) return;

    sanitizeDescription(courseData);
    setLoading(false);
  }, [router.isReady, courseData]);


  ///////////////////////////////////////  RENDER  /////////////////////////////////////////

  if (JSON.stringify(courseData) === '{}') {
    return <ErrorPage statusCode={404} />;
  }

  if (loading) {
    return (
      <div className='h-screen w-screen flex items-center justify-center'>
        <Spinner size="lg" color={`rgb(var(--text-color))`} />
      </div>
    );
  }

  return (
    <DetailProvider courseData={courseData} initialSemester={semData}>
      <DetailPageHead />

      <div className={`flex flex-col min-h-screen bg-super container mx-auto p-5 mt-5 ${inter.className} text-primary`}>
        <div className="flex md:flex-row flex-col md:gap-4">
          {/* Left panel */}
          <div className="flex flex-col w-full md:w-1/3 md:mr-3 justify-start h-full">
            <CourseHeader backOrHome={backOrHome} />
            <CourseLinks />
            <CourseDescription />
          </div>

          {/* Right panel */}
          <div className="flex flex-col w-full md:w-2/3 overflow-y-auto max-h-[calc(100vh-100px)] pb-">
            {/* Instructor tabs section */}
            <div className="mb-8">
              <InstructorTabs />
            </div>

            {/* GPA Modal section */}
            <div className="w-full mb-8">
              <GpaModal />
            </div>
          </div>
        </div>

        {/* Calendar View for Lecture Times */}
        <Calendar />

        <div className='mt-auto'>
          <Footer />
        </div>
      </div>
    </DetailProvider>
  );
};

export default CardDetails;


// @Sarthak made this, some api call to get courseData data
export async function getServerSideProps(context) {
  const params = new URLSearchParams({ detailId: context.params.id });
  // https://www.boilerclasses.com
  const data = await fetch(`http://localhost:3000/api/get?${params}`);
  const course = await data.json().then((res) => {
    if (res["course"]["documents"].length > 0) {
      return res["course"]["documents"][0].value;
    } else {
      return {};
    }
  });
  const availableSemesters = [];
  semesters.forEach((sem) => {
    try {
      if (course.terms?.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch {}
  });
  return {
    props: {
      courseData: course,
      semData: availableSemesters.length > 0 ? availableSemesters[0] : ""
    },
  };
}
