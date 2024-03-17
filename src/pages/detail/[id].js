import { Inter } from 'next/font/google'
import { semesters, subjects } from "../../lib/utils"
const inter = Inter({ subsets: ['latin'] })
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ErrorPage from 'next/error'

import Select from 'react-select';

import { Image, cookieStorageManager, Icon } from '@chakra-ui/react'
import { FaHome } from "react-icons/fa";

import {
  CircularProgressbar, buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";



import { instructorStyles, graphColors, boilerExamsCourses, labels } from '@/lib/utils';
import Footer from '@/components/footer';
import Head from 'next/head';
import Calendar from '../../components/calendar';
import Graph from '../../components/graph';
import InfoModal from '@/components/infoModal';


const CardDetails = ({courseData, semData}) => {
  const router = useRouter();
  const [course, setCourse] = useState(courseData);
  const [loading, setLoading] = useState(true);

  const parsePrereqs = (prereq, i) => {

    if (prereq.split(' ').length == 2) {
      const detailId = prereq.split(' ')[0]
      const concurrent = prereq.split(' ')[1]
      const subjectCodeMatch = detailId.match(/[A-Z]+/);
      if (!subjectCodeMatch) {
        return null;
      }
      const subjectCode = subjectCodeMatch[0];

      const subject = subjects.find((s) => s == subjectCode);
      const courseNumberMatch = detailId.match(/\d+/);
      if (!courseNumberMatch) {
        return null;
      }
      const courseNumber = courseNumberMatch[0];
      return (
        <span className='' key={i}>
          <a href={`/detail/${detailId}`}
            target="_blank" rel="noopener noreferrer"
            className='underline decoration-dotted hover:text-blue-400 transition-all duration-300 ease-out text-blue-600'>
            {subjectCode}  {courseNumber}
          </a>
          {concurrent == "True" ? " [may be taken concurrently]" : ""}
        </span>
      )
    } else if (prereq.split(' ').length == 3) {
      const concurrent = prereq.split(' ')[1]
      return `${prereq.split(' ')[0]} ${prereq.split(' ')[1]}${concurrent == "True" ? " [may be taken concurrently]" : ""}`
    } else {
      return `${"()".includes(prereq) ? "" : " "}${prereq}${"()".includes(prereq) ? "" : " "}`;
    }

  }

  // useEffect(() => {
  //   if (!router.isReady) return;

  //   const params = new URLSearchParams({ detailId: router.query.id });
  //   fetch('/api/get?' + params)
  //     .then((res) => res.json())
  //     .then((data) => {
  //       if (data["course"]["documents"].length > 0) {
  //         setCourse(data["course"]["documents"][0].value);
  //         setSem(data["course"]["documents"][0].value.terms[0]);
  //         setLoading(false);
  //       } else {
  //         setLoading(false);
  //       }
  //     })
  // }, [router.isReady])

  useEffect(() => {
    if (!course) return;
    // set descriptions to none if it's html

    if (course.description && course.description.startsWith("<a href=")) {
      setCourse({ ...course, description: "No Description Available" });
    }

    // set graph
    const grades = [];
    const gpa = {};
    let curr = 0;
    for (const instructor in course.gpa) {

      const color = graphColors[(curr++) % graphColors.length];

      const tmp = {}
      for (const sem in course.gpa[instructor]) {
        tmp[sem] = [course.gpa[instructor][sem][13], color];
        gpa[instructor] = tmp;
        grades.push({
          label: instructor + "__" + semNameCodeConvert(sem),
          data: course.gpa[instructor][sem],
          backgroundColor: color
        });
      }

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

    setLoading(false);

  }, [router.isReady])

  // Another UseEffect to asynchronously get RMP ratings
  useEffect(() => {
    if (!course) return;
    for (const instructor in course.gpa) {
      getRMPRating(instructor).then((rating) => {
        setCurRMP((prevRMP) => {
          return { ...prevRMP, [instructor]: rating };
        });
      });

    }
  }, [router.isReady]);

  const [firstInstructor, setFirstInstructor] = useState("");
  const [curGPA, setCurGPA] = useState({});
  const [curRMP, setCurRMP] = useState({});
  const [sem, setSem] = useState(semData);
  const [gpaGraph, setGpaGraph] = useState({});
  const [defaultGPA, setDefaultGPA] = useState({});
  const [selectableInstructors, setSelectableInstructors] = useState([]);

  const [infoModal, setInfoModal] = useState(false);


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
    refreshGraph([selectableInstructors[0]].map((instructor) => ({ value: instructor, label: instructor })), sem);
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
  /*

  THIS IMPLEMENTATION DOES NOT WORK for multiple selected profs

  i cannot get the closest sem for multiple profs, so this only works for 1
  it is still very very slow, probably something is looping too much

  alternative solution:
  - have dropdown for semesters, default on avg
  - ignore if the prof is not in the semester, just dont show it if it isnt

  - with avg gpa, default to show avg for prof
  - if the avg gpa exists in semester, show it
  - if its not, just show average?

  what gpa looks like:
{
   "Brinton, Christopher G.":{
      "Fall 2021":[
         8.3,
         ...
         2.84
      ]
   },
   "Qiu, Qiang":{
      "Fall 2021":[
         2.7,
         57.3,
         ...
         0.75,
         3.45
      ],
      "Fall 2022":[
         9,
         22.5,
         ...,
         3.4,
         3.02
      ],
      "Spring 2022":[
         9.9,
         1.3,
         ...
         4.6,
         3.01
      ]
   }

  */
  const refreshGraph = (instructors, semester) => {
    const gpa = defaultGPA.datasets;
    if (!gpa || gpa.length === 0) return;

    setFirstInstructor(" ");
    try {
      setFirstInstructor(instructors[0].label);
    } catch {
      setFirstInstructor("");
    }

    const [targetTerm, targetYear] = semNameCodeConvert(semester).split("_").map(Number);

    // Initialize variables for closest semester
    let closestSemester = null;
    let closestDifference = Infinity;

    // Filter GPA data for selected instructors
    const selectedInstructors = gpa.filter(inst => {
      const instructorLabel = inst.label.trim().split("__")[0];
      return instructors.some(instructor => instructor.label.trim() === instructorLabel);
    });

    // Find closest semester
    selectedInstructors.forEach(inst => {
      const [instructorTerm, instructorYear] = inst.label.trim().split("__")[1].split("_").map(Number);
      const yearDifference = Math.abs(targetYear - instructorYear);
      const termDifference = Math.abs(targetTerm - instructorTerm);
      const totalDifference = yearDifference * 2 + termDifference;

      if (totalDifference < closestDifference) {
        closestDifference = totalDifference;
        closestSemester = inst;
      }
    });

    try {
      // Filter GPA data for the closest semester
      const filteredGpa = gpa.filter(inst => inst.label === closestSemester.label);
      setFirstInstructor(closestSemester.label.split("__")[0]); // Set the first instructor

      // Update the graph with filtered GPA data
      setGpaGraph({
        labels,
        datasets: filteredGpa,
      });
    } catch {
      // If there's an error, reset the graph
      setGpaGraph({
        labels,
        datasets: [],
      });
    }
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


  // Function to replace semester name with code and vice versa
  const semNameCodeConvert = (name) => {
    try {
      name = name.split(" ");
    } catch {
      name = name.split("_");
    }
    if (name[0] === "Fall") return "01_" + name[1];
    if (name[0] === "Spring") return "02_" + name[1];
    if (name[0] === "01") return "Fall " + name[1];
    if (name[0] === "02") return "Spring " + name[1];
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

  if (JSON.stringify(course) == '{}') {
    return <ErrorPage statusCode={404} />
  }

  const renderPrereqs = () => {
    try {
      return (
        (course.prereqs && course.prereqs[0].split(' ')[0] != router.query.id) && <p className="lg:text-sm text-xs text-gray-400 mb-4 font-medium">
          <span className="text-gray-400 lg:text-sm text-xs">Prerequisites: </span>
          {course.prereqs.map((prereq, i) => parsePrereqs(prereq, i))}
        </p>
      );
    } catch (error) {
      console.log(course.prereqs);
      return <></>;
    }
  }

  return (
    <>
      <Head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-48L6TGYD2L"></script>
        <script>
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-48L6TGYD2L');`}
        </script>
        <title>{`${courseData.subjectCode} ${courseData.courseCode}: ${courseData.title} | BoilerClasses`}</title>
        <meta name="title" content={`${courseData.subjectCode} ${courseData.courseCode}: ${courseData.title} | BoilerClasses`} />
        <meta name="description" content={`${courseData.description}`} />
        <meta name="keywords" content={`${courseData.subjectCode}, ${courseData.courseCode}, ${courseData.subjectCode} ${courseData.courseCode}, ${courseData.title}, ${courseData.description.split(' ')}`} />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <meta property="og:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
        <meta property="og:type" content="website" />
        <meta name="og:title" content={`${courseData.subjectCode} ${courseData.courseCode}: ${courseData.title} | BoilerClasses`} />
        <meta name="og:description" content={`${courseData.description}`}/>
        <meta property="og:image" content={
            "https://boilerclasses.com/api/og?" +
              'sub=' + encodeURIComponent(courseData.subjectCode) +
              '&course=' + encodeURIComponent(courseData.courseCode) +
              '&title=' + encodeURIComponent(courseData.title) +
              '&credits=' + encodeURIComponent(courseData.credits[1]) +
              '&prof=' + encodeURIComponent(courseData.instructor[semData][0]) +
              '&sem=' + encodeURIComponent(semData)
            } />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="boilerclasses.com" />
        <meta property="twitter:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
        <meta name="twitter:title" content={`${courseData.subjectCode} ${courseData.courseCode}: ${courseData.title} | BoilerClasses`} />
        <meta name="twitter:description" content={`${courseData.description}`}/>
        <meta property="twitter:image" content={
            "https://boilerclasses.com/api/og?" +
            'sub=' + encodeURIComponent(courseData.subjectCode) +
            '&course=' + encodeURIComponent(courseData.courseCode) +
            '&title=' + encodeURIComponent(courseData.title) +
            '&credits=' + encodeURIComponent(courseData.credits[1]) +
            '&prof=' + encodeURIComponent(courseData.instructor[semData][0]) +
            '&sem=' + encodeURIComponent(semData)
          } />

      </Head>
      <InfoModal isOpen={infoModal} onClose={setInfoModal} />
      <div className={`flex flex-col h-screen min-h-screen bg-neutral-950 container mx-auto p-5 mt-5 ${inter.className} text-white`}>
        <div className="flex md:flex-row flex-col md:gap-4">

          {/* Left half of panel */}
          <div className="flex flex-col w-full md:mr-3 justify-start h-full">
            <div className='flex flex-row gap-1'>
              <a href="https://boilerclasses.com" className='lg:mt-1 md:mt-0.5 mr-1 h-fit hover:-translate-x-0.5 transition'>
                <Icon as={FaHome} alt="" boxSize={6} />
              </a>
              <p className="lg:text-3xl md:text-3xl text-xl font-bold mb-6">{course.subjectCode} {course.courseCode}: {course.title}</p>
            </div>

            <div className="flex flex-col gap-4 -mt-3 mb-1">
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

                {/* Latest Semester Display */}
                <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-sky-600 border-sky-800 whitespace-nowrap transition-all`}>
                  {sem}
                </span>

                {/* Gened Type Display */}
                {course.gened.map((gened, i) => (
                  <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-[#64919b] border-[#415f65] whitespace-nowrap transition-all`}
                    key={i}>
                    {genedCodeToName(gened)}
                  </span>
                ))}

              </div>
              {/* <p>{course.gpa[""]}</p> */}

              {/* Instructors Display */}
              <p className="lg:text-sm text-sm text-blue-600 -mt-3 font-medium">
                <span className="text-gray-400 font-bold text-xs">RateMyProfessors: </span>

                {course.instructor[sem].map((prof, i) => (
                  <>
                    <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${prof.split(" ")[0]} ${prof.split(" ")[prof.split(" ").length - 1]}`}
                      target="_blank" rel="noopener noreferrer"
                      className='underline decoration-dotted hover:text-blue-400 transition-all duration-300 ease-out'
                      key={i}>
                      {prof}
                    </a>
                    {i < course.instructor[sem].length - 1 && ", "}
                  </>
                )
                )}
              </p>
            </div>


            {/* Semester Tags */}
            {/* <div className="flex flex-row flex-wrap gap-1 mb-1">
              {availableSemesters.map((sem, i) => (
                <button className={`text-xs px-2 py-1 rounded-full border-solid border
                                          ${i === 0 ? "bg-sky-600" : ""} border-sky-800 whitespace-nowrap transition-all`}
                  key={i}
                  id={sem}
                  onClick={() => changeInstructors(sem)}>{sem}</button>
              ))}
            </div>
             */}

            {/* Other Links Buttons */}
            <div className="flex flex-row flex-wrap my-2">
              <a href={`https://www.reddit.com/r/Purdue/search/?q=${course.subjectCode}${course.courseCode.toString().replace(/00$/, '')} OR "${course.subjectCode} ${course.courseCode.toString().replace(/00$/, '')}" ${getSearchableProfString()}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white px-5 py-2 mx-1 my-1 rounded-md whitespace-nowrap bg-orange-600 hover:bg-orange-800 transition-all duration-300 ease-out">
                <div className="flex flex-row gap-2">
                  <Image src="https://static-00.iconduck.com/assets.00/reddit-icon-512x450-etuh24un.png" alt="" boxSize={4} className="my-auto" />
                  Reddit
                </div>
              </a>
              <a href={`https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202420&subj_code_in=${course.subjectCode}&crse_numb_in=${course.courseCode}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white px-5 py-2 mx-1 my-1 rounded-md whitespace-nowrap bg-[#D8B600] hover:bg-[#a88d00] transition-all duration-300 ease-out">
                <div className="flex flex-row gap-2">
                  <Image src="/purdue-icon.png" alt="" boxSize={4} className="my-auto" />
                  Catalog
                </div>
              </a>
              {boilerExamsCourses.includes(`${course.subjectCode}${course.courseCode}`) &&
                <a href={`https://www.boilerexams.com/courses/${course.subjectCode}${course.courseCode.toString()}/topics`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-white px-5 py-2 mx-1 my-1 rounded-md whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 transition-all duration-300 ease-out">
                  <div className="flex flex-row gap-2">
                    <Image src="/boilerexams-icon.png" alt="" boxSize={4} className="my-auto filter" />
                    Boilerexams
                  </div>
                </a>
              }
            </div>


            {/* Description */}
            <p className="lg:text-base text-sm text-gray-200 mt-1 mb-3 break-words">{course.description}</p>

            {/* Prerequisites */}
            {renderPrereqs()}



          </div>


          {/* Right half of panel */}
          {defaultGPA.datasets && <div className="flex flex-col w-full ">


            <div className='flex flex-row md:gap-4 gap-2'>
              {/* Semester Select */}
              {/* <div className="md:mb-4 mb-2 grow-0">
                <Select
                  isMulti
                  options={{}}
                  className="basic-multi-select w-full no-wrap"
                  classNamePrefix="select"
                  placeholder="Instructor..."
                  menuPlacement='bottom'
                  defaultValue={{}}
                  styles={instructorStyles}
                  color="white"
                  onChange={{}}
                />
              </div> */}


              {/* Instructor Select */}
              {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 &&
                <div className="md:mb-4 mb-2 grow">
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

            </div>


            {/* Stat Cards */}
            <div className="flex flex-row md:gap-4 gap-2 hover:scale-[1.01] transition-all" onClick={() => setInfoModal(true)}>
              <div className="flex flex-col h-full w-full bg-zinc-900 mx-auto p-4 rounded-xl gap-2">
                <div className='md:w-1/2 m-auto mt-1'>
                  <CircularProgressbar
                    value={typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" || typeof curGPA[firstInstructor][sem] === "undefined" ? 0 : curGPA[firstInstructor][sem][0]}
                    maxValue={4}
                    text={typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" || typeof curGPA[firstInstructor][sem] === "undefined" ? "" : curGPA[firstInstructor][sem][0]}
                    styles={buildStyles({
                      pathColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                      textColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                      trailColor: '#0a0a0a',
                    })}
                  />
                </div>
                <p className='text-md font-bold text-white mb-1 text-center'>Average GPA</p>
              </div>
              <div className="flex flex-col h-full w-full bg-zinc-900 mx-auto p-4 rounded-xl gap-2">
                <div className='md:w-1/2 m-auto mt-1'>
                  <CircularProgressbar
                    value={typeof firstInstructor === "undefined" || typeof curRMP[firstInstructor] === "undefined" ? 0 : curRMP[firstInstructor]}
                    maxValue={5}
                    text={typeof firstInstructor === "undefined" || typeof curRMP[firstInstructor] === "undefined" ? "" : curRMP[firstInstructor]}
                    styles={buildStyles({
                      pathColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                      textColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                      trailColor: '#0a0a0a',
                    })}
                  />
                </div>
                <p className='md:hidden font-bold text-white mb-1 text-center'>RateMyProf Rating</p>
                <p className='hidden md:block font-bold text-white mb-1 text-center'>RateMyProfessors Rating</p>
              </div>
            </div>


            {/* GPA Graph */}
            {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 && (
              <Graph data={gpaGraph} />
            )}

            {!(defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0) && (
              <div className="lg:mt-6 md:mt-4 mt-2 mb-8 w-full h-full bg-gray-800 mx-auto p-4 rounded-xl">
                <p className='text-center'>No data!</p>
              </div>
            )}
          </div>}
        </div>

        {/* Calendar View for Lecture Times */}
        {<Calendar subjectCode={course.subjectCode} courseCode={course.courseCode} title={course.title} />}

        <div className='mt-auto'>
          <Footer />
        </div>
      </div>
    </>
  );


};


export async function getServerSideProps(context) {

  const params = new URLSearchParams({ detailId: context.params.id });
  const data = await fetch(`https://www.boilerclasses.com/api/get?${params}`);
  const course = await data.json().then((res) => {
    if (res["course"]["documents"].length > 0) {
      return res["course"]["documents"][0].value
    } else {
      return {}
    }
  });
  const availableSemesters = [];
  semesters.forEach((sem) => {
    try {
      if (course.terms.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch { }
  });
  return {
    props: {
      courseData: course,
      semData: availableSemesters.length > 0 ? availableSemesters[0] : ""
    },
  }
}

export default CardDetails;