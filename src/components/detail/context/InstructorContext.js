import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  const [expandedSemesters, setExpandedSemesters] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Memoize semester groups to avoid recalculation on every render
  const { semesterGroups, sortedSemesters } = useMemo(() => {
    if (!courseData?.instructor) {
      return { semesterGroups: {}, sortedSemesters: [] };
    }

    // Build semester groups with instructors
    const groups = {};
    const allSemesters = new Set();

    // First collect all semesters and instructors
    Object.keys(courseData.instructor).forEach(termName => {
      allSemesters.add(termName);

      if (!groups[termName]) {
        groups[termName] = [];
      }

      // Process instructors for this term
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

    return { semesterGroups: groups, sortedSemesters: sorted };
  }, [courseData?.instructor, courseData?.gpa]);

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

  // Toggle a specific semester's expanded state - memoize to avoid function recreation
  const toggleSemester = useCallback((semester) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [semester]: !prev[semester]
    }));
  }, []);

  // Function to select/deselect all instructors in a semester - memoize
  const toggleAllInSemester = useCallback((semester, e) => {
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
  }, [semesterGroups, selectedInstructors, refreshGraph]);

  // Toggle a specific professor's selection - memoize
  const toggleProfessor = useCallback((professorName) => {
    const newSelection = selectedInstructors.includes(professorName)
      ? selectedInstructors.filter(name => name !== professorName)
      : [...selectedInstructors, professorName];

    refreshGraph(newSelection.map(name => ({ value: name, label: name })));
  }, [selectedInstructors, refreshGraph]);

  // Check if all instructors in a semester are selected - memoize
  const areAllInstructorsSelected = useCallback((semester) => {
    const instructors = semesterGroups[semester] || [];
    if (instructors.length === 0) return false;
    return instructors.every(instructor => selectedInstructors.includes(instructor.name));
  }, [semesterGroups, selectedInstructors]);

  // Memoize filtered semesters based on search query
  const filteredSemesters = useMemo(() => {
    if (!searchQuery) {
      return expanded ? sortedSemesters : [sem];
    }

    return sortedSemesters.filter(semester => {
      const instructors = semesterGroups[semester] || [];
      return instructors.some(instructor =>
        instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery, expanded, sortedSemesters, sem, semesterGroups]);

  // Expand all semesters - memoize
  const expandAllSemesters = useCallback(() => {
    const expandAll = {};
    sortedSemesters.forEach(semester => {
      expandAll[semester] = true;
    });
    setExpandedSemesters(expandAll);
  }, [sortedSemesters]);

  // Collapse all semesters - memoize
  const collapseAllSemesters = useCallback(() => {
    const collapseAll = {};
    sortedSemesters.forEach(semester => {
      collapseAll[semester] = false;
    });
    setExpandedSemesters(collapseAll);
  }, [sortedSemesters]);

  // Toggle expanded state with transition state management - memoize
  const toggleExpanded = useCallback((value = !expanded) => {
    // Set transitioning state to highlight button during animation
    setIsTransitioning(true);

    // Set expanded state
    setExpanded(value);

    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 700); // Slightly longer than animation to ensure button stays highlighted
  }, [expanded]);

  // Memoize current semester instructors
  const currentSemInstructors = useMemo(() =>
    semesterGroups[sem] || [],
    [semesterGroups, sem]
  );

  // Memoize instructors to show
  const instructorsToShow = useMemo(() =>
    currentSemInstructors.slice(0, 2),
    [currentSemInstructors]
  );

  // Memoize remaining instructors count
  const remainingInstructorsCount = useMemo(() =>
    currentSemInstructors.length - 2,
    [currentSemInstructors]
  );

  // Memoize whether there are previous semesters
  const hasPreviousSemesters = useMemo(() =>
    sortedSemesters.length > 1,
    [sortedSemesters]
  );

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    // UI state
    expanded,
    searchQuery,
    semesterGroups,
    sortedSemesters,
    expandedSemesters,
    filteredSemesters,
    isTransitioning,

    // Calculated values
    currentSemesterInstructors: currentSemInstructors,
    instructorsToShow,
    remainingInstructorsCount,
    hasPreviousSemesters,

    // Methods
    setSearchQuery,
    toggleExpanded,
    toggleSemester,
    toggleAllInSemester,
    toggleProfessor,
    areAllInstructorsSelected,
    expandAllSemesters,
    collapseAllSemesters
  }), [
    expanded,
    searchQuery,
    semesterGroups,
    sortedSemesters,
    expandedSemesters,
    filteredSemesters,
    isTransitioning,
    currentSemInstructors,
    instructorsToShow,
    remainingInstructorsCount,
    hasPreviousSemesters,
    toggleExpanded,
    toggleSemester,
    toggleAllInSemester,
    toggleProfessor,
    areAllInstructorsSelected,
    expandAllSemesters,
    collapseAllSemesters
  ]);

  return (
    <InstructorContext.Provider value={contextValue}>
      {children}
    </InstructorContext.Provider>
  );
};
