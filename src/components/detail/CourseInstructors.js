import React, { useState, useEffect } from 'react';
import { useDetailContext } from './context/DetailContext';
import { getColor } from '@/lib/gpaUtils';
import { FiChevronDown, FiChevronUp, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';

const CourseInstructors = () => {
  const { courseData, sem, selectedInstructors, refreshGraph } = useDetailContext();
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterGroups, setSemesterGroups] = useState({});
  const [sortedSemesters, setSortedSemesters] = useState([]);

  // Process all instructor data and organize by semester
  useEffect(() => {
    if (!courseData || !courseData.instructor) return;

    // Build semester groups with instructors
    const groups = {};
    const allSemesters = new Set();

    // First collect all semesters and instructors
    Object.keys(courseData.instructor || {}).forEach(termName => {
      allSemesters.add(termName);

      if (!groups[termName]) {
        groups[termName] = [];
      }

      (courseData.instructor[termName] || []).forEach(professor => {
        // Get GPA data for this professor in this term if available
        let gpa = null;
        let color = null;

        if (courseData.gpa?.[professor]?.[termName]?.[13]) {
          gpa = courseData.gpa[professor][termName][13];
          color = getColor(gpa);
        }

        groups[termName].push({
          name: professor,
          gpa,
          color
        });
      });
    });

    // Sort semesters with most recent first
    const sorted = Array.from(allSemesters).sort((a, b) => {
      const a_split = a.split(" ");
      const b_split = b.split(" ");

      if (a_split[1] !== b_split[1]) {
        return b_split[1] - a_split[1]; // Year descending
      }

      const seasons = ["Spring", "Summer", "Fall"];
      return seasons.indexOf(b_split[0]) - seasons.indexOf(a_split[0]); // Season order
    });

    setSemesterGroups(groups);
    setSortedSemesters(sorted);
  }, [courseData]);

  const toggleProfessor = (professorName) => {
    const newSelection = selectedInstructors.includes(professorName)
      ? selectedInstructors.filter(name => name !== professorName)
      : [...selectedInstructors, professorName];

    refreshGraph(newSelection.map(name => ({ value: name, label: name })));
  };

  // Filter semesters and instructors based on search query
  const getFilteredSemesters = () => {
    if (!searchQuery) {
      return expanded ? sortedSemesters : [sem];
    }

    return sortedSemesters.filter(semester => {
      const instructors = semesterGroups[semester] || [];
      return instructors.some(instructor =>
        instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const filteredSemesters = getFilteredSemesters();

  const renderProfessorItem = (professor, semester) => {
    const isSelected = selectedInstructors.includes(professor.name);

    return (
      <div
        key={`${semester}-${professor.name}`}
        onClick={() => toggleProfessor(professor.name)}
        className={`
          group flex justify-between items-center py-1 px-2 rounded-lg
          cursor-pointer transition-all mr-2
          ${isSelected ? "bg-blue-500/10 hover:bg-blue-500/20" : "hover:bg-background-secondary/50"}
        `}
      >
        <div className='flex flex-row items-center gap-2'>
          {/* Checkbox */}
          <div className={`w-3 h-3 rounded-sm flex items-center justify-center
            ${isSelected ? "bg-blue-500" : "border border-gray-600"}`}
          >
            {isSelected && (
              <FiCheck className="w-2 h-2 text-white" />
            )}
          </div>

          <span className="text-sm font-medium">{professor.name}</span>
        </div>

        {/* GPA */}
        {professor.gpa !== null && (
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded text-white ml-1 w-10 text-center"
            style={{ backgroundColor: professor.color }}
          >
            {professor.gpa.toFixed(2)}
          </span>
        )}
      </div>
    );
  };

  // This simpler approach just uses one container with toggled content
  const currentSemInstructors = semesterGroups[sem] || [];
  const instructorsToShow = currentSemInstructors.slice(0, 2);
  const hasMore = currentSemInstructors.length > 2 || sortedSemesters.length > 1;

  if (Object.keys(semesterGroups).length === 0) return null;

  return (
    <div className="mt-2 mb-4">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-secondary font-medium text-sm">
          {expanded ? "All Instructors" : `${sem} Instructors`}
        </div>

        <div className="flex items-center gap-2">
          {selectedInstructors.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-background-secondary rounded-full">
              {selectedInstructors.length} selected
            </span>
          )}

          {/* Toggle button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-tertiary hover:text-secondary flex items-center transition-colors px-2 py-1 rounded-md hover:bg-background-secondary/30"
          >
            {expanded ? (
              <><FiChevronUp className="mr-1" /> Show Less</>
            ) : (
              <><FiChevronDown className="mr-1" /> Show More</>
            )}
          </button>
        </div>
      </div>

      {/* Current semester instructors - Only visible when collapsed */}
      {!expanded && (
        <div className="space-y-1 mb-3">
          {instructorsToShow.map(professor => renderProfessorItem(professor, sem))}

          {currentSemInstructors.length > 2 && (
            <button
              className="text-xs text-tertiary ml-6 mt-1 hover:text-secondary transition-colors"
              onClick={() => setExpanded(true)}
            >
              {currentSemInstructors.length - 2} more instructor(s)...
            </button>
          )}
        </div>
      )}

      {/* Expandable content */}
      <motion.div
        initial={false}
        animate={{
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={{
          height: { duration: 0.3, ease: "easeOut" },
          opacity: { duration: 0.2, delay: expanded ? 0.1 : 0 }
        }}
        className="overflow-hidden"
      >
        <div className="pt-2">
          {/* Search bar */}
          <div className="mb-3">
            <SearchBar
              placeholder="Filter instructors..."
              value={searchQuery}
              onChange={setSearchQuery}
              variant="compact"
            />
          </div>

          {/* All instructors in expanded view */}
          <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
            {/* Current semester (ALL instructors) */}
            {currentSemInstructors.length > 0 && (
              <div className="mb-2">
                <h4 className="text-sm font-semibold border-b border-yellow-500 pb-1 mb-2">
                  {sem} <span className="ml-2 text-xs font-normal text-tertiary">(Current)</span>
                </h4>
                <div className="space-y-1">
                  {currentSemInstructors.map(instructor =>
                    renderProfessorItem(instructor, sem)
                  )}
                </div>
              </div>
            )}

            {/* Other semesters */}
            {filteredSemesters
              .filter(semester => semester !== sem)
              .map(semester => {
                const instructors = semesterGroups[semester] || [];
                const filteredInstructors = instructors.filter(
                  instructor => !searchQuery ||
                    instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredInstructors.length === 0) return null;

                return (
                  <div key={semester} className="mb-2">
                    <h4 className="text-sm font-semibold border-b border-yellow-500 pb-1 mb-2">
                      {semester}
                    </h4>
                    <div className="space-y-1">
                      {filteredInstructors.map(instructor =>
                        renderProfessorItem(instructor, semester)
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CourseInstructors;
