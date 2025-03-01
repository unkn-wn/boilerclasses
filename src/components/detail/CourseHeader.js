// Component displaying the course title, code, and basic metadata
import React from 'react';
import { Icon } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';
import { stripCourseCode } from '@/pages/detail/[id]';

const CourseHeader = ({ courseData, sem, backOrHome, genedCodeToName }) => {
  return (
    <>
      <div className='flex flex-row gap-1'>
        {/* Back button */}
        <button
          onClick={backOrHome}
          className='lg:mt-1 md:mt-0.5 mr-1 h-fit hover:-translate-x-0.5 hover:text-secondary transition'>
          <Icon as={ChevronLeftIcon} alt="" boxSize={6} />
        </button>
        <p className="lg:text-3xl md:text-3xl text-xl font-bold mb-6">
          {courseData.subjectCode} {courseData.courseCode}: {courseData.title}
        </p>
      </div>

      <div className="flex flex-col gap-4 -mt-3 mb-1">
        <div className="flex flex-row flex-wrap gap-1 mb-1 items-center">
          {/* Credits Display */}
          <p className="text-sm text-secondary font-bold">
            {courseData.credits[0] === courseData.credits[1]
              ? `${courseData.credits[0]} Credits`
              : `${courseData.credits[0]} - ${courseData.credits[1]} Credits`}
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
          {(courseData.sched.length > 0 || courseData.gened.length > 0) &&
            <span className="mx-2 h-6 w-0.5 bg-background-opposite-secondary rounded" />
          }

          {/* Schedule Type Display */}
          {courseData.sched.map((s, i) => (
            <span className={`text-white text-xs px-2 py-1 rounded-full border-solid border bg-purple-600 border-purple-800 whitespace-nowrap transition-all`}
              key={i}>
              {s}
            </span>
          ))}

          {/* Gened Type Display */}
          {courseData.gened.map((gened, i) => (
            <span className={`text-white text-xs px-2 py-1 rounded-full border-solid border bg-[#64919b] border-[#415f65] whitespace-nowrap transition-all`}
              key={i}>
              {genedCodeToName(gened)}
            </span>
          ))}
        </div>

        {/* Instructors Display */}
        <div className="flex flex-wrap flex-row lg:text-sm text-sm text-blue-600 -mt-2 font-medium">
          <div className='mt-1'>
            <span className="text-secondary font-bold text-xs">{sem} Instructors: </span>
            {courseData.instructor[sem]?.map((prof, i) => (
              <span key={i}>
                <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${prof.split(" ")[0]} ${prof.split(" ")[prof.split(" ").length - 1]}`}
                  target="_blank" rel="noopener noreferrer"
                  className='underline decoration-dotted hover:text-blue-400 transition-all duration-300 ease-out'>
                  {prof}
                </a>
                {i < courseData.instructor[sem].length - 1 && ", "}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseHeader;
