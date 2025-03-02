import React, { createContext, useContext, useState, useEffect } from 'react';
import { getColor } from '@/lib/gpaUtils';
import { useDetailContext } from './DetailContext';

// Create the context
const InstructorContext = createContext();

// Custom hook to use the instructor context
export const useInstructorContext = () => {
  const context = useContext(InstructorContext);
  if (!context) {
    throw new Error('useInstructorContext must be used within an InstructorProvider');
  }
  return context;
};

// Provider component that handles instructor selection and semester grouping
export const InstructorProvider = ({ children }) => {
  const { courseData, sem, selectedInstructors, refreshGraph } = useDetailContext();

  // Local state for UI interactions
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
  }, [expanded, sortedSemesters]);

  // Toggle a specific semester's expanded state
  const toggleSemester = (semester) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [semester]: !prev[semester]
    }));
  };

  // Function to select/deselect all instructors in a semester
  const toggleAllInSemester = (semester, e) => {
    // Prevent toggling the semester expansion
    if (e) e.stopPropagation();

    const instructorsInSemester = semesterGroups[semester] || [];
    const professorNames = instructorsInSemester.map(prof => prof.name);

    // Check if all professors in this semester are already selected
    const allSelected = professorNames.every(name =>
      selectedInstructors.includes(name)
    );

    let newSelection;
    if (allSelected) {
      // Deselect all professors in this semester
      newSelection = selectedInstructors.filter(name =>
        !professorNames.includes(name)
      );
    } else {
      // Select all professors in this semester
      const currentSet = new Set(selectedInstructors);
      professorNames.forEach(name => currentSet.add(name));
      newSelection = Array.from(currentSet);
    }

    // Update the selection in context
    refreshGraph(newSelection.map(name => ({ value: name, label: name })));
  };

  // Toggle a specific professor's selection
  const toggleProfessor = (professorName) => {
    const newSelection = selectedInstructors.includes(professorName)
      ? selectedInstructors.filter(name => name !== professorName)
      : [...selectedInstructors, professorName];

    refreshGraph(newSelection.map(name => ({ value: name, label: name })));
  };

  // Check if all instructors in a semester are selected
  const areAllInstructorsSelected = (semester) => {
    const instructors = semesterGroups[semester] || [];
    if (instructors.length === 0) return false;
    return instructors.every(instructor => selectedInstructors.includes(instructor.name));
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

  // Expand all semesters
  const expandAllSemesters = () => {
    const expandAll = {};
    sortedSemesters.forEach(semester => {
      expandAll[semester] = true;
    });
    setExpandedSemesters(expandAll);
  };

  // Collapse all semesters
  const collapseAllSemesters = () => {
    const collapseAll = {};
    sortedSemesters.forEach(semester => {
      collapseAll[semester] = false;
    });
    setExpandedSemesters(collapseAll);
  };

  // Toggle expanded state
  const toggleExpanded = (value = !expanded) => {
    setExpanded(value);
  };

  // Calculate relevant data for the UI
  const filteredSemesters = getFilteredSemesters();
  const currentSemInstructors = semesterGroups[sem] || [];
  const instructorsToShow = currentSemInstructors.slice(0, 2);
  const remainingInstructorsCount = currentSemInstructors.length - 2;

  const contextValue = {
    // UI state
    expanded,
    searchQuery,
    semesterGroups,
    sortedSemesters,
    expandedSemesters,
    filteredSemesters,

    // Calculated values
    currentSemesterInstructors: currentSemInstructors,
    instructorsToShow,
    remainingInstructorsCount,
    hasPreviousSemesters: sortedSemesters.length > 1,

    // Methods
    setSearchQuery,
    toggleExpanded,
    toggleSemester,
    toggleAllInSemester,
    toggleProfessor,
    areAllInstructorsSelected,
    expandAllSemesters,
    collapseAllSemesters
  };

  return (
    <InstructorContext.Provider value={contextValue}>
      {children}
    </InstructorContext.Provider>
  );
};
