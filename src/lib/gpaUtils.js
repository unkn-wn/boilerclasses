import { graphColors } from '@/lib/utils';

// get all professors of a course in an array
export const collectAllProfessors = (instructors) => {
    const allProfs = [];
    for (const semester in instructors) {
        for (const instructor of instructors[semester]) {
            if (!allProfs.includes(instructor)) {
                allProfs.push(instructor);
            }
        }
    }
    return allProfs;
};

// Helper to calculate GPA and grade distributions into this format (used for graph and general gpa displays):
// {
//     grades: [
//         {
//             label: "instr1",
//             data: [
//                3.11, 3.55, etc etc to 2 decimal places
//             ],
//             backgroundColor: "#ffffff" (based on graphColors)
//         }
//     ],
//     gpa: {
//         "instr1": [3.11, "#ffffff"],
//         "instr2": [3.55, "#ffffff"],
//     },
//     totalSemCount: 2,
// }
export const calculateGradesAndGPA = (profs, gpaData) => {
    const grades = [];
    const gpa = {};
    let colorIndex = 0;

    // Keep track of unique semesters
    const uniqueSemesters = new Set();

    for (const instructor of profs) {
        let avgGPA = 0;
        let avgGradeDist = Array(13).fill(0);
        const color = graphColors[colorIndex++ % graphColors.length];

        if (!gpaData[instructor]) {
            gpa[instructor] = [0, `rgb(var(--text-color))`];
            grades.push({
                label: instructor,
                data: avgGradeDist,
                backgroundColor: `rgb(var(--text-color))`,
            });
            continue;
        }

        let semesterCount = 0;
        for (const sem in gpaData[instructor]) {
            // Add to unique semester set
            uniqueSemesters.add(sem);

            avgGPA += gpaData[instructor][sem][13];
            avgGradeDist = avgGradeDist.map(
                (val, i) => val + gpaData[instructor][sem][i]
            );
            semesterCount++;
        }

        avgGradeDist = avgGradeDist.map((val) =>
            Math.round((val / semesterCount) * 100) / 100
        );

        gpa[instructor] = [
            Math.round((avgGPA / semesterCount) * 100) / 100,
            color,
        ];
        grades.push({
            label: instructor,
            data: avgGradeDist,
            backgroundColor: color,
        });
    }

    // Total count should be the number of unique semesters
    const totalSemCount = uniqueSemesters.size;

    return { grades, gpa, totalSemCount };
};

// Average all data for all professors into grade array format like above ^^
export const averageAllData = (grades) => {
    const avg = Array(13).fill(0);
    for (const grade of grades) {
        grade.data.forEach((val, i) => {
            avg[i] += val;
        });
    }

    return [{
        label: "Average",
        data: avg.map((val) => Math.round(val / grades.length * 100) / 100),
        backgroundColor: graphColors[2],
    }];
};

// Function to get color based on GPA
/**
 * Returns a color representing a GPA based on a specific visualization method
 * @param {number} gpa - The GPA value (0-4 scale)
 * @param {object} options - Optional configuration
 * @param {boolean} options.asRGB - Returns RGB format instead of hex
 * @returns {string} A color in hex format (or RGB if asRGB is true)
 */
