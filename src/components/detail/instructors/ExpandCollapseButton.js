import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useInstructorContext } from '../context/InstructorContext';

const ExpandCollapseButton = () => {
  const {
    expanded,
    toggleExpanded,
    remainingInstructorsCount,
    hasPreviousSemesters,
    sortedSemesters,
    isTransitioning
  } = useInstructorContext();

  // Enhanced styling with attention-grabbing styles during transition
  const buttonClassName = `w-full mt-2 py-2 px-3 text-sm
                transition-all flex items-center justify-center gap-2 rounded-lg
                ${isTransitioning
                  ? 'bg-background-tertiary text-white shadow-md'
                  : 'bg-background-secondary text-tertiary hover:text-secondary hover:bg-background-tertiary/50'}`;

  // Content for expand/collapse buttons
  const expandContent = (
    <>
      <FiChevronDown className={isTransitioning ? "text-white" : "text-tertiary"} />
      <span>
        {remainingInstructorsCount > 0 &&
          `${remainingInstructorsCount} more instructor${remainingInstructorsCount !== 1 ? 's' : ''}`}
        {remainingInstructorsCount > 0 && hasPreviousSemesters && ' + '}
        {hasPreviousSemesters &&
          `${sortedSemesters.length - 1} previous semester${sortedSemesters.length - 1 !== 1 ? 's' : ''}`}
      </span>
    </>
  );

  const collapseContent = (
    <>
      <FiChevronUp className={isTransitioning ? "text-white" : "text-tertiary"} size={16} />
      <span>Show Less</span>
    </>
  );

  return (
    <div className="relative z-10">
      {/* Using AnimatePresence with mode="sync" for crossfade effect */}
      <AnimatePresence mode="sync">
        <motion.button
          key={expanded ? "collapse" : "expand"}
          className={buttonClassName}
          onClick={() => toggleExpanded(!expanded)}
          // Animation that stays in place
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          // Interactive feedback
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
        >
          {expanded ? collapseContent : expandContent}
        </motion.button>
      </AnimatePresence>
    </div>
  );
};

export default ExpandCollapseButton;
