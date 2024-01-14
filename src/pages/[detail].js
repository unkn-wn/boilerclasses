import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import { semesters } from "../lib/utils"
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Select from 'react-select';

import { Image } from '@chakra-ui/react'

import {
  CircularProgressbar, buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import { instructorStyles } from '@/lib/utils';
import { graphColors } from '@/lib/utils';
import { boilerExamsCourses } from '@/lib/utils';
import { labels } from '@/lib/utils';
import Footer from '@/components/footer';


const CardDetails = () => {
  const router = useRouter();
  if (!router.query.course) return;
  const course = JSON.parse(decodeURIComponent(router.query.course));

  const [firstInstructor, setFirstInstructor] = useState("");
  const [curGPA, setCurGPA] = useState({});
  const [sem, setSem] = useState(course.terms[0]);
  const [gpaGraph, setGpaGraph] = useState({});
  const [defaultGPA, setDefaultGPA] = useState({});
  const [selectableInstructors, setSelectableInstructors] = useState([]);


  const instructors = new Set();
  const availableSemesters = [];


  semesters.forEach((sem) => {
    try {
      course.instructor[sem].forEach((prof) => instructors.add(prof));
      if (course.terms.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch { }
  });

  const changeInstructors = (sem) => {

    setSem(sem);
    availableSemesters.forEach((otherSem) => {
      if (otherSem !== sem) {
        try {
          document.getElementById(otherSem).classList.remove("bg-sky-600");
        } catch { }
      }
    });

    try {
      document.getElementById(sem).classList.add("bg-sky-600");
    } catch { }
  }

  useEffect(() => {
    if (course) {
      // Set graph
      const grades = [];
      const gpa = {};
      let curr = 0;
      for (const instructor in course.gpa) {

        const color = graphColors[(curr++) % graphColors.length];

        gpa[instructor] = [course.gpa[instructor][13], color];
        grades.push({
          label: instructor,
          data: course.gpa[instructor],
          backgroundColor: color
        });

      }

      setGpaGraph({
        labels,
        datasets: grades
      });
      setDefaultGPA({
        labels,
        datasets: grades
      });
      setCurGPA(gpa);


      // Set selectable instructors

      const instrs = [];
      for (const instructor in course.gpa) {
        if (!instrs.includes(instructor)) {
          instrs.push(instructor);
        }
      }
      setSelectableInstructors(instrs);

      // set instructors
      changeInstructors(availableSemesters[0]);

    }
  }, []);


  // This is used to set default instructor on the multiselect
  useEffect(() => {
    refreshGraph([selectableInstructors[0]].map((instructor) => ({ value: instructor, label: instructor })));
    setFirstInstructor(selectableInstructors[0]);
  }, [selectableInstructors]);


  const getSearchableProfString = () => {
    //create ret string = ""
    //for each prof in curInstructors, add to ret string with " OR "

    let ret = " OR ";
    course.instructor[sem].forEach((prof) => {

      const profSplit = prof.split(" ");
      ret += `"${profSplit[0]} ${profSplit[profSplit.length - 1]}" OR `;


    });
    return ret.substring(0, ret.length - 4);

  }


  // Refresh graph when instructors change
  const refreshGraph = (instructors) => {
    const gpa = defaultGPA.datasets;
    if (!gpa || gpa.length === 0) return;

    setFirstInstructor(" ");
    try {
      setFirstInstructor(instructors[0].label);
    } catch {
      setFirstInstructor("");
    }


    const newgpa = gpa.filter(inst => {
      const isIncluded = instructors.some(instructor => instructor.label === inst.label.trim());
      return isIncluded;
    });

    setGpaGraph({
      labels,
      datasets: newgpa,
    });
  };


  // Function to replace gened codes with actual names
  const genedCodeToName = (code) => {
    const genedsOptions = [
      { label: "Behavioral/Social Science", value: "BSS" },
      { label: "Civics Literacy", value: "Civics Literacy" },
      { label: "Humanities", value: "Humanities" },
      { label: "JEDI", value: "JEDI" },
      { label: "Oral Communications", value: "OC" },
      { label: "Information Literacy", value: "IL" },
      { label: "Quantitative Reasoning", value: "QR" },
      { label: "Science", value: "Science" },
      { label: "Science Technology and Society", value: "STS" },
      { label: "Written Communication", value: "WC" }
    ]

    const gened = genedsOptions.filter(gened => gened.value === code);
    return gened[0].label;
  }


  return (
    <div className={`flex flex-col h-screen min-h-screen bg-black container mx-auto p-5 ${inter.className} text-white`}>
      <div className="flex md:flex-row flex-col md:gap-4">

        {/* Left half of panel */}
        <div className="flex flex-col w-full md:w-1/2">
          <h2 className="lg:text-3xl md:text-3xl font-bold">{course.subjectCode} {course.courseCode}: {course.title}</h2>
          <br />
          <div className="flex flex-col gap-4 -mt-3 mb-2">
            <div className="flex flex-row flex-wrap gap-3">

              {/* Credits Display */}
              <p className="text-sm text-gray-400 font-bold mt-0.5">
                {course.credits[0] === course.credits[1]
                  ? `${course.credits[0]} Credits`
                  : `${course.credits[0]} - ${course.credits[1]} Credits`}
              </p>


              {/* GenEds Display */}
              {course.gened.length > 0 &&
                <>
                  <span className="h-100 w-0.5 bg-gray-400 rounded"></span>

                  <div className="flex flex-row flex-wrap gap-1">
                    {course.gened.map((gened, i) => (
                      <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-sky-600 border-sky-800 whitespace-nowrap transition-all`}
                        key={i}>
                        {genedCodeToName(gened)}{i != course.gened.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </>
              }
            </div>
            {/* <p>{course.gpa[""]}</p> */}

            {/* Instructors Display */}
            <p className="lg:text-sm text-sm text-blue-600 -mt-3 font-medium">
              <span className="text-gray-400 font-normal text-xs">RateMyProfessor: </span>

              {course.instructor[sem].map((prof, i) => (
                <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${prof.split(" ")[0]} ${prof.split(" ")[prof.split(" ").length - 1]}`}
                  target="_blank" rel="noopener noreferrer"
                  className='underline decoration-dotted'
                  key={i}>
                  {prof}
                  {i < course.instructor[sem].length - 1 && ", "}
                </a>
              )
              )}
            </p>

          </div>

          {/* Semester Tags */}
          <div className="flex flex-row flex-wrap gap-1 mb-4">
            {availableSemesters.map((sem, i) => (
              <button className={`text-xs px-2 py-1 rounded-full border-solid border
                                        ${i === 0 ? "bg-sky-600" : ""} border-sky-800 whitespace-nowrap transition-all`}
                key={i}
                id={sem}
                onClick={() => changeInstructors(sem)}>{sem}</button>
            ))}
          </div>


          {/* Other Links Buttons */}
          <div className="flex flex-row flex-wrap">
            <a href={`https://www.reddit.com/r/Purdue/search/?q=${course.subjectCode}${course.courseCode.toString().replace(/00$/, '')} OR "${course.subjectCode} ${course.courseCode.toString().replace(/00$/, '')}" ${getSearchableProfString()}`} target="_blank" rel="noopener noreferrer"
              className="text-sm text-white px-5 py-2 mx-1 my-3 rounded-md whitespace-nowrap bg-orange-600 hover:bg-orange-800 transition-all">
              <div className="flex flex-row gap-2">
                <Image src="https://static-00.iconduck.com/assets.00/reddit-icon-512x450-etuh24un.png" alt="" boxSize={4} className="my-auto" />
                Reddit
              </div>
            </a>
            {boilerExamsCourses.includes(`${course.subjectCode}${course.courseCode}`) &&
              <a href={`https://www.boilerexams.com/courses/${course.subjectCode}${course.courseCode.toString()}/topics`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white px-5 py-2 mx-1 my-3 rounded-md whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 transition-all">
                <div className="flex flex-row gap-2">
                  <Image src="/boilerexams-icon.png" alt="" boxSize={4} className="my-auto filter" />
                  Boilerexams
                </div>
              </a>
            }
          </div>

          <p className="text-md text-gray-200 mt-4 mb-4 break-words grow">{course.description}</p>
          {/* {(curGPA) && (
              <p className="lg:text-sm text-sm mb-2 text-gray-800">
                <span className="text-black font-normal text-xs mb-2">BoilerGrades Average GPAs: </span>
                {Object.entries(curGPA).map(([instructor, GPA], i) => (
                  <p key={i}>
                    {instructor}: {GPA}
                  </p>
                ))}
              </p>
            )} */}
        </div>


        {/* Right half of panel */}
        <div className="flex flex-col w-full md:w-1/2">

          {/* Stat Cards */}
          <div className="grid grid-flow-col lg:gap-8 md:gap-4 gap-2">
            <div className="flex flex-col h-full w-full bg-gray-800 mx-auto p-4 rounded-xl">
              <p className='text-sm text-gray-400 mb-1'>Avg GPA</p>
              <div className='md:w-1/2 m-auto'>
                <CircularProgressbar
                  value={typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][0]}
                  maxValue={4}
                  text={typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][0]}
                  styles={buildStyles({
                    pathColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                    textColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                    trailColor: '#000',
                  })}
                />
              </div>
            </div>
            <div className="h-full w-full bg-gray-800 mx-auto p-4 rounded-xl">
              <div className='md:w-1/2 m-auto'>
                <CircularProgressbar value={3.0} maxValue={4} text={`GPA: ${3.0}`} />
              </div>
            </div>
          </div>


          {/* GPA Graph */}
          {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 && (
            <div className="lg:mt-8 md:mt-4 mt-2 mb-8 w-full h-full bg-gray-800 mx-auto p-4 rounded-xl">
              <div className="h-96 w-full mb-4">
                <Bar
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: "white"
                        }
                      },
                      title: {
                        display: true,
                        text: 'Average Grades by Instructor',
                        color: "white"
                      },
                    },
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: '% of Students',
                          color: "white"
                        },
                        grid: {
                          color: "gray"
                        }
                      },
                      x: {
                        grid: {
                          color: "gray"
                        }
                      }
                    }
                  }} data={gpaGraph}
                // {
                //   {
                //     labels,
                //     datasets: [{
                //       label: 'test1',
                //       data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                //       backgroundColor: 'rgba(53, 162, 235, 0.5)',
                //     }]
                //   }
                // }
                />
              </div>
              <Select
                isMulti
                options={selectableInstructors.map((instructor) => ({ value: instructor, label: instructor }))}
                className="basic-multi-select w-full no-wrap"
                classNamePrefix="select"
                placeholder="Instructor..."
                menuPlacement='top'
                defaultValue={
                  selectableInstructors.length > 0
                    ? [selectableInstructors[0]].map((instructor) => ({ value: instructor, label: instructor }))
                    : null
                }
                styles={instructorStyles}
                color="white"
                onChange={(value) => {
                  refreshGraph(value)
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className='mt-auto'>
        <Footer />
      </div>
    </div>
  );


};

export default CardDetails;