export const getColor = (gpa, options = {}) => {
    // Handle null/undefined/zero GPA
    if (!gpa || gpa === 0) {
        return options?.asRGB ? 'rgb(var(--text-tertiary-color))' : `rgb(var(--background-color))`;
    }

    // Define the color stops based on GPA values
    const colorStops = [
        { gpa: 1.0, color: [71, 0, 0] },  // Very low - Darkest red
        { gpa: 2.25, color: [200, 30, 30] },  // Low - Red
        { gpa: 3.25, color: [218, 170, 0] },  // Medium - Yellow (#daaa00)
        { gpa: 4.0, color: [34, 197, 94] }   // High - Green (#22c55e)
    ];

    // Find the two color stops to interpolate between
    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
        if (gpa >= colorStops[i].gpa && gpa <= colorStops[i + 1].gpa) {
            lowerStop = colorStops[i];
            upperStop = colorStops[i + 1];
            break;
        }
    }

    // Calculate how far between the two stops the GPA falls (0-1)
    const range = upperStop.gpa - lowerStop.gpa;
    const normalizedPosition = range === 0 ? 0 : (gpa - lowerStop.gpa) / range;

    // Interpolate between the two colors
    const r = Math.round(lowerStop.color[0] + normalizedPosition * (upperStop.color[0] - lowerStop.color[0]));
    const g = Math.round(lowerStop.color[1] + normalizedPosition * (upperStop.color[1] - lowerStop.color[1]));
    const b = Math.round(lowerStop.color[2] + normalizedPosition * (upperStop.color[2] - lowerStop.color[2]));

    // Return in requested format
    if (options?.asRGB) {
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Convert to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Processes GPA data into this format, used for gpaModal.js
// {
//     "instr1": {
//         "Fall 21": {
//             gpa: 3.11,
//             color: "#ffffff" (based on getColor)
//         },
//         "Spring 21": {
//             gpa: 3.55,
//             color: "#ffffff"
//         }
//     }, etc
// }
export const processGpaData = (course, recentOnly = false) => {
    if (!course || Object.keys(course.gpa).length === 0) return {};

    const grades = {};
    const sems = [];

    for (const instructor in course.gpa) {
        for (const semester in course.gpa[instructor]) {
            if (!sems.includes(semester)) {
                sems.push(semester);
            }
        }
    }

    const sorted_sems = sems.sort((a, b) => {
        const a_split = a.split(" ");
        const b_split = b.split(" ");
        if (a_split[1] !== b_split[1]) {
            return a_split[1] - b_split[1];
        }

        const seasons = ["Spring", "Summer", "Fall"];
        return seasons.indexOf(a_split[0]) - seasons.indexOf(b_split[0]);
    });

    for (const instructor in course.gpa) {
        grades[instructor] = {};

        const instructorSemesters = sorted_sems;
        const recentSemesters = recentOnly
            ? instructorSemesters.slice(-5)
            : instructorSemesters;

        for (const semester of instructorSemesters) {
            if (!recentSemesters.includes(semester)) continue;

            if (!course.gpa[instructor][semester]) {
                grades[instructor][semester] = { gpa: 0, color: getColor(0) };
            } else {
                grades[instructor][semester] = {
                    gpa: course.gpa[instructor][semester][13],
                    color: getColor(course.gpa[instructor][semester][13]),
                };
            }
        }
    }

    return grades;
};


// Calculate overall GPA across all professors for a course, outputs
// {
//     gpa: 3.11,
//     color: "#ffffff" (based on getColor),
//     profCount: 2,
//     totalSemCount: 4,
// }
export const calculateOverallGPA = (courseData) => {
    const allProfs = [];
    let totalGpa = 0;
    let profCount = 0;

    try {
        // Get GPA for each professor
        for (const prof in courseData.gpa) {
            if (prof === '') continue;
            allProfs.push(prof);
        }

        const { gpa, totalSemCount } = calculateGradesAndGPA(allProfs, courseData.gpa);

        // Calculate average GPA across all professors
        for (const prof in gpa) {
            if (gpa[prof][0] !== 0) {
                totalGpa += gpa[prof][0];
                profCount++;
            }
        }

        const avgGpa = profCount > 0 ? (totalGpa / profCount).toFixed(2) : 0;
        return {
            gpa: avgGpa,
            color: getColor(avgGpa),
            profCount,
            totalSemCount,
        };
    } catch (e) {
        console.error("Overall GPA not found: ", e);
        return {
            gpa: 0,
            color: getColor(0),
            profCount: 0,
            totalSemCount: 0,
        };
    }
};

/**
 * Calculates grade distribution percentages from course data
 */
export const calculateGradeDistribution = (courseData) => {
    if (!courseData?.gpa) return null;

    // Initialize counters for each grade
    let gradeCount = {
        'A': 0,
        'B': 0,
        'C': 0,
        'D': 0,
        'F': 0,
    };

    let totalStudents = 0;

    // Sum up grades across all professors and semesters
    Object.keys(courseData.gpa).forEach(profName => {
        Object.keys(courseData.gpa[profName]).forEach(semester => {
            const semData = courseData.gpa[profName][semester];

            // Group grades: A=[0,1,2], B=[3,4,5], C=[6,7,8], D=[9,10,11], F=[12]
            gradeCount['A'] += (semData[0] || 0) + (semData[1] || 0) + (semData[2] || 0);
            gradeCount['B'] += (semData[3] || 0) + (semData[4] || 0) + (semData[5] || 0);
            gradeCount['C'] += (semData[6] || 0) + (semData[7] || 0) + (semData[8] || 0);
            gradeCount['D'] += (semData[9] || 0) + (semData[10] || 0) + (semData[11] || 0);
            gradeCount['F'] += (semData[12] || 0);

            // Add to total students
            for (let i = 0; i <= 12; i++) {
                totalStudents += (semData[i] || 0);
            }
        });
    });

    // Calculate percentages if we have students
    if (totalStudents > 0) {
        return {
            'A': Math.round((gradeCount['A'] / totalStudents) * 100),
            'B': Math.round((gradeCount['B'] / totalStudents) * 100),
            'C': Math.round((gradeCount['C'] / totalStudents) * 100),
            'D': Math.round((gradeCount['D'] / totalStudents) * 100),
            'F': Math.round((gradeCount['F'] / totalStudents) * 100)
        };
    }
    return null;
};

/**
 * Calculates grade distribution percentages for a specific instructor
 * @param {Array} gradeData - Array of grade counts [A+, A, A-, B+, B, B-, etc.]
 * @returns {object|null} Grade distribution percentages {A: x%, B: y%, ...}
 */
export const calculateInstructorGradeDistribution = (gradeData) => {
    if (!gradeData || !gradeData.some(val => val > 0)) return null;

    // Initialize counters for each grade
    let gradeCount = {
        'A': (gradeData[0] || 0) + (gradeData[1] || 0) + (gradeData[2] || 0),
        'B': (gradeData[3] || 0) + (gradeData[4] || 0) + (gradeData[5] || 0),
        'C': (gradeData[6] || 0) + (gradeData[7] || 0) + (gradeData[8] || 0),
        'D': (gradeData[9] || 0) + (gradeData[10] || 0) + (gradeData[11] || 0),
        'F': (gradeData[12] || 0)
    };

    // Calculate total students
    const totalStudents = Object.values(gradeCount).reduce((sum, count) => sum + count, 0);

    // Calculate percentages if we have students
    if (totalStudents > 0) {
        return {
            'A': Math.round((gradeCount['A'] / totalStudents) * 100),
            'B': Math.round((gradeCount['B'] / totalStudents) * 100),
            'C': Math.round((gradeCount['C'] / totalStudents) * 100),
            'D': Math.round((gradeCount['D'] / totalStudents) * 100),
            'F': Math.round((gradeCount['F'] / totalStudents) * 100)
        };
    }
    return null;
};