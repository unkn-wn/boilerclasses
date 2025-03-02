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
    sortedSemesters
  } = useInstructorContext();

  // Styling and animation properties shared by both buttons
  const sharedButtonProps = {
    className: `w-full mt-2 py-2 px-3 text-sm text-tertiary hover:text-secondary
                bg-background-secondary hover:bg-background-tertiary/50
                rounded-lg transition-all flex items-center justify-center gap-2`,
    whileHover: { scale: 1.01, y: -1 },
    whileTap: { scale: 0.99 },
    transition: { type: "spring", stiffness: 400, damping: 20 },
  };

  return (
    <AnimatePresence mode="wait">
      {expanded ? (
        <motion.button
          key="collapse"
          {...sharedButtonProps}
          onClick={() => toggleExpanded(false)}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <FiChevronUp className="mr-2 text-tertiary" />
          Show Less
        </motion.button>
      ) : (
        <motion.button
          key="expand"
          {...sharedButtonProps}
          onClick={() => toggleExpanded(true)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <FiChevronDown className="text-tertiary" />
          <span>
            {remainingInstructorsCount > 0 &&
              `${remainingInstructorsCount} more instructor${remainingInstructorsCount !== 1 ? 's' : ''}`}
            {remainingInstructorsCount > 0 && hasPreviousSemesters && ' + '}
            {hasPreviousSemesters &&
              `${sortedSemesters.length - 1} previous semester${sortedSemesters.length - 1 !== 1 ? 's' : ''}`}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ExpandCollapseButton;
