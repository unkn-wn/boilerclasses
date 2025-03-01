// Component that renders the course overview tab with instructor selector, stats, and GPA graph
import React from 'react';
import InstructorSelector from './InstructorSelector';
import CourseStats from './CourseStats';
import Graph from '@/components/graph';
import { useDetailContext } from '@/context/DetailContext';

const OverviewTabContent = ({ instructorStyles }) => {
  const {
    defaultGPA,
    selectableInstructors,
    selectedInstructors,
    refreshGraph,
    curGPA,
    curRMP,
    gpaGraph
  } = useDetailContext();

  return (
    <>
      <div className='flex flex-row gap-2 md:mb-4 mb-2'>
        {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 &&
          <InstructorSelector
            instructors={selectableInstructors}
            selectedInstructors={selectedInstructors}
            styles={instructorStyles}
            onChange={(value) => refreshGraph(value)}
          />
        }
      </div>

      {/* Stat Cards */}
      <CourseStats
        selectedInstructor={selectedInstructors[selectedInstructors.length - 1]}
        curGPA={curGPA}
        curRMP={curRMP}
      />

      {/* GPA Graph */}
      {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 ? (
        <div className='md:mt-4 mt-2 mb-4 h-96'>
          <Graph data={gpaGraph} />
        </div>
      ) : (
        <div className="lg:mt-6 md:mt-4 mt-2 mb-8 w-full h-full bg-background-secondary mx-auto p-4 rounded-xl">
          <p className='text-center'>No data!</p>
        </div>
      )}
    </>
  );
};

export default OverviewTabContent;
