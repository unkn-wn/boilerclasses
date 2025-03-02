// Component displaying circular progress indicators for GPA and RateMyProfessors data
import React from 'react';
import AnimatedCircularProgress from '@/components/detail/AnimatedCircularProgress';
import { useDetailContext } from './context/DetailContext';

const CourseStats = () => {
  const { selectedInstructors, curGPA, curRMP } = useDetailContext();

  const selectedInstructor = selectedInstructors[selectedInstructors.length - 1];

  // Check if we have an instructor selected
  if (!selectedInstructor) {
    return (
      <div className="flex flex-row md:gap-4 gap-2">
        <div className="flex-1 flex flex-col items-center justify-center bg-background mx-auto p-4 rounded-xl h-48 shadow">
          <p className="text-tertiary text-md font-bold text-center">No instructor selected</p>
          <p className="text-tertiary text-xs font-light text-center">Select an instructor to view their statistics</p>
        </div>
      </div>
    );
  }

  // Check if we have GPA data for this instructor
  const hasGpaData = selectedInstructor &&
                     curGPA &&
                     curGPA[selectedInstructor] &&
                     curGPA[selectedInstructor][0] !== 0;

  // Check if we have RMP data for this instructor
  const hasRmpData = selectedInstructor &&
                     curRMP &&
                     curRMP[selectedInstructor] &&
                     curRMP[selectedInstructor] !== 0;

  return (
    <div className="flex flex-row md:gap-4 gap-2">
      {/* GPA CARD */}
      <div className="relative flex-1 flex flex-col items-center bg-background mx-auto p-4 rounded-xl gap-2 h-48 shadow">
        <div className="flex-1 items-center justify-center">
          {/* Show "No data available" message when no data */}
          {!hasGpaData ? (
            <div className='p-2 text-center'>
              <p className='text-secondary text-md font-bold text-center'>No GPA data for {selectedInstructor}</p>
              <p className='text-secondary text-xs font-light text-center'>Try selecting another professor!</p>
            </div>
          ) : (
            /* GPA circular stat */
            <AnimatedCircularProgress
              value={curGPA[selectedInstructor][0]}
              maxValue={4}
              text={curGPA[selectedInstructor][0].toFixed(2)}
              color={curGPA[selectedInstructor][1]}
              size={120}
              strokeWidth={10}
              duration={750}
            />
          )}
        </div>

        <p className='text-md font-bold text-primary mb-1 text-center'>Average GPA</p>
      </div>

      {/* RMP RATING CARD */}
      <div
        className={`relative flex-1 flex flex-col items-center bg-background mx-auto p-4 rounded-xl gap-2 h-48 shadow ${selectedInstructor ? 'cursor-pointer hover:scale-[1.05] transition-all' : ''}`}
        onClick={selectedInstructor ? () => window.open(`https://www.ratemyprofessors.com/search/professors/783?q=${selectedInstructor}`, '_blank') : undefined}
      >
        <div className="flex-1 items-center justify-center">
          {/* Show when no RMP data exists */}
          {!hasRmpData ? (
            <div className='p-2 text-center'>
              <p className='text-secondary text-md font-bold text-center'>No rating for {selectedInstructor}</p>
              <p className='text-secondary text-xs font-light text-center'><b className='font-bold'>Click</b> to search on RateMyProfessors!</p>
            </div>
          ) : (
            /* RMP circular stat */
            <AnimatedCircularProgress
              value={curRMP[selectedInstructor]}
              maxValue={5}
              text={curRMP[selectedInstructor].toFixed(1)}
              color={hasGpaData ? curGPA[selectedInstructor][1] : `rgb(var(--text-color))`}
              size={120}
              strokeWidth={10}
              duration={750}
            />
          )}
        </div>

        <p className='lg:hidden font-bold text-primary mb-1 text-center'>RateMyProf Rating</p>
        <p className='hidden lg:block font-bold text-primary mb-1 text-center'>RateMyProfessors Rating</p>
      </div>
    </div>
  );
};

export default CourseStats;
