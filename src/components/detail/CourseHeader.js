import React from 'react';
import { useDetailContext } from '@/components/detail/context/DetailContext';
import { Icon } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';
import { genedCodeToName } from '@/lib/utils';
import CourseInstructors from './CourseInstructors';

const CourseHeader = ({ backOrHome }) => {
  const { courseData, sem } = useDetailContext();

  if (!courseData) return null;

  return (
    <>
      {/* Back button on its own line */}
      <div className="mb-2">
        <button
          onClick={backOrHome}
          className="flex items-center text-tertiary hover:text-secondary transition-colors">
          <Icon as={ArrowBackIcon} alt="" boxSize={4} />
          <span className="text-sm font-medium ml-1">Back</span>
        </button>
      </div>

      {/* Course title */}
      <p className="lg:text-3xl md:text-3xl text-xl font-bold mb-6">
        {courseData.subjectCode} {courseData.courseCode}: {courseData.title}
      </p>

      <div className="flex flex-col gap-4 -mt-3 mb-1">
        <div className="flex flex-row flex-wrap gap-1 mb-1 items-center">
          {/* Credits Display */}
          <p className="text-sm text-secondary font-bold">
            {courseData.credits && courseData.credits[0] === courseData.credits[1]
              ? `${courseData.credits[0]} Credits`
              : courseData.credits
                ? `${courseData.credits[0]} - ${courseData.credits[1]} Credits`
                : `${courseData.creditHours || 0} Credits`}
          </p>

          {/* Separator Display */}
          <span className="mx-2 h-6 w-0.5 bg-background-opposite-secondary rounded" />

          {/* Latest Semester Display with conditional styling */}
          <span className={`text-white text-xs px-3 py-1 rounded-full border-solid border-2 font-bold whitespace-nowrap ${sem === CURRENT_SEMESTER
            ? 'bg-yellow-600 border-yellow-500'
            : 'bg-sky-600 border-sky-500'}`}>
            {sem}
          </span>

          {/* Second Separator */}
          {((courseData.sched && courseData.sched.length > 0) ||
            (courseData.gened && courseData.gened.length > 0) ||
            (courseData.geneds && courseData.geneds.length > 0)) &&
            <span className="mx-2 h-6 w-0.5 bg-background-opposite-secondary rounded" />
          }

          {/* Schedule Type Display */}
          {courseData.sched && courseData.sched.map((s, i) => (
            <span className="text-white text-xs px-2 py-1 rounded-full border-solid border bg-purple-600 border-purple-800 whitespace-nowrap transition-all"
              key={i}>
              {s}
            </span>
          ))}

          {/* Gened Type Display - support both gened and geneds properties */}
          {courseData.gened && courseData.gened.map((gened, i) => (
            <span className="text-white text-xs px-2 py-1 rounded-full border-solid border bg-[#64919b] border-[#415f65] whitespace-nowrap transition-all"
              key={i}>
              {genedCodeToName(gened)}
            </span>
          ))}
          {courseData.geneds && courseData.geneds.map((gened, i) => (
            <span className="text-white text-xs px-2 py-1 rounded-full border-solid border bg-[#64919b] border-[#415f65] whitespace-nowrap transition-all"
              key={i}>
              {genedCodeToName(gened)}
            </span>
          ))}
        </div>

        {/* Replace the instructors display with the new component */}
        <CourseInstructors />
      </div>
    </>
  );
};

export default CourseHeader;
