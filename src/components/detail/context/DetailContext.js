import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { calculateGradesAndGPA, collectAllProfessors } from '@/lib/gpaUtils';
import { loadRatingsForProfs } from '@/components/RMP';
import { labels } from '@/lib/utils';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

// Create the context
const DetailContext = createContext();

// Custom hook to use the context
export const useDetailContext = () => {
  const context = useContext(DetailContext);
  if (!context) {
    throw new Error('useDetailContext must be used within a DetailProvider');
  }
  return context;
};

// Provider component that wraps the detail page components
export const DetailProvider = ({ children, courseData, initialSemester }) => {
  // All state variables for detail components
  const [selectedInstructors, setSelectedInstructors] = useState([]);
  const [curGPA, setCurGPA] = useState({});
  const [curRMP, setCurRMP] = useState({});
  const [sem, setSem] = useState(initialSemester);
  const [gpaGraph, setGpaGraph] = useState({ labels: [], datasets: [] });
  const [defaultGPA, setDefaultGPA] = useState({ labels: [], datasets: [] });
  const [selectableInstructors, setSelectableInstructors] = useState([]);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Memoize expensive calculations to prevent recalculation on re-renders
  const allProfs = useMemo(() => {
    if (!courseData?.instructor) return [];
    return collectAllProfessors(courseData.instructor);
  }, [courseData?.instructor]);

  // Memoize grade and GPA calculations
  const calculatedGPA = useMemo(() => {
    if (!courseData?.gpa || allProfs.length === 0) return { grades: [], gpa: {} };
    return calculateGradesAndGPA(allProfs, courseData.gpa);
  }, [courseData?.gpa, allProfs]);

  // Initialize basic data on component mount - separate from heavy processing
  useEffect(() => {
    if (!courseData) return;

    // Set initial semester
    setSem(initialSemester);

    // Set selectable instructors list
    setSelectableInstructors(allProfs);

    // Initialize empty graph structure
    setGpaGraph({ labels, datasets: [] });
  }, [courseData, initialSemester, allProfs]);

  // Handle GPA data initialization separately
  useEffect(() => {
    if (!calculatedGPA.grades.length) return;

    // Set default GPA data
    setDefaultGPA({
      labels,
      datasets: calculatedGPA.grades,
    });

    // Set current GPA data
    setCurGPA(calculatedGPA.gpa);

  }, [calculatedGPA]);

  // Select initial instructor after GPA data is loaded
  useEffect(() => {
    if (!defaultGPA.datasets.length || initializationComplete) return;

    // Select default instructor
    const semesterProfs = courseData?.instructor?.[initialSemester] || [];
    const firstProf = semesterProfs.length > 0 ? semesterProfs[0] : allProfs[0];

    if (firstProf) {
      setSelectedInstructors([firstProf]);
      refreshGraph({ value: firstProf, label: firstProf });
      setInitializationComplete(true);
    }
  }, [defaultGPA.datasets, courseData?.instructor, initialSemester, allProfs, initializationComplete]);

  // Load RMP ratings separately to not block initial rendering
  useEffect(() => {
    if (!courseData || !initializationComplete) return;

    const loadRatings = async () => {
      const ratings = await loadRatingsForProfs(courseData);
      setCurRMP(ratings);
    };

    loadRatings();
  }, [courseData, initializationComplete]);

  // Function to refresh the graph when instructors change - memoize to prevent recreations
  const refreshGraph = useCallback((instructors) => {
    const gpa = defaultGPA.datasets;
    if (!gpa || gpa.length === 0 || !instructors) return;

    const instructorNames = Array.isArray(instructors)
      ? instructors.map(inst => inst.value)
      : [instructors.value];

    setSelectedInstructors(instructorNames);

    try {
      const newgpa = gpa.filter(inst => {
        const isIncluded = Array.isArray(instructors)
          ? instructors.some(instructor => instructor.label === inst.label.trim())
          : instructors.label === inst.label.trim();
        return isIncluded;
      });

      setGpaGraph({
        labels,
        datasets: newgpa,
      });
    } catch (error) {
      console.error("Error filtering instructors", error);
    }
  }, [defaultGPA.datasets]);

  // Memoize searchable professor string to avoid recalculation
  const getSearchableProfString = useCallback(() => {
    if (!courseData?.instructor?.[sem]) return " OR ";

    let ret = " OR ";
    courseData.instructor[sem].forEach((prof) => {
      const profSplit = prof.split(" ");
      ret += `"${profSplit[0]} ${profSplit[profSplit.length - 1]}" OR `;
    });
    return ret.substring(0, ret.length - 4);
  }, [courseData?.instructor, sem]);

  // Value object to provide through context
  const contextValue = {
    courseData,
    selectedInstructors,
    curGPA,
    curRMP,
    sem,
    setSem,
    gpaGraph,
    defaultGPA,
    selectableInstructors,
    loading: !initializationComplete,
    refreshGraph,
    getSearchableProfString
  };

  return (
    <DetailContext.Provider value={contextValue}>
      {children}
    </DetailContext.Provider>
  );
};
