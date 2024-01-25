import { Inter } from 'next/font/google'
import { semesters } from "../../lib/utils"
const inter = Inter({ subsets: ['latin'] })
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ErrorPage from 'next/error'

import Select from 'react-select';
import ratings from '@mtucourses/rate-my-professors';

import { Image, cookieStorageManager } from '@chakra-ui/react'

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
import Head from 'next/head';




const CardDetails = () => {
  const router = useRouter();
  const [course, setCourse] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const params = new URLSearchParams({ detailId: router.query.id });
    fetch('/api/get?' + params)
      .then((res) => res.json())
      .then((data) => {
        if (data["course"]["documents"].length > 0) {
          setCourse(data["course"]["documents"][0].value);
          setSem(data["course"]["documents"][0].value.terms[0]);
          setLoading(false);
        } else {
          setLoading(false);
        }
      })
  }, [router.isReady])

  useEffect(() => {
    if (!course) return;
    // set graph
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

  }, [course])

  // Another UseEffect to asynchronously get RMP ratings
  useEffect(() => {
    if (!course) return;
    const rmp = {};
    for (const instructor in course.gpa) {
      getRMPRating(instructor).then((rating) => {
        setCurRMP((prevRMP) => {
          return { ...prevRMP, [instructor]: rating };
        });
      });

    }
  }, [course]);

  const [firstInstructor, setFirstInstructor] = useState("");
  const [curGPA, setCurGPA] = useState({});
  const [curRMP, setCurRMP] = useState({});
  const [sem, setSem] = useState("");
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


  // Get RateMyProfessor ratings for instructor
  async function getRMPRating(instructor) {
    if (!instructor) return;

    // Instructor in format "Last, First Middle", convert to "First Last"
    let instructorSplit = [];
    try {
      instructorSplit = instructor.split(", ");
      instructorSplit.push(instructorSplit[1].split(" ")[0]);
    } catch {
      return;
    }

    const name = instructorSplit[2] + " " + instructorSplit[0];

    try {
      const params = new URLSearchParams({ q: "Purdue University" });
      const responseSchools = await fetch("/api/ratings/searchSchool?" + params);
      const schools = await responseSchools.json();

      const profs = [];

      for (const school of schools["schools"]) {
        if (school.city === "West Lafayette") {
          const paramsTeacher = new URLSearchParams({ name: name, id: school.id });
          const responseProf = await fetch("/api/ratings/searchTeacher?" + paramsTeacher);
          const prof = await responseProf.json()
          if (!(prof["prof"] === undefined || prof["prof"].length == 0)) {
            profs.push(...prof["prof"]);
          }
        }
      }

      if (profs.length === 0) return 0;
      const paramsGetTeacher = new URLSearchParams({ id: profs[0].id });
      const responseRMP = await fetch("/api/ratings/getTeacher?" + paramsGetTeacher);
      const RMPrating = await responseRMP.json();
      return RMPrating["RMPrating"].avgRating;
    } catch {
      return;
    }


  }

  if (loading) {
    return (
      <></>
    )
  }

  if (!loading && JSON.stringify(course) == '{}') {
    return <ErrorPage statusCode={404} />
  }

  return (
    <>
      <Head>
        <title>{course.subjectCode} {course.courseCode}: {course.title} | BoilerClasses</title>
      </Head>
      <div className={`flex flex-col h-screen min-h-screen bg-black container mx-auto p-5 mt-5 ${inter.className} text-white`}>
        <div className="flex md:flex-row flex-col md:gap-4">

          {/* Left half of panel */}
          <div className="flex flex-col w-full md:mr-3">
            <p className="lg:text-3xl md:text-3xl text-xl font-bold">{course.subjectCode} {course.courseCode}: {course.title}</p>
            <br />
            <div className="flex flex-col gap-4 -mt-3 mb-2">
              <div className="flex flex-row flex-wrap gap-1 mb-1 items-center">

                {/* Credits Display */}
                <p className="text-sm text-gray-400 font-bold">
                  {course.credits[0] === course.credits[1]
                    ? `${course.credits[0]} Credits`
                    : `${course.credits[0]} - ${course.credits[1]} Credits`}
                </p>

                {/* Separator Display */}
                {(course.gened.length > 0 || course.sched.length > 0) && <span className="mx-2 h-6 w-0.5 bg-gray-400 rounded" />}

                {/* Schedule Type Display */}
                {course.sched.map((s, i) => (
                  <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-purple-600 border-purple-800 whitespace-nowrap transition-all`}
                    key={i}>
                    {s}
                  </span>
                ))}

                {/* Gened Type Display */}
                {course.gened.map((gened, i) => (
                  <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-sky-600 border-sky-800 whitespace-nowrap transition-all`}
                    key={i}>
                    {genedCodeToName(gened)}
                  </span>
                ))}

              </div>
              {/* <p>{course.gpa[""]}</p> */}

              {/* Instructors Display */}
              <p className="lg:text-sm text-sm text-blue-600 -mt-3 font-medium">
                <span className="text-gray-400 font-normal text-xs">RateMyProfessors: </span>

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
            <div className="flex flex-row flex-wrap gap-1 mb-1">
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

            <p className="lg:text-base text-sm text-gray-200 mt-1 mb-4 break-words grow">{course.description}</p>

          </div>


          {/* Right half of panel */}
          {defaultGPA.datasets.length > 0 && <div className="flex flex-col w-full ">


            {/* Instructor Select */}
            {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 &&
              <div className="lg:mb-6 md:mb-4 mb-2">
                <Select
                  isMulti
                  options={selectableInstructors.map((instructor) => ({ value: instructor, label: instructor }))}
                  className="basic-multi-select w-full no-wrap"
                  classNamePrefix="select"
                  placeholder="Instructor..."
                  menuPlacement='bottom'
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
            }


            {/* Stat Cards */}
            <div className="flex flex-row lg:gap-8 md:gap-4 gap-2">
              <div className="flex flex-col h-full w-full bg-gray-800 mx-auto p-4 rounded-xl gap-2">
                <p className='text-sm text-gray-400 mb-1'>Average GPA</p>
                <div className='md:w-1/2 m-auto'>
                  <CircularProgressbar
                    value={typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? 0 : curGPA[firstInstructor][0]}
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
              <div className="flex flex-col h-full w-full bg-gray-800 mx-auto p-4 rounded-xl gap-2">
                <p className='md:hidden text-sm text-gray-400 mb-1'>RateMyProf Rating</p>
                <p className='hidden md:block text-sm text-gray-400 mb-1'>RateMyProfessors Rating</p>
                <div className='md:w-1/2 m-auto'>
                  <CircularProgressbar
                    value={typeof firstInstructor === "undefined" || typeof curRMP[firstInstructor] === "undefined" ? 0 : curRMP[firstInstructor]}
                    maxValue={5}
                    text={typeof firstInstructor === "undefined" || typeof curRMP[firstInstructor] === "undefined" ? "" : curRMP[firstInstructor]}
                    styles={buildStyles({
                      pathColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                      textColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                      trailColor: '#000',
                    })}
                  />
                </div>
              </div>
            </div>


            {/* GPA Graph */}
            {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 && (
              <div className="lg:mt-6 md:mt-4 mt-2 mb-8 w-full h-96 bg-gray-800 mx-auto p-4 rounded-xl">
                <div className="h-full w-full mb-4">
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

              </div>
            )}

            {!(defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0) && (
              <div className="lg:mt-6 md:mt-4 mt-2 mb-8 w-full h-full bg-gray-800 mx-auto p-4 rounded-xl">
                <p className='text-center'>No data!</p>
              </div>
            )}
          </div>}
        </div>

        <div className='mt-auto'>
          <Footer />
        </div>
      </div>
    </>
  );


};

export default CardDetails;