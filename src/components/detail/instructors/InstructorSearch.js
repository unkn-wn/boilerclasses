import React from 'react';
import { FiChevronsDown, FiChevronsUp } from 'react-icons/fi';
import SearchBar from '@/components/SearchBar';
import { useInstructorContext } from '../context/InstructorContext';
import { useDetailContext } from '../context/DetailContext';

const InstructorSearch = () => {
  const {
    searchQuery,
    setSearchQuery,
    expandAllSemesters,
    collapseAllSemesters
  } = useInstructorContext();

  const { selectedInstructors } = useDetailContext();

  return (
    <div className="flex items-center gap-2 mb-3">
      <SearchBar
        placeholder="Filter instructors..."
        value={searchQuery}
        onChange={setSearchQuery}
        variant="compact"
        className="flex-1"
      />

      {/* Selection count when expanded */}
      {selectedInstructors.length > 0 && (
        <span className="text-xs px-2 py-0.5 bg-background-secondary rounded-full whitespace-nowrap">
          {selectedInstructors.length} selected
        </span>
      )}

      <div className="flex gap-1">
        <button
          onClick={expandAllSemesters}
          className="text-xs text-tertiary hover:text-secondary p-0.5 transition-colors rounded hover:bg-background-secondary/20 flex items-center"
          title="Expand all semesters"
        >
          <FiChevronsDown size={14} />
        </button>
        <button
          onClick={collapseAllSemesters}
          className="text-xs text-tertiary hover:text-secondary p-0.5 transition-colors rounded hover:bg-background-secondary/20 flex items-center"
          title="Collapse all semesters"
        >
          <FiChevronsUp size={14} />
        </button>
      </div>
    </div>
  );
};

export default InstructorSearch;
