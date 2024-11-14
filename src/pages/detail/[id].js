/*
 * Details page for a specific course - includes course description, instructors, GPA, RMP ratings,
 * prerequisites, and a calendar view of lecture times.
 */


// ----- Next.js imports -----
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import ErrorPage from 'next/error'
// ---------------------


// ----- React imports -----
import { useEffect, useState, useRef } from 'react';


// ----- Misc imports -----
import Select from 'react-select';

import { Image, Icon, Spinner } from '@chakra-ui/react'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons'

import {
  CircularProgressbar, buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
// ------------------


// ----- Component imports -----
import { instructorStyles, graphColors, boilerExamsCourses, labels } from '@/lib/utils';
import { semesters, subjects } from "@/lib/utils"

import Footer from '@/components/footer';
import Calendar from '@/components/calendar';
import Graph from '@/components/graph';
import GpaModal from '@/components/gpaModal';
import FullInstructorModal from '@/components/fullInstructorModal';
import Prereqs from '@/components/prereqs';
import { loadRatingsForProfs } from '@/components/RMP';
// ------------------------


const CardDetails = ({ courseData, semData }) => {
  const router = useRouter();
  const [course, setCourse] = useState(courseData);
  const [loading, setLoading] = useState(true);

  // UseEffect that loads on first render
  useEffect(() => {
    if (!course) return;
    // console.log(JSON.stringify(course, null, 2)); // for debugging and you dont wanna start server

    // set descriptions to none if it's html
    if (course.description && course.description.startsWith("<a href=")) {
      setCourse({ ...course, description: "No Description Available" });
    }

    // Set allProfs variable with all course instructors
    const allProfs = [];
    for (const semester in course.instructor) {
      for (const instructor of course.instructor[semester]) {
        if (!allProfs.includes(instructor)) {
          allProfs.push(instructor);
        }
      }
    }

    const grades = [];
    const gpa = {};
    let curr = 0;

    // for each instructor, calculate avg gpa and grade distribution
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

    // Sets the gpaGraph state for the graph component
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
    setSelectableInstructors(allProfs);

    // set current semester
    setSem(availableSemesters[0]);

    const currentSemesterProfs = course.instructor[availableSemesters[0]];

    // Set the first instructor to the first professor in the current semester
    if (currentSemesterProfs && currentSemesterProfs.length > 0) {
      const firstProf = currentSemesterProfs[0];
      refreshGraph({ value: firstProf, label: firstProf });
      setFirstInstructor(firstProf);
    } else {
      // Fallback if no professors are found in the current semester
      const firstProf = allProfs[0];
      refreshGraph({ value: firstProf, label: firstProf });
      setFirstInstructor(firstProf);
    }

    setLoading(false);

  }, [router.isReady])


  // Another UseEffect to asynchronously get RMP ratings
  useEffect(() => {
    loadRatingsForProfs(course).then((ratings) => {
      setCurRMP(ratings);
    });
  }, [course]);


  // ------------------ STATES ------------------ //
  const [firstInstructor, setFirstInstructor] = useState("");
  const [curGPA, setCurGPA] = useState({});
  const [curRMP, setCurRMP] = useState({});

  const [sem, setSem] = useState(semData);
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


  // Function to get searchable prof string for Reddit search
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

  // Go back on back button
  const goBack = () => {

    // if referrer isn't from boilerclasses, go to home
    // const referrer = document.referrer;
    // const isFromBoilerClasses = referrer.includes(window.location.origin);
    // console.log(referrer, isFromBoilerClasses);

    // if (!isFromBoilerClasses) {
    //   router.replace(window.location.origin || "/");
    //   return;
    // }

    // if current url contqains ?q=, then go back with query
    const currentURL = window.location.href;
    console.log(currentURL);
    if (currentURL.includes("?q=")) {
      router.push({ pathname: window.location.origin, query: { q: currentURL.split("?q=")[1] } });
      return;
    }

    // if history exists, go back, and reload if going back from prereqs
    if (window.history.length > 1) {
      router.back();
      if (!window.history.state?.as.includes("?q=")) {
        setTimeout(() => {
          router.reload();
        }, 100);
      }
    } else {
      // if no history, go to home
      router.push("/");
    }

  };

  ///////////////////////////////////////  RENDER  /////////////////////////////////////////

  if (JSON.stringify(course) == '{}') {
    return <ErrorPage statusCode={404} />
  }

  if (loading) {
    return (
      <div className='h-screen w-screen flex items-center justify-center'>
        <Spinner size="lg" color="white" />
      </div>
    )
  }

  return (
    <>
      <Head>
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
      <div className={`flex flex-col min-h-screen bg-neutral-950 container mx-auto p-5 mt-5 ${inter.className} text-white`}>
        <div className="flex md:flex-row flex-col md:gap-4">

          {/* Left half of panel */}
          <div className="flex flex-col w-full md:mr-3 justify-start h-full">

            <div className='flex flex-row gap-1'>
              {/* Back button */}
              <button onClick={() => goBack()} className='lg:mt-1 md:mt-0.5 mr-1 h-fit hover:-translate-x-0.5 hover:text-zinc-300 transition'>
                <Icon as={ChevronLeftIcon} alt="" boxSize={6} />
              </button>
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
                <div className='mt-1'>
                  <span className="text-gray-400 font-bold text-xs">{sem} Instructors: </span>

                  {course.instructor[sem].map((prof, i) => (
                    <span key={i}>
                      <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${prof.split(" ")[0]} ${prof.split(" ")[prof.split(" ").length - 1]}`}
                        target="_blank" rel="noopener noreferrer"
                        className='underline decoration-dotted hover:text-blue-400 transition-all duration-300 ease-out'
                        key={i}>
                        {prof}
                      </a>
                      {i < course.instructor[sem].length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>
            </div>


            {/* Other Links Buttons */}
            <div className="flex flex-row flex-wrap my-2">
              <a href={`https://www.reddit.com/r/Purdue/search/?q=${course.subjectCode}${course.courseCode.toString().replace(/00$/, '')} OR "${course.subjectCode} ${course.courseCode.toString().replace(/00$/, '')}" ${getSearchableProfString()}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white px-5 py-2 mr-1 my-1 rounded-md whitespace-nowrap bg-orange-600 hover:bg-orange-800 transition-all duration-300 ease-out">
                <div className="flex flex-row gap-2">
                  <Image src="/reddit-icon.png" alt="Reddit" boxSize={4} className="my-auto" />
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
            <Prereqs course={course} router={router} />



          </div>


          {/* Right half of panel */}
          {defaultGPA.datasets && <div className="flex flex-col w-full overflow-clip">

            <Tabs variant='soft-rounded' size='sm' colorScheme='gray' defaultIndex={ firstInstructor == "TBA" ? 1 : 0}>
              <TabList overflowY="hidden"
                sx={{
                  scrollbarWidth: 'none',
                  '::-webkit-scrollbar': {
                    display: 'none',
                  },
                }}>
                <Tab>Overview</Tab>
                <Tab>GPA by Semester</Tab>
                <Tab>GPA by Professor</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <div className='flex flex-row gap-2 md:mb-4 mb-2'>
                    {/* Info Popup (prob not needed anymore) */}
                    {/* <a className='p-2 rounded-lg bg-zinc-800 my-auto cursor-pointer	hover:bg-zinc-900 transition-all' onClick={() => setInfoModal(true)}>
                <FaInfo size={16} color='white' />
              </a> */}
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
                    <div className="relative flex flex-col items-stretch bg-zinc-900 mx-auto p-4 rounded-xl gap-2">

                      {/* For when there is no GPA data for firstInstructor */}
                      {curGPA[firstInstructor] && curGPA[firstInstructor][0] === 0 &&
                        <div className='absolute right-0 left-0 top-0 p-2 backdrop-blur-sm text-center'>
                          <p className='text-zinc-500 text-md font-bold text-center'>No data available for {firstInstructor}</p>
                          <p className='text-zinc-500 text-xs font-light text-center'>Click on other tabs for more data!</p>
                        </div>
                      }

                      {/* GPA circular stat */}
                      <div className='md:w-1/2 m-auto mt-1'>
                        {firstInstructor && curGPA[firstInstructor] ? (
                          <CircularProgressbar
                            value={curGPA[firstInstructor][0]}
                            maxValue={4}
                            text={curGPA[firstInstructor][0]}
                            styles={buildStyles({
                              pathColor: curGPA[firstInstructor][1],
                              textColor: curGPA[firstInstructor][1],
                              trailColor: '#0a0a0a',
                            })}
                          />
                        ) : (
                          <CircularProgressbar
                            value={0}
                            maxValue={4}
                            text=""
                            styles={buildStyles({
                              pathColor: "",
                              textColor: "",
                              trailColor: '#0a0a0a',
                            })}
                          />
                        )}
                      </div>

                      <p className='text-md font-bold text-white mb-1 text-center'>Average GPA</p>
                    </div>
                    <div className="relative flex flex-col items-stretch bg-zinc-900 mx-auto p-4 rounded-xl gap-2 cursor-pointer hover:scale-[1.05] transition-all"
                      onClick={() => window.open(`https://www.ratemyprofessors.com/search/professors/783?q=${firstInstructor}`, '_blank')}>

                      {/* For when there is no RMP data for firstInstructor */}
                      {firstInstructor && (!curRMP[firstInstructor] || curRMP[firstInstructor] === 0) &&
                        <div className='absolute right-0 left-0 top-0 p-2 backdrop-blur-sm text-center'>
                          <p className='text-zinc-500 text-md font-bold text-center'>No rating available for {firstInstructor}</p>
                          <p className='text-zinc-500 text-xs font-light text-center'>Click on <span className='text-yellow-500'>this</span> to open RMP!</p>
                        </div>
                      }

                      {/* RMP circular stat */}
                      <div className='md:w-1/2 m-auto mt-1'>
                        {firstInstructor && curRMP[firstInstructor] ? (
                          <CircularProgressbar
                            value={curRMP[firstInstructor]}
                            maxValue={5}
                            text={curRMP[firstInstructor]}
                            styles={buildStyles({
                              pathColor: curGPA[firstInstructor] ? curGPA[firstInstructor][1] : "",
                              textColor: curGPA[firstInstructor] ? curGPA[firstInstructor][1] : "",
                              trailColor: '#0a0a0a',
                            })}
                          />
                        ) : (
                          <CircularProgressbar
                            value={0}
                            maxValue={5}
                            text=""
                            styles={buildStyles({
                              pathColor: "",
                              textColor: "",
                              trailColor: '#0a0a0a',
                            })}
                          />
                        )}
                      </div>

                      <p className='lg:hidden font-bold text-white mb-1 text-center'>RateMyProf Rating</p>
                      <p className='hidden lg:block font-bold text-white mb-1 text-center'>RateMyProfessors Rating</p>
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

                </TabPanel>

                {/* All Instructors Tab */}
                <TabPanel>
                  <FullInstructorModal course={course} />
                </TabPanel>

                {/* GPA by Professor Tab */}
                <TabPanel>
                  <GpaModal course={course} />
                </TabPanel>
              </TabPanels>
            </Tabs>
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



// @Sarthak made this, some api call to get course data
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