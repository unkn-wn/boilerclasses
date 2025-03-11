import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiExternalLink } from 'react-icons/fi';
import { useDetailContext } from '../context/DetailContext';
import { useInstructorContext } from '../context/InstructorContext';

const InstructorItem = ({ professor, semester }) => {
  const { curRMP, selectedInstructors } = useDetailContext();
  const { toggleProfessor } = useInstructorContext();

  const isSelected = selectedInstructors.includes(professor.name);
  const hasRmpData = curRMP && curRMP[professor.name];
  const rmpRating = hasRmpData && typeof curRMP[professor.name] === 'number'
    ? curRMP[professor.name]
    : null;

  // Get RMP URL for this professor
  const getRmpUrl = (name) => {
    if (curRMP && curRMP[name] && curRMP[name].link) {
      return curRMP[name].link;
    }
    // Fallback to search URL if we don't have a direct link
    const nameParts = name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return `https://www.ratemyprofessors.com/search/professors/783?q=${firstName} ${lastName}`;
  };

  return (
    <motion.div
      onClick={(e) => {
        if (e.target.closest('.rmp-link')) return;
        toggleProfessor(professor.name);
      }}
      className={`
        group flex justify-between items-center py-1.5 px-3 rounded-lg
        cursor-pointer transition-all mr-2 gap-2
        ${isSelected ? "bg-blue-500/10 hover:bg-blue-500/20 border-l-2 border-blue-500" :
                     "hover:bg-background-secondary/70 border-l-2 border-transparent"}
      `}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <div className='flex flex-row items-center gap-2 flex-1 min-w-0'>
        {/* Checkbox with enhanced styling */}
        <div
          className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center transition-all
            ${isSelected
              ? "bg-blue-500 shadow-sm shadow-blue-500/30"
              : "border border-gray-600 group-hover:border-gray-400"}`}
        >
          {isSelected && (
            <FiCheck className="w-2 h-2 text-white" />
          )}
        </div>

        {/* Professor name with optional RMP rating and link */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-1">
            <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-secondary group-hover:text-primary"}`}>
              {professor.name}
            </span>
          </div>

          {/* Show RMP rating badge if available */}
          {rmpRating && (
            <a
              href={getRmpUrl(professor.name)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="rmp-link ml-1 text-xs px-1.5 py-0.5 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center flex-shrink-0"
              title={`${professor.name} has a ${rmpRating.toFixed(1)}/5.0 rating on RateMyProfessors`}
            >
              {rmpRating.toFixed(1)}
              <FiExternalLink size={10} className="ml-1" />
            </a>
          )}
        </div>
      </div>

      {/* GPA with enhanced styling */}
      {professor.gpa !== null && (
        <div className="flex-shrink-0 relative">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-md text-white shadow-sm flex items-center justify-center w-11"
            style={{ backgroundColor: professor.color }}
            title={`Average GPA: ${professor.gpa.toFixed(2)}`}
          >
            {professor.gpa.toFixed(2)}
          </span>
          {/* Mini bar chart underneath showing GPA level */}
          <div className="h-0.5 w-full bg-background-tertiary/20 rounded-full mt-0.5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: professor.color,
                width: `${(professor.gpa / 4) * 100}%`
              }}
            ></div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InstructorItem;
