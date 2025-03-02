import React, { useMemo } from 'react';
import { FiUsers } from 'react-icons/fi';
import { useDetailContext } from './context/DetailContext';
import OverallGpa from '@/components/OverallGpa';
import GradeDistributionBar from '@/components/GradeDistributionBar';
import { calculateGradeDistribution } from '@/lib/gpaUtils';

const CourseInfoPanel = () => {
  const { courseData } = useDetailContext();

  // Calculate grade distribution across all instructors
  const gradeDistribution = useMemo(() =>
    calculateGradeDistribution(courseData),
    [courseData]
  );

  // Get class sizes if available
  const classSizeInfo = useMemo(() => {
    if (!courseData || !courseData.classSizes) return null;

    const sizes = courseData.classSizes;
    return {
      average: sizes.reduce((a, b) => a + b, 0) / sizes.length,
      max: Math.max(...sizes),
      min: Math.min(...sizes),
      total: sizes.length
    };
  }, [courseData]);

  // Get professor count
  const professorCount = useMemo(() => {
    if (!courseData?.gpa) return null;
    return Object.keys(courseData.gpa).length;
  }, [courseData]);

  return (
    <div className="bg-background p-4 rounded-xl shadow flex flex-col h-full">
      <h3 className="text-md font-medium text-primary mb-3 border-b pb-2 border-background-secondary/30">
        Course Overview
      </h3>

      <div className="flex-1 flex flex-col gap-2">
        {/* Overall GPA and Grade Distribution section */}
        <div className="p-2 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-primary">Course GPA</h4>
            <div className="w-auto">
              <OverallGpa courseData={courseData} />
            </div>
          </div>

          {/* Grade Distribution using the extracted component */}
          {gradeDistribution && (
            <GradeDistributionBar gradeDistribution={gradeDistribution} />
          )}
        </div>

        {/* Course details section */}
        <div className="p-2 rounded-lg">
          <h4 className="text-sm font-medium text-primary mb-2">Course Details</h4>

          {/* Class size */}
          {classSizeInfo && (
            <div className="flex items-center mb-2">
              <div
                className="w-8 h-8 flex items-center justify-center rounded-full bg-background-secondary mr-2"
              >
                <FiUsers className="text-primary" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-tertiary">Class Size</span>
                <span className="text-sm font-medium">
                  Avg: {classSizeInfo.average.toFixed(0)} ·
                  Range: {classSizeInfo.min}-{classSizeInfo.max}
                </span>
              </div>
            </div>
          )}

          {/* Professor count */}
          {professorCount && (
            <div className="flex items-center">
              <div
                className="w-8 h-8 flex items-center justify-center rounded-full bg-background-secondary mr-2"
              >
                <FiUsers className="text-primary" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-tertiary">Instructors</span>
                <span className="text-sm font-medium">
                  {professorCount} {professorCount === 1 ? 'instructor' : 'instructors'} on record
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseInfoPanel;
