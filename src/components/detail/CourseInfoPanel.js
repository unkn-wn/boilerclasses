import React, { useMemo } from 'react';
import { useDetailContext } from './context/DetailContext';
import { FiUsers, FiCalendar } from 'react-icons/fi';
import GradeDistributionBar from '@/components/GradeDistributionBar';
import OverallGpa from '@/components/OverallGpa';
import { calculateGradeDistribution, calculateOverallGPA } from '@/lib/gpaUtils';

const CourseInfoPanel = () => {
  const { courseData } = useDetailContext();

  // Calculate grade distribution across all instructors
  const gradeDistribution = useMemo(() =>
    calculateGradeDistribution(courseData),
    [courseData]
  );

  // Get overall GPA stats directly
  const gpaStats = useMemo(() =>
    calculateOverallGPA(courseData),
    [courseData]
  );

  return (
    <div className="bg-background p-4 rounded-xl shadow flex flex-col h-full">
      <h3 className="text-lg font-bold text-primary mb-3 border-b pb-2 border-background-secondary/30">
        Course Overview
      </h3>

      <div className="flex-1 flex flex-col">
        {/* GPA section - more prominent */}
        <div className="">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-primary">Course GPA</h4>

            {/* Use OverallGpa with pre-calculated data */}
            <OverallGpa preCalculatedData={gpaStats} card={false} />
          </div>

          {/* Grade Distribution using the extracted component */}
          {gradeDistribution && (
            <div className="mt-2">
              <GradeDistributionBar gradeDistribution={gradeDistribution} />
            </div>
          )}

          {/* Course metadata */}
          <h4 className="text-sm font-medium text-primary mb-2 mt-4">Data Averaged From:</h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Professor count */}
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-background-secondary/70 mr-2">
                <FiUsers className="text-primary" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-tertiary">Instructors</span>
                <span className="text-sm font-medium text-secondary">
                  {gpaStats.profCount} {gpaStats.profCount !== 1 ? 'instructors' : 'instructor'}
                </span>
              </div>
            </div>

            {/* Semester count */}
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-background-secondary/70 mr-2">
                <FiCalendar className="text-primary" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-tertiary">Semesters</span>
                <span className="text-sm font-medium text-secondary">
                  {gpaStats.totalSemCount} {gpaStats.totalSemCount !== 1 ? 'semesters' : 'semester'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseInfoPanel;
