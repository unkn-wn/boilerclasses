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
//     }
// }
export const calculateGradesAndGPA = (profs, gpaData) => {
    const grades = [];
    const gpa = {};
    let colorIndex = 0;

    for (const instructor of profs) {
        let avgGPA = 0;
        let avgGradeDist = Array(13).fill(0);
        const color = graphColors[colorIndex++ % graphColors.length];

        if (!gpaData[instructor]) {
            gpa[instructor] = [0, "#ffffff"];
            grades.push({
                label: instructor,
                data: avgGradeDist,
                backgroundColor: "#ffffff",
            });
            continue;
        }

        let semesterCount = 0;
        for (const sem in gpaData[instructor]) {
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
    return { grades, gpa };
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
export const getColor = (gpa) => {
    if (gpa === 0) {
        return "#18181b";
    }

    const perc = gpa / 4.0;
    const perc2 = perc * perc * 0.9;
    const color1 = [221, 170, 51];
    const color2 = [79, 0, 56];

    const w1 = perc2;
    const w2 = 1 - perc2;

    const r = Math.round(color1[0] * w1 + color2[0] * w2 * 1);
    const g = Math.round(color1[1] * w1 + color2[1] * w2 * 1);
    const b = Math.round(color1[2] * w1 + color2[2] * w2 * 1);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
//     color: "#ffffff" (based on getColor)
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

        const { gpa } = calculateGradesAndGPA(allProfs, courseData.gpa);

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
            color: getColor(avgGpa)
        };
    } catch (e) {
        console.error("Overall GPA not found: ", e);
        return {
            gpa: 0,
            color: getColor(0)
        };
    }
};