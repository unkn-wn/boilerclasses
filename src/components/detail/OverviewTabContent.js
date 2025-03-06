// Component that renders the course overview tab with instructor selector, stats, and GPA graph
import React, { memo } from 'react';
import InstructorSelector from './InstructorSelector';
import CourseStats from './CourseStats';
import Graph from '@/components/graph';
import { useDetailContext } from '@/components/detail/context/DetailContext';
import ProfessorComparisonChart from './ProfessorComparisonChart';

// Memoize the entire component to prevent unnecessary re-renders
const OverviewTabContent = memo(() => {
  const {
    defaultGPA,
    selectableInstructors,
    selectedInstructors,
    refreshGraph,
    gpaGraph,
  } = useDetailContext();

  // Check if we have datasets to display
  const hasDefaultGPAData = defaultGPA?.datasets &&
    Array.isArray(defaultGPA.datasets) &&
    defaultGPA.datasets.length > 0;

  return (
    <>
      <div className='flex flex-row gap-2 md:mb-4 mb-2'>
        {hasDefaultGPAData && (
          <InstructorSelector
            instructors={selectableInstructors}
            selectedInstructors={selectedInstructors}
            onChange={(value) => refreshGraph(value)}
          />
        )}
      </div>

      {/* Stat Cards */}
      <CourseStats />

      {/* GPA Graph */}
      {hasDefaultGPAData ? (
        <div className='md:mt-4 mt-2 mb-4'>
          <Graph data={gpaGraph} />
        </div>
      ) : (
        <div className="lg:mt-6 md:mt-4 mt-2 mb-8 w-full h-full bg-background-secondary mx-auto p-4 rounded-xl">
          <p className='text-center'>No data!</p>
        </div>
      )}

      {/* Professor GPA Comparison Chart */}
      <ProfessorComparisonChart />
    </>
  );
});

// Important: Set displayName for devtools and memo
OverviewTabContent.displayName = 'OverviewTabContent';

export default OverviewTabContent;
