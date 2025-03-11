import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDetailContext } from './context/DetailContext';

// Import refactored components
import InstructorItem from './instructors/InstructorItem';
import SemesterGroup from './instructors/SemesterGroup';
import ExpandCollapseButton from './instructors/ExpandCollapseButton';
import InstructorSearch from './instructors/InstructorSearch';
import { InstructorProvider, useInstructorContext } from './context/InstructorContext';

// Inner component that uses the instructor context
const CourseInstructorsContent = () => {
  const { sem } = useDetailContext();
  const {
    expanded,
    instructorsToShow,
    filteredSemesters,
    semesterGroups,
    selectedInstructors,
    isTransitioning
  } = useInstructorContext();

  return (
    <div className="mt-2 mb-4">
      {/* Header - Always visible with instructor count */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-secondary font-medium text-sm flex items-center gap-2">
          {expanded ? "All Instructors" : `${sem} Instructors`}
          {expanded ? null : (
            <span className="text-xs text-tertiary">
              ({semesterGroups[sem]?.length || 0})
            </span>
          )}
        </div>

        {!expanded && selectedInstructors && selectedInstructors.length > 0 && (
          <span className="text-xs px-2 py-0.5 bg-background-secondary rounded-full">
            {selectedInstructors.length} selected
          </span>
        )}
      </div>

      {/* Current semester instructors - Only visible when collapsed */}
      {!expanded && (
        <div className="space-y-1 mb-3">
          {/* Show the instructors */}
          {instructorsToShow.map(professor => (
            <InstructorItem
              key={professor.name}
              professor={professor}
              semester={sem}
            />
          ))}

          {/* Show More button */}
          <div className="mr-2">
            <ExpandCollapseButton />
          </div>
        </div>
      )}

      {/* Expandable content */}
      {expanded && (
        <div>
          <AnimatePresence>
            <motion.div
              key="expanded-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.5, ease: "easeInOut" },
                opacity: { duration: 0.2 }
              }}
              className="overflow-hidden"
            >
              {/* Search bar and controls */}
              <InstructorSearch />

              {/* All instructors in expanded view */}
              <div
                className="max-h-72 overflow-y-auto pr-2 space-y-4"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(var(--background-tertiary-color)) transparent'
                }}
              >
                {/* Add scroll indicator */}
                {filteredSemesters.length > 2 && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-t from-background to-transparent opacity-70 rounded-b-lg" />
                )}

                {/* Semester groups */}
                {filteredSemesters.map(semester => (
                  <SemesterGroup
                    key={semester}
                    semester={semester}
                    instructors={semesterGroups[semester] || []}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* "Show Less" button - With extra styling for better visibility */}
          <div className={`mr-2 mt-3 transition-all`}>
            <ExpandCollapseButton />
          </div>
        </div>
      )}
    </div>
  );
};

// Main component that provides the context
const CourseInstructors = () => {
  return (
    <InstructorProvider>
      <CourseInstructorsContent />
    </InstructorProvider>
  );
};

export default CourseInstructors;
