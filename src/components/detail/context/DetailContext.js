import { createContext, useContext, useState, useEffect } from 'react';
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
  const [gpaGraph, setGpaGraph] = useState({});
  const [defaultGPA, setDefaultGPA] = useState({});
  const [selectableInstructors, setSelectableInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize data on component mount
  useEffect(() => {
    if (!courseData) return;

    const setupData = async () => {
      // Get all professors teaching the course
      const allProfs = collectAllProfessors(courseData.instructor);

      // Calculate grades and GPA for all professors
      const { grades, gpa } = calculateGradesAndGPA(
        allProfs,
        courseData.gpa,
      );

      // Initialize graph state
      setGpaGraph({
        labels,
        datasets: [],
      });

      // Set default GPA data
      setDefaultGPA({
        labels,
        datasets: grades,
      });

      // Set current GPA data
      setCurGPA(gpa);

      // Set list of all instructors
      setSelectableInstructors(allProfs);

      // Set initial semester
      setSem(initialSemester);

      // Select default instructor
      const semesterProfs = courseData.instructor[initialSemester] || [];
      const firstProf = semesterProfs.length > 0 ? semesterProfs[0] : allProfs[0];
      setSelectedInstructors([firstProf]);

      // Load initial graph for the first professor
      refreshGraph({ value: firstProf, label: firstProf });

      // Load RMP ratings
      const ratings = await loadRatingsForProfs(courseData);
      setCurRMP(ratings);

      // Done loading
      setLoading(false);
    };

    setupData();
  }, [courseData, initialSemester]);

  // Add this new effect to ensure graph updates once defaultGPA is populated
  useEffect(() => {
    // Only run when defaultGPA datasets is populated and we have selected instructors
    if (
      defaultGPA.datasets &&
      defaultGPA.datasets.length > 0 &&
      selectedInstructors.length > 0 &&
      !loading
    ) {
      // Refresh the graph with the currently selected instructors
      const instructorObjects = selectedInstructors.map(name => ({
        value: name,
        label: name
      }));

      refreshGraph(instructorObjects);
    }
  }, [defaultGPA.datasets]);

  // Function to refresh the graph when instructors change
  const refreshGraph = (instructors) => {
    const gpa = defaultGPA.datasets;
    if (!gpa || gpa.length === 0 || !instructors) return;

    const instructorNames = Array.isArray(instructors)
      ? instructors.map(inst => inst.value)
      : [instructors.value];

    setSelectedInstructors(instructorNames);

    try {
      const newgpa = gpa.filter(inst => {
        const isIncluded = instructors.some(instructor => instructor.label === inst.label.trim());
        return isIncluded;
      });

      setGpaGraph({
        labels,
        datasets: newgpa,
      });
    } catch (error) {
      console.error("Error filtering instructors", error);
    }
  };

  // Function to get searchable professor string for Reddit search
  const getSearchableProfString = () => {
    let ret = " OR ";
    courseData.instructor[sem]?.forEach((prof) => {
      const profSplit = prof.split(" ");
      ret += `"${profSplit[0]} ${profSplit[profSplit.length - 1]}" OR `;
    });
    return ret.substring(0, ret.length - 4);
  };

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
    loading,
    refreshGraph,
    getSearchableProfString
  };

  return (
    <DetailContext.Provider value={contextValue}>
      {children}
    </DetailContext.Provider>
  );
};
