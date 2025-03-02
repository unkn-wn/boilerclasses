import React from 'react';
import { useDetailContext } from './context/DetailContext';
import CourseInfoPanel from './CourseInfoPanel';
import InstructorMetricsPanel from './InstructorMetricsPanel';

/**
 * Main component that displays course statistics including:
 * - Course info panel (left)
 * - Instructor metrics panel (right)
 */
const CourseStats = () => {
  const { selectedInstructors } = useDetailContext();

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* LEFT PANEL - COURSE INFO - Always shown */}
      <div className="col-span-5">
        <CourseInfoPanel />
      </div>

      {/* RIGHT PANEL - INSTRUCTOR METRICS - Conditional content */}
      <div className="col-span-7">
        {selectedInstructors.length > 0 ? (
          <InstructorMetricsPanel />
        ) : (
          <div className="bg-background p-4 rounded-xl shadow flex flex-col h-full">
            <h3 className="text-md font-medium text-primary mb-3 border-b pb-2 border-background-secondary/30">
              Instructor Metrics
            </h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-tertiary font-bold">Select an instructor to view metrics</p>
                <p className="text-xs text-tertiary mt-2">Add instructors using the search bar above</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStats;
