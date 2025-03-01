// Component that renders course description and prerequisite information
import React from 'react';
import Prereqs from '@/components/prereqs';
import { stripCourseCode } from '@/pages/detail/[id]';

const CourseDescription = ({ courseData }) => {
  return (
    <>
      {/* Description */}
      <p className="lg:text-base text-sm text-secondary mt-1 mb-3 break-words">
        {courseData.description}
      </p>
      <h1 className="lg:text-sm text-xs text-tertiary mt-1 mb-3 break-words">
        Course {courseData.subjectCode} {stripCourseCode(courseData.courseCode)} from Purdue University - West Lafayette.
      </h1>

      {/* Prerequisites */}
      <div className='flex flex-row mb-4'>
        <Prereqs course={courseData} />
      </div>
    </>
  );
};

export default CourseDescription;
