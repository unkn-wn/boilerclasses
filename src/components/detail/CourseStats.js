import React from 'react';
import { useDetailContext } from './context/DetailContext';
import CourseInfoPanel from './CourseInfoPanel';
import InstructorMetricsPanel from './InstructorMetricsPanel';

/**
 * Main component that displays course statistics including:
 * - Course info panel (left/top)
 * - Instructor metrics panel (right/bottom)
 * Responsively adapts layout for mobile devices
 */
const CourseStats = () => {
  const { selectedInstructors } = useDetailContext();

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-4">
      {/* COURSE INFO PANEL - Adjusted to have more space on md screens */}
      <div className="md:col-span-7 lg:col-span-5">
        <CourseInfoPanel />
      </div>

      {/* INSTRUCTOR METRICS PANEL - Adjusted for md screens */}
      <div className="md:col-span-5 lg:col-span-7 -mt-2 md:mt-0">
        {selectedInstructors.length > 0 ? (
          <InstructorMetricsPanel />
        ) : (
          <div className="bg-background p-4 rounded-xl shadow flex flex-col h-full">
            <h3 className="text-md font-medium text-primary mb-3 border-b pb-2 border-background-secondary/30">
              Instructor Metrics
            </h3>
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center px-4">
                <p className="text-tertiary font-bold">Select an instructor to view metrics</p>
                <p className="text-xs text-tertiary mt-1">
                  Add instructors using the search bar above or the list on this page
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStats;
