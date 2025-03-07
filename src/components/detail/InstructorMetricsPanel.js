import React, { useMemo } from 'react';
import { FiExternalLink, FiCalendar } from 'react-icons/fi';
import { useDetailContext } from './context/DetailContext';
import AnimatedCircularProgress from './AnimatedCircularProgress';
import { Tooltip } from '@chakra-ui/react';

const InstructorMetricsPanel = () => {
  const { courseData, selectedInstructors, curGPA, curRMP } = useDetailContext();

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

  // Calculate the number of semesters for this instructor's GPA
  const semesterCount = useMemo(() => {
    if (!hasGpaData || !courseData?.gpa || !selectedInstructor) return 0;

    const instructorData = courseData.gpa[selectedInstructor] || {};
    return Object.keys(instructorData).length;
  }, [courseData, selectedInstructor, hasGpaData]);

  // Open RMP page for selected instructor
  const openRmpPage = () => {
    if (selectedInstructor) {
      window.open(`https://www.ratemyprofessors.com/search/professors/783?q=${selectedInstructor}`, '_blank');
    }
  };

  return (
    <div className="bg-background p-4 rounded-xl shadow flex flex-col h-full">
      <h3 className="text-lg font-bold text-primary mb-3 border-b pb-2 border-background-secondary/30">
        {selectedInstructor} - Metrics
      </h3>

      <div className="flex-1 flex justify-center items-center">
        {/* Container for both dials - stack on md (tablet) screens only */}
        <div className="flex flex-row md:flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
          {/* GPA DIAL with tooltip */}
          <Tooltip
            isDisabled={!hasGpaData}
            label={
              <div className="flex items-center gap-2 p-1">
                <FiCalendar className="text-blue-300" />
                <span>Averaged from <b>{semesterCount}</b> {semesterCount === 1 ? 'semester' : 'semesters'}</span>
              </div>
            }
            bg="rgba(var(--background-secondary-color))"
            color="rgb(var(--text-color))"
            borderRadius="md"
            placement="bottom"
            hasArrow
          >
            <div className={`flex flex-col items-center transition-transform ${hasGpaData && 'hover:scale-105 cursor-help'}`}>
              {!hasGpaData ? (
                <div className="h-[100px] w-[100px] md:h-[110px] md:w-[110px] lg:h-[130px] lg:w-[130px] flex items-center justify-center bg-background-secondary/20 rounded-full">
                  <p className="text-tertiary text-sm">No GPA</p>
                </div>
              ) : (
                <AnimatedCircularProgress
                  value={curGPA[selectedInstructor][0]}
                  maxValue={4}
                  text={curGPA[selectedInstructor][0].toFixed(2)}
                  color={curGPA[selectedInstructor][1]}
                  size={window.innerWidth < 768 ? 100 : (window.innerWidth < 1024 ? 110 : 130)}
                  strokeWidth={window.innerWidth < 768 ? 8 : (window.innerWidth < 1024 ? 8 : 10)}
                  duration={750}
                />
              )}
              <p className="mt-2 md:mt-3 text-xs md:text-sm font-medium text-secondary">Average GPA</p>
            </div>
          </Tooltip>

          {/* RMP DIAL */}
          <div
            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
            onClick={openRmpPage}
          >
            {!hasRmpData ? (
              <div className="h-[100px] w-[100px] md:h-[110px] md:w-[110px] lg:h-[130px] lg:w-[130px] flex items-center justify-center bg-background-secondary/20 rounded-full">
                <p className="text-tertiary text-xs md:text-sm text-center">No rating<br/>found!</p>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <AnimatedCircularProgress
                  value={curRMP[selectedInstructor]}
                  maxValue={5}
                  text={curRMP[selectedInstructor].toFixed(1)}
                  color={hasGpaData ? curGPA[selectedInstructor][1] : `rgb(var(--text-color))`}
                  size={window.innerWidth < 768 ? 100 : (window.innerWidth < 1024 ? 110 : 130)}
                  strokeWidth={window.innerWidth < 768 ? 8 : (window.innerWidth < 1024 ? 8 : 10)}
                  duration={750}
                />
              </div>
            )}
            <p className="mt-2 md:mt-3 text-xs md:text-sm font-medium text-secondary flex items-center">
              RateMyProf
              <FiExternalLink size={12} className="ml-1 opacity-70" />
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-tertiary text-center">
        {!hasGpaData && !hasRmpData ?
          "No rating data available for this instructor" :
          ""
        }
      </div>
    </div>
  );
};

export default InstructorMetricsPanel;
