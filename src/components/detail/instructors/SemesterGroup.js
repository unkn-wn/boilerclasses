import React from 'react';
import { motion } from 'framer-motion';
import InstructorItem from './InstructorItem';
import SemesterHeader from './SemesterHeader';
import { useInstructorContext } from '../context/InstructorContext';

const SemesterGroup = ({ semester, instructors }) => {
  const {
    searchQuery,
    expandedSemesters,
    toggleSemester,
    toggleAllInSemester,
    areAllInstructorsSelected
  } = useInstructorContext();

  // Filter instructors based on search query
  const filteredInstructors = instructors.filter(
    instructor => !searchQuery ||
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredInstructors.length === 0) return null;

  // Check if this semester is expanded
  const isExpanded = !!expandedSemesters[semester];

  // Check if all instructors are selected
  const isAllSelected = areAllInstructorsSelected(semester);

  return (
    <div className="mb-2">
      {/* Semester header with checkbox and chevron */}
      <SemesterHeader
        semester={semester}
        instructorsCount={filteredInstructors.length}
        isExpanded={isExpanded}
        onToggleExpanded={() => toggleSemester(semester)}
        isAllSelected={isAllSelected}
        onToggleSelectAll={(e) => toggleAllInSemester(semester, e)}
      />

      {/* Collapsible semester content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{
          height: { duration: 0.2, ease: "easeOut" },
          opacity: { duration: 0.2 }
        }}
        className="overflow-hidden"
      >
        <div className="space-y-1 mt-2">
          {filteredInstructors.map(instructor => (
            <InstructorItem
              key={instructor.name}
              professor={instructor}
              semester={semester}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SemesterGroup;
