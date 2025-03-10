import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

const SemesterHeader = ({
  semester,
  instructorsCount,
  isExpanded,
  onToggleExpanded,
  isAllSelected,
  onToggleSelectAll
}) => {
  const isCurrentSemester = semester === CURRENT_SEMESTER;

  return (
    <div
      className={`flex items-center justify-between cursor-pointer pb-1 border-b
        ${isCurrentSemester ? 'border-yellow-500' : 'border-background-secondary'}`}
      onClick={onToggleExpanded}
    >
      <div className="flex items-center">
        {/* Select all checkbox */}
        <div
          className={`w-3 h-3 rounded-sm flex items-center justify-center mr-2
            ${isAllSelected ? "bg-blue-500" : "border border-gray-600"}`}
          onClick={(e) => onToggleSelectAll(e)}
        >
          {isAllSelected && (
            <FiCheck className="w-2 h-2 text-white" />
          )}
        </div>
        <h4 className="text-sm font-semibold">{semester}</h4>
        <span className="ml-2 text-xs text-tertiary">({instructorsCount})</span>

        {/* Current semester indicator */}
        {/* {isCurrentSemester && (
          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-600 px-1 rounded">
            Current
          </span>
        )} */}
      </div>

      {/* Animated chevron */}
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <FiChevronDown className="text-tertiary" size={16} />
      </motion.div>
    </div>
  );
};

export default SemesterHeader;
