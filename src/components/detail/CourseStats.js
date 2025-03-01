// Component displaying circular progress indicators for GPA and RateMyProfessors data
import React from 'react';
import AnimatedCircularProgress from '@/components/detail/AnimatedCircularProgress';

const CourseStats = ({ selectedInstructor, curGPA, curRMP }) => {
  return (
    <div className="flex flex-row md:gap-4 gap-2">
      <div className="relative flex-1 flex flex-col items-center bg-background mx-auto p-4 rounded-xl gap-2">
        {/* For when there is no GPA data for selected instructor */}
        {curGPA[selectedInstructor] && curGPA[selectedInstructor][0] === 0 &&
          <div className='absolute right-0 left-0 top-0 p-2 backdrop-blur-sm text-center'>
            <p className='text-secondary text-md font-bold text-center'>No data available for {selectedInstructor}</p>
            <p className='text-secondary text-xs font-light text-center'>Click on other tabs for more data!</p>
          </div>
        }

        {/* GPA circular stat */}
        <div className='w-full flex justify-center'>
          {selectedInstructor && curGPA[selectedInstructor] ? (
            <AnimatedCircularProgress
              value={curGPA[selectedInstructor][0]}
              maxValue={4}
              text={curGPA[selectedInstructor][0]}
              color={curGPA[selectedInstructor][1]}
              size={120}
              strokeWidth={10}
              duration={750}
            />
          ) : (
            <AnimatedCircularProgress
              value={0}
              maxValue={4}
              text=""
              color="rgb(var(--text-color))"
              size={120}
              strokeWidth={10}
            />
          )}
        </div>

        <p className='text-md font-bold text-primary mb-1 text-center'>Average GPA</p>
      </div>

      <div
        className={`relative flex-1 flex flex-col items-center bg-background mx-auto p-4 rounded-xl gap-2 ${selectedInstructor ? 'cursor-pointer hover:scale-[1.05] transition-all' : ''
          }`}
        onClick={selectedInstructor ? () => window.open(`https://www.ratemyprofessors.com/search/professors/783?q=${selectedInstructor}`, '_blank') : undefined}
      >
        {/* For when there is no RMP data for selected instructor */}
        {selectedInstructor && (!curRMP[selectedInstructor] || curRMP[selectedInstructor] === 0) &&
          <div className='absolute right-0 left-0 top-0 p-2 backdrop-blur-sm text-center'>
            <p className='text-secondary text-md font-bold text-center'>No rating available for {selectedInstructor}</p>
            <p className='text-secondary text-xs font-light text-center'>Click on <span className='text-yellow-500'>this</span> to open RMP!</p>
          </div>
        }

        {/* RMP circular stat */}
        <div className='w-full flex justify-center'>
          {selectedInstructor && curRMP[selectedInstructor] ? (
            <AnimatedCircularProgress
              value={curRMP[selectedInstructor]}
              maxValue={5}
              text={curRMP[selectedInstructor]}
              color={curGPA[selectedInstructor] ? curGPA[selectedInstructor][1] : `rgb(var(--text-color))`}
              size={120}
              strokeWidth={10}
              duration={750}
            />
          ) : (
            <AnimatedCircularProgress
              value={0}
              maxValue={5}
              text=""
              color="rgb(var(--text-color))"
              size={120}
              strokeWidth={10}
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
