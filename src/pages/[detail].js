import { semesters } from "../lib/utils"
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Select from 'react-select';

import {
  Image
} from '@chakra-ui/react'

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


const CardDetails = () => {
  const router = useRouter();
  if (!router.query.course) return;
  const course = JSON.parse(decodeURIComponent(router.query.course));
  console.log(course);

  // const [curInstructors, setCurInstructors] = useState([]);
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

    // setCurGPA((sem in course.gpa) ? course.gpa[sem] : []);
    // console.log(curGPA);
    // setCurInstructors(course.instructor[sem]);
    setSem(sem);
    availableSemesters.forEach((otherSem) => {
      if (otherSem !== sem) {
        try {
          document.getElementById(otherSem).classList.remove("bg-sky-300");
        } catch { }
      }
    });

    try {
      document.getElementById(sem).classList.add("bg-sky-300");
    } catch { }
  }

  useEffect(() => {
    if (course) {
      // Set graph
      const grades = [];
      const gpa = {};
      let curr = 0;
      for (const instructor in course.gpa) {

        gpa[instructor] = course.gpa[instructor][13];
        grades.push({
          label: instructor,
          data: course.gpa[instructor],
          backgroundColor: graphColors[(curr++) % graphColors.length]
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
  }, []);


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
  // console.log(perc2color((3.20 * 100 / 4.0)))
  // console.log(perc2color((2.3 * 100 / 4.0)))


  // Refresh graph when instructors change
  const refreshGraph = (instructors) => {
    const gpa = defaultGPA.datasets;
    if (!gpa || gpa.length === 0) return;

    const newgpa = gpa.filter(inst => {
      const isIncluded = instructors.some(instructor => instructor.label === inst.label.trim());
      return isIncluded;
    });

    setGpaGraph({
      labels,
      datasets: newgpa,
    });
  };

  return (
    <div className="bg-white overflow-auto h-screen p-5">
      <h2 className="lg:text-3xl md:text-3xl font-bold">{course.subjectCode} {course.courseCode}: {course.title}</h2>
      <br />
      <div className="flex flex-col gap-4 -mt-3 mb-2">
        {/* Credits Display */}
        <p className="text-sm text-gray-700 font-bold">
          {course.credits[0] === course.credits[1]
            ? `${course.credits[0]} Credits`
            : `${course.credits[0]} - ${course.credits[1]} Credits`}
        </p>
        {/* <p>{course.gpa[""]}</p> */}

        {/* Instructors Display */}
        <p className="lg:text-sm text-sm text-blue-600 -mt-3 font-medium">
          <span className="text-black font-normal text-xs">RateMyProfessor: </span>

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
                                    ${i === 0 ? "bg-sky-300" : ""} border-sky-500 whitespace-nowrap transition-all`}
            key={i}
            id={sem}
            onClick={() => changeInstructors(sem)}>{sem}</button>
        ))}
      </div>

      <p className="text-md text-gray-800 mb-4 break-words grow">{course.description}</p>
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
      {course.gened.length > 0 &&
        <div className="flex flex-row flex-wrap gap-1 mb-4">
          <span className={`text-md whitespace-nowrap transition-all`}>
            Satisfies general education requirements for:
          </span>
          {course.gened.map((gened, i) => (
            <span className={`text-md font-semibold whitespace-nowrap transition-all`}
              key={i}>
              {gened}{i != course.gened.length - 1 && ", "}
            </span>
          ))}
        </div>
      }



      <div className="flex flex-col">
        {/* GPA Graph */}
        {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 && (
          <div className="mt-2 mb-8 w-full h-full">
            <Select
              isMulti
              options={selectableInstructors.map((instructor) => ({ value: instructor, label: instructor }))}
              className="basic-multi-select w-full no-wrap"
              classNamePrefix="select"
              placeholder="Instructor..."
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
            <div className="h-96 w-full lg:w-1/2">
              <Bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Average Grades by Instructor',
                    },
                  },
                  scales: {
                    y: {
                      title: {
                        display: true,
                        text: '% of Students'
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
          </div>
        )}


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
      </div>
    </div>
  );


};

export default CardDetails;