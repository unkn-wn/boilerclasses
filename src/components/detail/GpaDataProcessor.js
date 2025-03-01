// Utility functions to process and format GPA data for display components
import { processGpaData, getColor } from '@/lib/gpaUtils';

export const processGpaDataForDisplay = (course) => {
  const grades = processGpaData(course);

  // Extract all unique semesters across all professors
  const allSemesters = new Set();
  Object.values(grades).forEach(instructorData => {
    Object.keys(instructorData).forEach(term => allSemesters.add(term));
  });

  // Sort semesters chronologically (oldest first)
  const sortedSemesters = Array.from(allSemesters).sort((a, b) => {
    const [aTerm, aYear] = a.split(' ');
    const [bTerm, bYear] = b.split(' ');

    // First compare years
    if (aYear !== bYear) return Number(aYear) - Number(bYear);

    // If same year, Spring comes before Fall
    if (aTerm === 'Spring' && bTerm === 'Fall') return -1;
    if (aTerm === 'Fall' && bTerm === 'Spring') return 1;

    return 0;
  });

  // Format the data for rendering
  const formattedData = Object.keys(grades).map(instructor => {
    // Calculate average GPA for this instructor
    let totalGpa = 0;
    let validSemesters = 0;

    sortedSemesters.forEach(semester => {
      const data = grades[instructor][semester];
      if (data?.gpa) {
        totalGpa += data.gpa;
        validSemesters++;
      }
    });

    const averageGpa = validSemesters > 0 ? totalGpa / validSemesters : null;

    return {
      name: instructor,
      averageGpa,
      semesterData: sortedSemesters.map(semester => {
        const data = grades[instructor][semester];
        return {
          semester,
          shortSemester: semester.split(" ")[0] + " '" + semester.split(" ")[1].substring(2, 4),
          gpa: data?.gpa || null,
          color: data?.color || null
        };
      }),
      gpas: Object.entries(grades[instructor]).map(([term, data]) => ({
        term: term.split(" ")[0] + " '" + term.split(" ")[1].substring(2, 4),
        value: data.gpa || null
      }))
    };
  });

  return {
    professorData: formattedData,
    semesters: sortedSemesters
  };
};

export default processGpaDataForDisplay;
