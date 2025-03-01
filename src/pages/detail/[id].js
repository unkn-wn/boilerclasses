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
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';
import { instructorStyles, labels, genedsOptions } from '@/lib/utils';
import { semesters, sanitizeDescription } from "@/lib/utils";

import Footer from '@/components/footer';
import Calendar from '@/components/calendar';
import { collectAllProfessors, calculateGradesAndGPA } from '@/lib/gpaUtils';
import GpaModal from '@/components/gpaModal';
import { loadRatingsForProfs } from '@/components/RMP';
import { Spinner } from '@chakra-ui/react';

// Detail components
import DetailPageHead from '@/components/detail/DetailPageHead';
import CourseHeader from '@/components/detail/CourseHeader';
import CourseLinks from '@/components/detail/CourseLinks';
import CourseDescription from '@/components/detail/CourseDescription';
import InstructorTabs from '@/components/detail/InstructorTabs';
// ------------------------

const CardDetails = ({ courseData, semData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const backOrHome = useBackOrHome();

  // ------------------ STATES ------------------ //
  const [selectedInstructors, setSelectedInstructors] = useState([]);
  const [curGPA, setCurGPA] = useState({});
  const [curRMP, setCurRMP] = useState({});

  const [sem, setSem] = useState(semData);
  const [gpaGraph, setGpaGraph] = useState({});
  const [defaultGPA, setDefaultGPA] = useState({});
  const [selectableInstructors, setSelectableInstructors] = useState([]);

  // Calculate available semesters and instructors
  const availableSemesters = [];
  semesters.forEach((sem) => {
    try {
      if (courseData.terms?.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch {}
  });

  // UseEffect that loads on first render
  useEffect(() => {
    if (!courseData) return;

    // Helper to handle initial instructor setup
    const setupInitialInstructor = (allProfs, semesterProfs) => {
      const firstProf =
        semesterProfs?.length > 0 ? semesterProfs[0] : allProfs[0];
      refreshGraph({ value: firstProf, label: firstProf });
      setSelectedInstructors([firstProf]);
    };

    sanitizeDescription(courseData);

    const allProfs = collectAllProfessors(courseData.instructor);
    const { grades, gpa } = calculateGradesAndGPA(
      allProfs,
      courseData.gpa,
    );

    setGpaGraph({
      labels,
      datasets: [],
    });
    setDefaultGPA({
      labels,
      datasets: grades,
    });
    setCurGPA(gpa);
    setSelectableInstructors(allProfs);

    setSem(availableSemesters[0]);
    setupInitialInstructor(
      allProfs,
      courseData.instructor[availableSemesters[0]]
    );

    setLoading(false);
  }, [router.isReady, courseData]);

  // Another UseEffect to asynchronously get RMP ratings
  useEffect(() => {
    if (!courseData) return;

    loadRatingsForProfs(courseData).then((ratings) => {
      setCurRMP(ratings);
    });
  }, [courseData]);

  // Function to get searchable prof string for Reddit search
  const getSearchableProfString = () => {
    let ret = " OR ";
    courseData.instructor[sem]?.forEach((prof) => {
      const profSplit = prof.split(" ");
      ret += `"${profSplit[0]} ${profSplit[profSplit.length - 1]}" OR `;
    });
    return ret.substring(0, ret.length - 4);
  };

  // Refresh graph when instructors change
  const refreshGraph = (instructors) => {
    const gpa = defaultGPA.datasets;
    if (!gpa || gpa.length === 0 || !instructors) return;

    const instructorNames = Array.isArray(instructors)
      ? instructors.map(inst => inst.value)
      : [instructors.value];

    setSelectedInstructors(instructorNames);

    try {
      const newgpa = gpa.filter(inst => {
        const isIncluded = instructors.some(instructor => instructor.label === inst.label.trim());
        return isIncluded;
      });

      setGpaGraph({
        labels,
        datasets: newgpa,
      });
    } catch {
      console.error("Error filtering instructors");
    }
  };

  // To refresh graph when everything's loaded
  useEffect(() => {
    if (!courseData || !selectedInstructors.length) return;
    refreshGraph([{
      value: selectedInstructors[selectedInstructors.length - 1],
      label: selectedInstructors[selectedInstructors.length - 1]
    }]);
  }, [defaultGPA.datasets]);

  // Function to replace gened codes with actual names
  const genedCodeToName = (code) => {
    const gened = genedsOptions.filter(gened => gened.value === code);
    return gened[0]?.label || code;
  };

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
    <>
      <DetailPageHead courseData={courseData} semData={semData} />

      <div className={`flex flex-col min-h-screen bg-super container mx-auto p-5 mt-5 ${inter.className} text-primary`}>
        <div className="flex md:flex-row flex-col md:gap-4">
          {/* Left half of panel */}
          <div className="flex flex-col w-full md:mr-3 justify-start h-full">
            <CourseHeader
              courseData={courseData}
              sem={sem}
              backOrHome={backOrHome}
              genedCodeToName={genedCodeToName}
            />

            <CourseLinks
              courseData={courseData}
              sem={sem}
              getSearchableProfString={getSearchableProfString}
            />

            <CourseDescription courseData={courseData} />
          </div>

          {/* Right half of panel */}
          {defaultGPA.datasets && (
            <div className="flex flex-col w-full overflow-clip">
              <InstructorTabs
                courseData={courseData}
                defaultGPA={defaultGPA}
                selectedInstructors={selectedInstructors}
                selectableInstructors={selectableInstructors}
                instructorStyles={instructorStyles}
                curGPA={curGPA}
                curRMP={curRMP}
                gpaGraph={gpaGraph}
                refreshGraph={refreshGraph}
              />
            </div>
          )}
        </div>

        {/* GPA by Professor section */}
        <div className="w-full mb-8">
          <GpaModal course={courseData} selectedInstructors={selectedInstructors} />
        </div>

        {/* Calendar View for Lecture Times */}
        <Calendar
          subjectCode={courseData.subjectCode}
          courseCode={courseData.courseCode}
          title={courseData.title}
        />

        <div className='mt-auto'>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default CardDetails;

// function to strip courseData code to remove the 00s
export function stripCourseCode(courseCode) {
  let formattedName = courseCode.toString();
  if (/\d{5}$/.test(formattedName) && formattedName.slice(-2) === "00") {
    formattedName = formattedName.slice(0, -2);
  }
  return formattedName;
}

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
