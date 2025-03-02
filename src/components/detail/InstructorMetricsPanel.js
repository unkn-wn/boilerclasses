import React from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { useDetailContext } from './context/DetailContext';
import AnimatedCircularProgress from './AnimatedCircularProgress';

const InstructorMetricsPanel = () => {
  const { selectedInstructors, curGPA, curRMP } = useDetailContext();

  // Use the last instructor in the array as the active one
  const selectedInstructor = selectedInstructors[selectedInstructors.length - 1];

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

  // Open RMP page for selected instructor
  const openRmpPage = () => {
    if (hasRmpData && selectedInstructor) {
      window.open(`https://www.ratemyprofessors.com/search/professors/783?q=${selectedInstructor}`, '_blank');
    }
  };

  return (
    <div className="bg-background p-4 rounded-xl shadow flex flex-col h-full">
      <h3 className="text-lg font-bold text-primary mb-3 border-b pb-2 border-background-secondary/30">
        {selectedInstructor} - Metrics
      </h3>

      <div className="flex-1 flex justify-center items-center">
        {/* Container for both dials */}
        <div className="flex items-center justify-center gap-8">
          {/* GPA DIAL */}
          <div className="flex flex-col items-center">
            {!hasGpaData ? (
              <div className="h-[130px] w-[130px] flex items-center justify-center bg-background-secondary/20 rounded-full">
                <p className="text-tertiary text-sm">No GPA</p>
              </div>
            ) : (
              <AnimatedCircularProgress
                value={curGPA[selectedInstructor][0]}
                maxValue={4}
                text={curGPA[selectedInstructor][0].toFixed(2)}
                color={curGPA[selectedInstructor][1]}
                size={130}
                strokeWidth={10}
                duration={750}
              />
            )}
            <p className="mt-3 text-sm font-medium text-secondary">Average GPA</p>
          </div>

          {/* RMP DIAL */}
          <div
            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
            onClick={openRmpPage}
          >
            {!hasRmpData ? (
              <div className="h-[130px] w-[130px] flex items-center justify-center bg-background-secondary/20 rounded-full">
                <p className="text-tertiary text-sm text-center">Click to<br/>search RMP</p>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <AnimatedCircularProgress
                  value={curRMP[selectedInstructor]}
                  maxValue={5}
                  text={curRMP[selectedInstructor].toFixed(1)}
                  color={hasGpaData ? curGPA[selectedInstructor][1] : `rgb(var(--text-color))`}
                  size={130}
                  strokeWidth={10}
                  duration={750}
                />
              </div>
            )}
            <p className="mt-3 text-sm font-medium text-secondary flex items-center">
              RateMyProf
              <FiExternalLink size={12} className="ml-1 opacity-70" />
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-tertiary text-center">
        {!hasGpaData && !hasRmpData ?
          "No rating data available for this instructor" :
          "Click RateMyProf to view detailed reviews"
        }
      </div>
    </div>
  );
};

export default InstructorMetricsPanel;
