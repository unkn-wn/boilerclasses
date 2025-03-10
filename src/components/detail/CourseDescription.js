// Component that renders course description and prerequisite information
import React from 'react';
import { stripCourseCode } from '@/lib/utils';
import { useDetailContext } from '@/components/detail/context/DetailContext';

const CourseDescription = () => {
  const { courseData } = useDetailContext();

  if (!courseData) return null;

  return (
    <>
      {/* Description */}
      <p className="lg:text-base text-sm text-secondary mt-1 mb-3 break-words">
        {courseData.description}
      </p>
      <h1 className="lg:text-sm text-xs text-tertiary mt-1 mb-3 break-words">
        Course {courseData.subjectCode} {stripCourseCode(courseData.courseCode)} from Purdue University - West Lafayette.
      </h1>
    </>
  );
};

export default CourseDescription;
