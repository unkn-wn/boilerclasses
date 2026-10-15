import React from 'react';
import { useDetailContext } from '@/components/detail/context/DetailContext';
import { Image } from '@chakra-ui/react';
import { boilerExamsCourses, stripCourseCode } from '@/lib/utils';

const CourseLinks = () => {
  const { courseData, getSearchableProfString } = useDetailContext();

  if (!courseData) return null;

  const catalogParams = new URLSearchParams({
    search_database: 'Search',
    search_db: 'Search',
    location: '3', // Courses
    'filter[keyword]': `${courseData.subjectCode} ${courseData.courseCode}`,
    'filter[exact_match]': '1',
  });

  return (
    <div className="flex flex-row flex-wrap gap-2 my-1">
      {/* Reddit Link */}
      <a href={`https://www.reddit.com/r/Purdue/search/?q=${courseData.subjectCode}${stripCourseCode(courseData.courseCode)} OR "${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}" ${getSearchableProfString()}`}
         target="_blank"
         rel="noopener noreferrer"
         className="text-sm text-white px-5 py-2 rounded-md whitespace-nowrap bg-orange-600 hover:bg-orange-700 transition-all duration-300 ease-out">
        <div className="flex flex-row gap-2">
          <Image src="/reddit-icon.png" alt="Reddit" boxSize={4} className="my-auto" />
          Reddit
        </div>
      </a>

      {/* Purdue Catalog Link */}
      <a href={`https://catalog.purdue.edu/search_advanced.php?${catalogParams}`}
         target="_blank"
         rel="noopener noreferrer"
         className="text-sm text-white px-5 py-2 rounded-md whitespace-nowrap bg-yellow-600 hover:bg-yellow-700 transition-all duration-300 ease-out">
        <div className="flex flex-row gap-2">
          <Image src="/purdue-icon.png" alt="Purdue Catalog" boxSize={4} className="my-auto" />
          Catalog
        </div>
      </a>

      {/* Boilerexams Link (conditionally rendered) */}
      {boilerExamsCourses.includes(`${courseData.subjectCode}${courseData.courseCode}`) &&
        <a href={`https://www.boilerexams.com/courses/${courseData.subjectCode}${courseData.courseCode.toString()}/topics`}
           target="_blank"
           rel="noopener noreferrer"
           className="text-sm text-white px-5 py-2 rounded-md whitespace-nowrap bg-[#b89f71] hover:bg-[#9d8c6e] transition-all duration-300 ease-out">
          <div className="flex flex-row gap-2">
            <Image src="/boilerexams-icon.png" alt="Boilerexams" boxSize={4} className="my-auto filter" />
            Boilerexams
          </div>
        </a>
      }
    </div>
  );
};

export default CourseLinks;
