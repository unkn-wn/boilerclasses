import { Inter } from 'next/font/google'
import { semesters, subjects } from "../../lib/utils"
const inter = Inter({ subsets: ['latin'] })
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import ErrorPage from 'next/error'

import Select from 'react-select';

import { Image, cookieStorageManager, Icon } from '@chakra-ui/react'
import { FaHome, FaInfo } from "react-icons/fa";

import {
  CircularProgressbar, buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";



import { instructorStyles, graphColors, boilerExamsCourses, labels } from '@/lib/utils';
import Footer from '@/components/footer';
import Head from 'next/head';
import Calendar from '../../components/calendar';
import Graph from '../../components/graph';
import GpaModal from '@/components/gpaModal';
import InfoModal from '@/components/infoModal';
import FullInstructorModal from '@/components/fullInstructorModal';


const CardDetails = ({ courseData, semData }) => {
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

  // Helper function to format instructor name to "Middle middle Last, First"
  // or Last, First M. for some reason cause our data isnt fucking consolidated @Sarthak
  // function formatInstructorName(name) {
  //   if (name === "TBA") return 'TBA';
  //   const splitName = name.split(' ');

  //   if (splitName.length > 3) {
  //     const firstName = splitName[0];
  //     const rest = splitName.slice(1).join(' ');
  //     return `${rest}, ${firstName}`;
  //   } else {
  //     const lastName = splitName.pop();
  //     const firstName = splitName.shift();
  //     const middleName = splitName.join(' ');
  //     if (middleName.length >= 1) {
  //       splitName[0] = middleName[0] + '.';
  //     }
  //     return `${lastName}, ${firstName}${splitName.length > 0 ? ' ' + splitName.join(' ') : ''}`;
  //   }
  // }


  useEffect(() => {
    if (!course) return;
    // console.log(JSON.stringify(course, null, 2)); // for debugging and you dont wanna start server

    // set descriptions to none if it's html
    if (course.description && course.description.startsWith("<a href=")) {
      setCourse({ ...course, description: "No Description Available" });
    }

    // set all profs
    const allProfs = [];
    for (const semester in course.instructor) {
      for (const instructor of course.instructor[semester]) {
        if (!allProfs.includes(instructor)) {
          allProfs.push(instructor);
        }
      }
    }

    // set graph
    const grades = [];
    const gpa = {};
    let curr = 0;
    for (const instructor of allProfs) {

      let avg_gpa = 0;
      let avg_grade_dist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      if (!course.gpa[instructor]) { // if no data for instructor, set to 0
        gpa[instructor] = [0, "#ffffff"];
        grades.push({
          label: instructor,
          data: avg_grade_dist,
          backgroundColor: "#ffffff"
        });
        continue;
      }

      const color = graphColors[(curr++) % graphColors.length];
      let count = 0;
      for (const sem in course.gpa[instructor]) { // for each semester, calculate avg gpa and grade distribution
        avg_gpa += course.gpa[instructor][sem][13];
        for (let i = 0; i < 13; i++) {
          avg_grade_dist[i] += course.gpa[instructor][sem][i];
        }
        count++;
      }

      for (let i = 0; i < 13; i++) {
        avg_grade_dist[i] = Math.round(avg_grade_dist[i] / count * 100) / 100;
      }

      gpa[instructor] = [Math.round(avg_gpa / count * 100) / 100, color];
      grades.push({
        label: instructor,
        data: avg_grade_dist,
        backgroundColor: color
      });

    }

    setGpaGraph({
      labels,
      //datasets: grades
      datasets: []
    });

    setDefaultGPA({
      labels,
      datasets: grades
    });
    setCurGPA(gpa);


    // Set selectable instructors
    // const instrs = [];
    // for (const instructor in course.gpa) {
    //   if (!instrs.includes(instructor)) {
    //     instrs.push(instructor);
    //   }
    // }
    // console.log("instructors: " + instrs)
    setSelectableInstructors(allProfs);

    // set current semester
    setSem(availableSemesters[0]);


    // set default first instructor on the multiselect
    let found = false;
    for (const ins of allProfs) {
      if (gpa[ins] && gpa[ins][0] !== 0) {
        refreshGraph({ value: ins, label: ins });
        setFirstInstructor(ins);
        found = true;
        break;
      }
    }

    if (!found) {
      refreshGraph({ value: allProfs[0], label: allProfs[0] });
      setFirstInstructor(allProfs[0]);
    }

    setLoading(false);

  }, [router.isReady])


  // Another UseEffect to asynchronously get RMP ratings
  useEffect(() => {
    if (!course) return;

    const allProfs = [];
    for (const semester in course.instructor) {
      for (const instructor of course.instructor[semester]) {
        if (!allProfs.includes(instructor)) {
          allProfs.push(instructor);
        }
      }
    }

    async function loadRatingsForProfessors(allProfs) {
      try {
        if (isLoadingRatings.current) {
          return;
        }

        isLoadingRatings.current = true;

        const ratings = await getAllRMPRatings(allProfs);
        setCurRMP((prevRMP) => {
          return { ...prevRMP, ...ratings };
        });
      } catch (error) {
        console.error("Error loading ratings:", error);
      } finally {
        isLoadingRatings.current = false;
      }
    }

    loadRatingsForProfessors(allProfs);
  }, [course]);


  const [firstInstructor, setFirstInstructor] = useState("");
  const [curGPA, setCurGPA] = useState({});
  const [curRMP, setCurRMP] = useState({});
  const isLoadingRatings = useRef(false);

  const [sem, setSem] = useState(semData);
  const [gpaGraph, setGpaGraph] = useState({});
  const [defaultGPA, setDefaultGPA] = useState({});
  const [selectableInstructors, setSelectableInstructors] = useState([]);

  const [gpaModal, setGpaModal] = useState(false);
  const [fullInstructorModal, setFullInstructorModal] = useState(false);
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

  // Function for changing instructors on semester select (old feature)
  // const changeInstructors = (sem) => {

  //   setSem(sem);
  //   availableSemesters.forEach((otherSem) => {
  //     if (otherSem !== sem) {
  //       try {
  //         document.getElementById(otherSem).classList.remove("bg-sky-600");
  //       } catch { }
  //     }
  //   });

  //   try {
  //     document.getElementById(sem).classList.add("bg-sky-600");
  //   } catch { }
  // }


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
    if (!gpa || gpa.length === 0 || !instructors) return;

    setFirstInstructor(" ");
    try {
      setFirstInstructor(instructors[instructors.length - 1].label);
    } catch {
      setFirstInstructor("");
    }

    try {
      const newgpa = gpa.filter(inst => {
        const isIncluded = instructors.some(instructor => instructor.label === inst.label.trim());
        return isIncluded;
      });

      setGpaGraph({
        labels,
        datasets: newgpa,
      });
    } catch {
      console.error("Error filtering instructors");
    }
  };

  // To refresh graph when everythings loaded
  useEffect(() => {
    if (!course) return;
    refreshGraph([{ value: firstInstructor, label: firstInstructor }]);
  }, [defaultGPA.datasets]);


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


  // Function to get link for RMP on the dial graph
  // function formatInstructorNameRMP(instructor) {
  //   if (!instructor) return ''; // Check if instructor is provided
  //   const nameParts = instructor.split(", ");
  //   if (nameParts.length < 2) return ''; // Check if split operation succeeded
  //   const firstName = nameParts[1].split(" ")[0];
  //   const splitName = nameParts[0].split(" ");
  //   const lastName = splitName[splitName.length - 1];

  //   // splits from "Middle middle Last, First" to "First Last"
  //   return `${firstName} ${lastName}`;
  // }


  // Batched RMP ratings fetch for allProfs
  async function getAllRMPRatings(allProfs) {
    if (!Array.isArray(allProfs) || allProfs.length === 0) return {};

    const batchSize = 10; // Number of requests to send in each batch
    const batches = []; // Array to hold batches of professors
    const ratings = {}; // Object to store ratings

    // Split allProfs into batches
    for (let i = 0; i < allProfs.length; i += batchSize) {
      batches.push(allProfs.slice(i, i + batchSize));
    }

    // Process batches in parallel
    await Promise.all(
      batches.map(async (batch) => {
        const ratingsBatch = await Promise.all(batch.map((instructor) => getRMPRating(instructor)));
        batch.forEach((instructor, index) => {
          ratings[instructor] = ratingsBatch[index];
        });
      })
    );

    return ratings;
  }


  // Get RateMyProfessor ratings for instructor
  async function getRMPRating(instructor) {
    if (!instructor) return 0;

    try {
      // TO SEARCH FOR "PURDUE UNIVERSITY"
      // const params = new URLSearchParams({ q: "Purdue University" });
      // const responseSchools = await fetch("/api/ratings/searchSchool?" + params);
      // const schools = await responseSchools.json();
      // const purdues = schools.schools.filter(school => school.city === "West Lafayette");

      let rating = 0;

      // for all Purdue University schools in West Lafayette, search prof
      const schools = ["U2Nob29sLTc4Mw==", "U2Nob29sLTE3NTk5"]; // purdue IDs for West Lafayette
      for (const school of schools) {
        const paramsTeacher = new URLSearchParams({ name: instructor, id: school });
        const responseProf = await fetch("/api/ratings/searchTeacher?" + paramsTeacher);
        const prof = await responseProf.json();
        const profs = prof.prof.filter(Boolean);

        if (profs.length > 0) {
          const paramsGetTeacher = new URLSearchParams({ id: profs[0].id });
          const responseRMP = await fetch("/api/ratings/getTeacher?" + paramsGetTeacher);
          const RMPrating = await responseRMP.json();
          rating = RMPrating.RMPrating.avgRating;
          break;
        }
      }

      return rating;
    } catch (error) {
      console.error(error);
      return 0;
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
      console.error(course.prereqs);
      return <></>;
    }
  }

  return (
    <>
      <Head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-48L6TGYD2L`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-48L6TGYD2L', {
              page_path: window.location.pathname,
            });`
          }}
        />
        <title>{`${courseData.subjectCode} ${courseData.courseCode}: ${courseData.title} | BoilerClasses`}</title>
        <meta name="title" content={`${courseData.subjectCode} ${courseData.courseCode}: ${courseData.title} | BoilerClasses`} />
        <meta name="description" content={`Course ${courseData.subjectCode} ${courseData.courseCode} Purdue: ${courseData.description}`} />
        <meta name="keywords" content={`Purdue, Course, ${courseData.subjectCode} ${courseData.courseCode}, ${courseData.subjectCode} ${courseData.courseCode}, ${courseData.title}, ${courseData.description.split(' ')}`} />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <meta property="og:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
        <meta property="og:type" content="website" />
        <meta name="og:title" content={`${courseData.subjectCode} ${courseData.courseCode}: ${courseData.title} | BoilerClasses`} />
        <meta name="og:description" content={`${courseData.description}`} />
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
        <meta name="twitter:description" content={`${courseData.description}`} />
        <meta property="twitter:image" content={
          "https://boilerclasses.com/api/og?" +
          'sub=' + encodeURIComponent(courseData.subjectCode) +
          '&course=' + encodeURIComponent(courseData.courseCode) +
          '&title=' + encodeURIComponent(courseData.title) +
          '&credits=' + encodeURIComponent(courseData.credits[1]) +
          '&prof=' + encodeURIComponent(courseData.instructor[semData][0]) +
          '&sem=' + encodeURIComponent(semData)
        } />

        <link rel="canonical" href={`https://boilerclasses.com/detail/${courseData.detailId}`} />

      </Head>
      <GpaModal isOpen={gpaModal} onClose={setGpaModal} course={course} />
      <FullInstructorModal isOpen={fullInstructorModal} onClose={setFullInstructorModal} course={course} />
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
              <div className="flex flex-wrap flex-row lg:text-sm text-sm text-blue-600 -mt-2 font-medium">
                <div onClick={() => setFullInstructorModal(true)} className="text-gray-300 bg-zinc-700 py-1 px-2 font-bold text-sm text-center mr-3 rounded-md hover:scale-105 transition-all cursor-pointer">View All Instructors</div>

                <div className='mt-1'>
                  <span className="text-gray-400 font-bold text-xs">{sem} Instructors: </span>

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
                  ))}
                </div>
              </div>
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
                className="text-sm text-white px-5 py-2 mr-1 my-1 rounded-md whitespace-nowrap bg-orange-600 hover:bg-orange-800 transition-all duration-300 ease-out">
                <div className="flex flex-row gap-2">
                  <Image src="https://static-00.iconduck.com/assets.00/reddit-icon-512x450-etuh24un.png" alt="Reddit" boxSize={4} className="my-auto" />
                  Reddit
                </div>
              </a>
              <a href={`https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202510&subj_code_in=${course.subjectCode}&crse_numb_in=${course.courseCode}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white px-5 py-2 mx-1 my-1 rounded-md whitespace-nowrap bg-[#D8B600] hover:bg-[#a88d00] transition-all duration-300 ease-out">
                <div className="flex flex-row gap-2">
                  <Image src="/purdue-icon.png" alt="Purdue Catalog" boxSize={4} className="my-auto" />
                  Catalog
                </div>
              </a>
              {boilerExamsCourses.includes(`${course.subjectCode}${course.courseCode}`) &&
                <a href={`https://www.boilerexams.com/courses/${course.subjectCode}${course.courseCode.toString()}/topics`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-white px-5 py-2 mx-1 my-1 rounded-md whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 transition-all duration-300 ease-out">
                  <div className="flex flex-row gap-2">
                    <Image src="/boilerexams-icon.png" alt="Boilerexams" boxSize={4} className="my-auto filter" />
                    Boilerexams
                  </div>
                </a>
              }
            </div>


            {/* Description */}
            <p className="lg:text-base text-sm text-gray-200 mt-1 mb-3 break-words">{course.description}</p>
            <h1 className="lg:text-sm text-xs text-gray-400 mt-1 mb-3 break-words">Course {course.subjectCode} {course.courseCode} from Purdue University - West Lafayette.</h1>

            {/* Prerequisites */}
            {renderPrereqs()}



          </div>


          {/* Right half of panel */}
          {defaultGPA.datasets && <div className="flex flex-col w-full">

            <div className='flex flex-row gap-2 md:mb-4 mb-2'>
              <a className='p-2 rounded-lg bg-zinc-800 my-auto cursor-pointer	hover:scale-125 transition-all' onClick={() => setInfoModal(true)}>
                <FaInfo size={16} color='white' />
              </a>
              {/* Instructor Select */}
              {defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0 &&
                <div className="grow">
                  <Select
                    isMulti
                    options={selectableInstructors.map((instructor) => ({ value: instructor, label: instructor }))}
                    className="basic-multi-select w-full no-wrap"
                    classNamePrefix="select"
                    placeholder="Instructor..."
                    menuPlacement='bottom'
                    defaultValue={
                      [{ value: firstInstructor, label: firstInstructor }]
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
            <div className="flex flex-row md:gap-4 gap-2">
              <div className="relative flex flex-col h-full w-full bg-zinc-900 mx-auto p-4 rounded-xl gap-2 cursor-pointer hover:scale-[1.05] transition-all" onClick={() => setGpaModal(true)}>

                {/* For when there is no GPA data for firstInstructor */}
                {curGPA[firstInstructor] && curGPA[firstInstructor][0] === 0 &&
                  <div className='absolute right-0 left-0 top-0 p-2 backdrop-blur-sm text-center'>
                    <p className='text-zinc-500 text-md font-bold text-center'>No data available for {firstInstructor}</p>
                    <p className='text-zinc-500 text-xs font-light text-center'>Click on <span className='text-yellow-500'>this</span> for all data!</p>
                  </div>
                }


                <div className='md:w-1/2 m-auto mt-1'>
                  <CircularProgressbar
                    value={typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? 0 : curGPA[firstInstructor][0]}
                    maxValue={4}
                    text={typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][0]}
                    styles={buildStyles({
                      pathColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                      textColor: `${typeof firstInstructor === "undefined" || typeof curGPA[firstInstructor] === "undefined" ? "" : curGPA[firstInstructor][1]}`,
                      trailColor: '#0a0a0a',
                    })}
                  />
                </div>
                <p className='text-md font-bold text-white mb-1 text-center'>Average GPA</p>
              </div>
              <a className="relative flex flex-col h-full w-full bg-zinc-900 mx-auto p-4 rounded-xl gap-2 cursor-pointer hover:scale-[1.05] transition-all"
                href={`https://www.ratemyprofessors.com/search/professors/783?q=${firstInstructor}`}
                target="_blank" rel="noopener noreferrer">

                {/* For when there is no RMP data for firstInstructor */}
                {firstInstructor && (!curRMP[firstInstructor] || curRMP[firstInstructor] === 0) &&
                  <div className='absolute right-0 left-0 top-0 p-2 backdrop-blur-sm text-center'>
                    <p className='text-zinc-500 text-md font-bold text-center'>No rating available for {firstInstructor}</p>
                    <p className='text-zinc-500 text-xs font-light text-center'>Click on <span className='text-yellow-500'>this</span> to open RMP!</p>
                  </div>
                }

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
                <p className='lg:hidden font-bold text-white mb-1 text-center'>RateMyProf Rating</p>
                <p className='hidden lg:block font-bold text-white mb-1 text-center'>RateMyProfessors Rating</p>
              </a>
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
  // https://www.boilerclasses.com
  const data = await fetch(`http://localhost:3000/api/get?${params}`);
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