import { getColor } from '@/lib/gpaUtils';
import { graphColors } from '@/lib/utils';

/**
 * Process GPA data from course object into a format usable by the GPA table and chart
 */
export const processGpaDataForDisplay = (course) => {
  if (!course || !course.gpa || Object.keys(course.gpa).length === 0) {
    return { professorData: [], semesters: [] };
  }

  // Extract all semesters across all professors
  const allSemesters = new Set();
  Object.values(course.gpa).forEach(semesterData => {
    Object.keys(semesterData).forEach(semester => {
      allSemesters.add(semester);
    });
  });

  // Sort semesters chronologically
  const sortedSemesters = Array.from(allSemesters).sort((a, b) => {
    const aYear = parseInt(a.split(' ')[1]);
    const bYear = parseInt(b.split(' ')[1]);

    if (aYear !== bYear) return bYear - aYear; // Most recent years first

    const seasonOrder = { 'Fall': 0, 'Summer': 1, 'Spring': 2 };
    return seasonOrder[a.split(' ')[0]] - seasonOrder[b.split(' ')[0]];
  });

  // Process data for each professor
  const professorData = Object.entries(course.gpa).map(([name, semData], index) => {
    // Calculate average GPA across all semesters
    let totalGpa = 0;
    let semesterCount = 0;
    const gpas = [];

    Object.entries(semData).forEach(([semester, gradeDistribution]) => {
      if (gradeDistribution[13] > 0) { // index 13 is the GPA
        totalGpa += gradeDistribution[13];
        semesterCount++;

        gpas.push({
          term: semester,
          value: gradeDistribution[13]
        });
      }
    });

    const averageGpa = semesterCount > 0 ? totalGpa / semesterCount : null;

    // Create data for each semester (including empty ones)
    const semesterData = sortedSemesters.map(semester => {
      if (semData[semester]) {
        const gpa = semData[semester][13];
        return {
          gpa,
          color: getColor(gpa)
        };
      }
      return { gpa: null, color: null };
    });

    // Assign a color from our palette
    const backgroundColor = graphColors[index % graphColors.length];

    return {
      name,
      averageGpa,
      semesterData,
      gpas,
      backgroundColor
    };
  });

  return {
    professorData,
    semesters: sortedSemesters
  };
};

export default processGpaDataForDisplay;
