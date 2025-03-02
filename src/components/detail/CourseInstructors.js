import React, { useState, useEffect } from 'react';
import { useDetailContext } from './context/DetailContext';
import { getColor } from '@/lib/gpaUtils';
import { FiChevronDown, FiChevronsDown, FiChevronUp, FiChevronsUp, FiCheck, FiExternalLink } from 'react-icons/fi';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';

const CourseInstructors = () => {
  // Get curRMP from context which contains RMP data
  const { courseData, sem, selectedInstructors, refreshGraph, curRMP } = useDetailContext();
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterGroups, setSemesterGroups] = useState({});
  const [sortedSemesters, setSortedSemesters] = useState([]);
  const [expandedSemesters, setExpandedSemesters] = useState({});

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

  // Reset expanded semesters when main component collapses
  useEffect(() => {
    if (!expanded) {
      setExpandedSemesters({});
    } else {
      // Auto-expand ALL semesters when expanding the component
      const expandAll = {};
      sortedSemesters.forEach(semester => {
        expandAll[semester] = true;
      });
      setExpandedSemesters(expandAll);
    }
  }, [expanded, sem, sortedSemesters]);

  const toggleProfessor = (professorName) => {
    const newSelection = selectedInstructors.includes(professorName)
      ? selectedInstructors.filter(name => name !== professorName)
      : [...selectedInstructors, professorName];

    refreshGraph(newSelection.map(name => ({ value: name, label: name })));
  };

  // Toggle a specific semester's expanded state
  const toggleSemester = (semester) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [semester]: !prev[semester]
    }));
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

  // Updated renderProfessorItem to include RMP link icon when available
  const renderProfessorItem = (professor, semester) => {
    const isSelected = selectedInstructors.includes(professor.name);

    // Check if RMP data exists for this professor
    const hasRmpData = curRMP && curRMP[professor.name];

    // Get RMP URL if available
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
      <div
        key={`${semester}-${professor.name}`}
        onClick={(e) => {
          // Don't trigger selection when clicking the RMP link icon
          if (e.target.closest('.rmp-link')) return;
          toggleProfessor(professor.name);
        }}
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

          {/* Professor name with optional RMP link */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{professor.name}</span>

            {/* Show RMP link icon only if RMP data exists */}
            {hasRmpData != 0 && (
              <a
                href={getRmpUrl(professor.name)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="rmp-link text-tertiary hover:text-secondary ml-1"
                title={`View ${professor.name} on RateMyProfessors`}
              >
                <FiExternalLink size={12} />
              </a>
            )}
          </div>
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

  // Expand all semesters button
  const expandAllSemesters = () => {
    const expandAll = {};
    sortedSemesters.forEach(semester => {
      expandAll[semester] = true;
    });
    setExpandedSemesters(expandAll);
  };

  // Collapse all semesters button
  const collapseAllSemesters = () => {
    const collapseAll = {};
    sortedSemesters.forEach(semester => {
      collapseAll[semester] = false;
    });
    setExpandedSemesters(collapseAll);
  };

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
        <div className="">
          {/* Search bar */}
          <div className="flex items-center gap-2">
            <SearchBar
              placeholder="Filter instructors..."
              value={searchQuery}
              onChange={setSearchQuery}
              variant="compact"
              className="flex-1"
            />
            <div className="flex gap-1">
              <button
                onClick={expandAllSemesters}
                className="text-xs text-tertiary hover:text-secondary p-1.5 transition-colors rounded hover:bg-background-secondary/20 flex items-center"
                title="Expand all semesters"
              >
                Expand <FiChevronsDown size={14} className="ml-1" />
              </button>
              <button
                onClick={collapseAllSemesters}
                className="text-xs text-tertiary hover:text-secondary p-1.5 transition-colors rounded hover:bg-background-secondary/20 flex items-center"
                title="Collapse all semesters"
              >
                Collapse <FiChevronsUp size={14} className="ml-1" />
              </button>
            </div>
          </div>

          {/* All instructors in expanded view */}
          <div
            className="max-h-72 overflow-y-auto pr-2 space-y-4 instructor-scrollable"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(var(--background-tertiary-color)) transparent'
            }}
          >
            {/* Add scroll indicator only when there's enough content to scroll */}
            {filteredSemesters.length > 2 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none bg-gradient-to-t from-background to-transparent opacity-70 rounded-b-lg" />
            )}

            {filteredSemesters
              .map(semester => {
                const instructors = semesterGroups[semester] || [];
                const filteredInstructors = instructors.filter(
                  instructor => !searchQuery ||
                    instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredInstructors.length === 0) return null;

                return (
                  <div key={semester} className="mb-2">
                    {/* Collapsible semester heading */}
                    <div
                      className="flex items-center cursor-pointer pb-1 border-b border-yellow-500"
                      onClick={() => toggleSemester(semester)}
                    >
                      <div className="flex items-center">
                        {expandedSemesters[semester] ? (
                          <FiChevronUp className="text-tertiary mx-1" size={16} />
                        ) : (
                          <FiChevronDown className="text-tertiary mx-1" size={16} />
                        )}
                        <h4 className="text-sm font-semibold">{semester}</h4>
                      </div>
                    </div>

                    {/* Collapsible semester content */}
                    <motion.div
                      initial={false}
                      animate={{
                        height: expandedSemesters[semester] ? 'auto' : 0,
                        opacity: expandedSemesters[semester] ? 1 : 0,
                      }}
                      transition={{
                        height: { duration: 0.2, ease: "easeOut" },
                        opacity: { duration: 0.2 }
                      }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 mt-2">
                        {filteredInstructors.map(instructor =>
                          renderProfessorItem(instructor, semester)
                        )}
                      </div>
                    </motion.div>
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
