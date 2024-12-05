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
import { useEffect, useState } from 'react';


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
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

import { instructorStyles, boilerExamsCourses, labels, genedsOptions } from '@/lib/utils';
import { semesters } from "@/lib/utils"

import Footer from '@/components/footer';
import Calendar from '@/components/calendar';
import Graph, { sanitizeDescription } from '@/components/graph';
import { collectAllProfessors, calculateGradesAndGPA } from '@/lib/gpaUtils';
import GpaModal from '@/components/gpaModal';
import FullInstructorModal from '@/components/fullInstructorModal';
import Prereqs from '@/components/prereqs';
import { loadRatingsForProfs } from '@/components/RMP';
// ------------------------


const CardDetails = ({ courseData, semData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // UseEffect that loads on first render
  useEffect(() => {
    if (!courseData) return;

    // Helper to handle initial instructor setup
    const setupInitialInstructor = (allProfs, semesterProfs, semester) => {
      const firstProf =
        semesterProfs?.length > 0 ? semesterProfs[0] : allProfs[0];
      refreshGraph({ value: firstProf, label: firstProf });
      setSelectedInstructors([firstProf]);
    };

    sanitizeDescription(courseData);

    const allProfs = collectAllProfessors(courseData.instructor);
    const { grades, gpa } = calculateGradesAndGPA(
      allProfs,
      courseData.gpa,
    );

    setGpaGraph({
      labels,
      datasets: [],
    });
    setDefaultGPA({
      labels,
      datasets: grades,
    });
    setCurGPA(gpa);
    setSelectableInstructors(allProfs);

    setSem(availableSemesters[0]);
    setupInitialInstructor(
      allProfs,
      courseData.instructor[availableSemesters[0]],
      availableSemesters[0]
    );

    setLoading(false);
  }, [router.isReady, courseData]);



  // Another UseEffect to asynchronously get RMP ratings
  useEffect(() => {
    loadRatingsForProfs(courseData).then((ratings) => {
      setCurRMP(ratings);
    });
  }, [courseData]);


  // ------------------ STATES ------------------ //
  const [selectedInstructors, setSelectedInstructors] = useState([]);
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
      courseData.instructor[sem].forEach((prof) => instructors.add(prof));
      if (courseData.terms.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch { }
  });


  // Function to get searchable prof string for Reddit search
  const getSearchableProfString = () => {
    //create ret string = ""
    //for each prof in curInstructors, add to ret string with " OR "

    let ret = " OR ";
    courseData.instructor[sem].forEach((prof) => {

      const profSplit = prof.split(" ");
      ret += `"${profSplit[0]} ${profSplit[profSplit.length - 1]}" OR `;


    });
    return ret.substring(0, ret.length - 4);

  }

  // Refresh graph when instructors change
  const refreshGraph = (instructors) => {
    const gpa = defaultGPA.datasets;
    if (!gpa || gpa.length === 0 || !instructors) return;

    const instructorNames = Array.isArray(instructors)
      ? instructors.map(inst => inst.value)
      : [instructors.value];

    setSelectedInstructors(instructorNames);

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
    if (!courseData) return;
    refreshGraph([{ value: selectedInstructors[selectedInstructors.length - 1], label: selectedInstructors[selectedInstructors.length - 1] }]);
  }, [defaultGPA.datasets]);


  // Function to replace gened codes with actual names
  const genedCodeToName = (code) => {
    const gened = genedsOptions.filter(gened => gened.value === code);
    return gened[0].label;
  }


  ///////////////////////////////////////  RENDER  /////////////////////////////////////////

  if (JSON.stringify(courseData) == '{}') {
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
        <title>{`${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}: ${courseData.title} | BoilerClasses`}</title>
        <meta name="title" content={`${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}: ${courseData.title} | BoilerClasses`} />
        <meta name="description" content={`Course ${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)} Purdue: ${courseData.description}`} />
        <meta name="keywords" content={`Purdue, Course, ${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}, ${courseData.subjectCode} ${courseData.courseCode}, ${courseData.title}, ${courseData.description.split(' ')}`} />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <meta property="og:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
        <meta property="og:type" content="website" />
        <meta name="og:title" content={`${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}: ${courseData.title} | BoilerClasses`} />
        <meta name="og:description" content={`${courseData.description}`} />
        <meta property="og:image" content={
          "https://boilerclasses.com/api/og?" +
          'sub=' + encodeURIComponent(courseData.subjectCode) +
          '&course=' + encodeURIComponent(stripCourseCode(courseData.courseCode)) +
          '&title=' + encodeURIComponent(courseData.title) +
          '&credits=' + encodeURIComponent(courseData.credits[1]) +
          '&prof=' + encodeURIComponent(courseData.instructor[semData][0]) +
          '&sem=' + encodeURIComponent(semData)
        } />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="boilerclasses.com" />
        <meta property="twitter:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
        <meta name="twitter:title" content={`${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}: ${courseData.title} | BoilerClasses`} />
        <meta name="twitter:description" content={`${courseData.description}`} />
        <meta property="twitter:image" content={
          "https://boilerclasses.com/api/og?" +
          'sub=' + encodeURIComponent(courseData.subjectCode) +
          '&course=' + encodeURIComponent(stripCourseCode(courseData.courseCode)) +
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
              <button onClick={() => router.back()} className='lg:mt-1 md:mt-0.5 mr-1 h-fit hover:-translate-x-0.5 hover:text-zinc-300 transition'>
                <Icon as={ChevronLeftIcon} alt="" boxSize={6} />
              </button>
              <p className="lg:text-3xl md:text-3xl text-xl font-bold mb-6">{courseData.subjectCode} {courseData.courseCode}: {courseData.title}</p>
            </div>

            <div className="flex flex-col gap-4 -mt-3 mb-1">
              <div className="flex flex-row flex-wrap gap-1 mb-1 items-center">

                {/* Credits Display */}
                <p className="text-sm text-gray-400 font-bold">
                  {courseData.credits[0] === courseData.credits[1]
                    ? `${courseData.credits[0]} Credits`
                    : `${courseData.credits[0]} - ${courseData.credits[1]} Credits`}
                </p>

                {/* Separator Display */}
                <span className="mx-2 h-6 w-0.5 bg-gray-400 rounded" />

                {/* Latest Semester Display with conditional styling */}
                <span className={`text-sm px-3 py-1 rounded-full border-solid border-2 font-bold whitespace-nowrap ${sem === CURRENT_SEMESTER
                    ? 'bg-yellow-600 border-yellow-500'
                    : 'bg-sky-600 border-sky-500'
                  }`}>
                  {sem}
                </span>

                {/* Second Separator */}
                {(courseData.sched.length > 0 || courseData.gened.length > 0) &&
                  <span className="mx-2 h-6 w-0.5 bg-gray-400 rounded" />
                }

                {/* Schedule Type Display */}
                {courseData.sched.map((s, i) => (
                  <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-purple-600 border-purple-800 whitespace-nowrap transition-all`}
                    key={i}>
                    {s}
                  </span>
                ))}

                {/* Gened Type Display */}
                {courseData.gened.map((gened, i) => (
                  <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-[#64919b] border-[#415f65] whitespace-nowrap transition-all`}
                    key={i}>
                    {genedCodeToName(gened)}
                  </span>
                ))}

              </div>
              {/* <p>{courseData.gpa[""]}</p> */}

              {/* Instructors Display */}
              <div className="flex flex-wrap flex-row lg:text-sm text-sm text-blue-600 -mt-2 font-medium">
                <div className='mt-1'>
                  <span className="text-gray-400 font-bold text-xs">{sem} Instructors: </span>
                  {courseData.instructor[sem].map((prof, i) => (
                    <span key={i}>
                      <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${prof.split(" ")[0]} ${prof.split(" ")[prof.split(" ").length - 1]}`}
                        target="_blank" rel="noopener noreferrer"
                        className='underline decoration-dotted hover:text-blue-400 transition-all duration-300 ease-out'
                        key={i}>
                        {prof}
                      </a>
                      {i < courseData.instructor[sem].length - 1 && ", "}
                    </span>
                  ))}
                </div>
              </div>
            </div>


            {/* Other Links Buttons */}
            <div className="flex flex-row flex-wrap my-2">
              <a href={`https://www.reddit.com/r/Purdue/search/?q=${courseData.subjectCode}${stripCourseCode(courseData.courseCode)} OR "${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}" ${getSearchableProfString()}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white px-5 py-2 mr-1 my-1 rounded-md whitespace-nowrap bg-orange-600 hover:bg-orange-800 transition-all duration-300 ease-out">
                <div className="flex flex-row gap-2">
                  <Image src="/reddit-icon.png" alt="Reddit" boxSize={4} className="my-auto" />
                  Reddit
                </div>
              </a>
              {/* term_in=202520 means 2025 spring. 202610 means 2025 fall*/}
              <a href={`https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202520&subj_code_in=${courseData.subjectCode}&crse_numb_in=${courseData.courseCode}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white px-5 py-2 mx-1 my-1 rounded-md whitespace-nowrap bg-[#D8B600] hover:bg-[#a88d00] transition-all duration-300 ease-out">
                <div className="flex flex-row gap-2">
                  <Image src="/purdue-icon.png" alt="Purdue Catalog" boxSize={4} className="my-auto" />
                  Catalog
                </div>
              </a>
              {boilerExamsCourses.includes(`${courseData.subjectCode}${courseData.courseCode}`) &&
                <a href={`https://www.boilerexams.com/courses/${courseData.subjectCode}${courseData.courseCode.toString()}/topics`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-white px-5 py-2 mx-1 my-1 rounded-md whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 transition-all duration-300 ease-out">
                  <div className="flex flex-row gap-2">
                    <Image src="/boilerexams-icon.png" alt="Boilerexams" boxSize={4} className="my-auto filter" />
                    Boilerexams
                  </div>
                </a>
              }
            </div>


            {/* Description */}
            <p className="lg:text-base text-sm text-gray-200 mt-1 mb-3 break-words">{courseData.description}</p>
            <h1 className="lg:text-sm text-xs text-gray-400 mt-1 mb-3 break-words">Course {courseData.subjectCode} {stripCourseCode(courseData.courseCode)} from Purdue University - West Lafayette.</h1>

            {/* Prerequisites */}
            <div className='flex flex-row mb-4'>
              <Prereqs course={courseData} />
            </div>



          </div>


          {/* Right half of panel */}
          {defaultGPA.datasets && <div className="flex flex-col w-full overflow-clip">

            <Tabs variant='soft-rounded' size='sm' colorScheme='gray' defaultIndex={selectedInstructors[selectedInstructors.length - 1] == "TBA" ? 1 : 0}>
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
                          value={selectedInstructors.map(instructor => ({ value: instructor, label: instructor }))}
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
                      {curGPA[selectedInstructors[selectedInstructors.length - 1]] && curGPA[selectedInstructors[selectedInstructors.length - 1]][0] === 0 &&
                        <div className='absolute right-0 left-0 top-0 p-2 backdrop-blur-sm text-center'>
                          <p className='text-zinc-500 text-md font-bold text-center'>No data available for {selectedInstructors[selectedInstructors.length - 1]}</p>
                          <p className='text-zinc-500 text-xs font-light text-center'>Click on other tabs for more data!</p>
                        </div>
                      }

                      {/* GPA circular stat */}
                      <div className='md:w-1/2 m-auto mt-1'>
                        {selectedInstructors[selectedInstructors.length - 1] && curGPA[selectedInstructors[selectedInstructors.length - 1]] ? (
                          <CircularProgressbar
                            value={curGPA[selectedInstructors[selectedInstructors.length - 1]][0]}
                            maxValue={4}
                            text={curGPA[selectedInstructors[selectedInstructors.length - 1]][0]}
                            styles={buildStyles({
                              pathColor: curGPA[selectedInstructors[selectedInstructors.length - 1]][1],
                              textColor: curGPA[selectedInstructors[selectedInstructors.length - 1]][1],
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
                      onClick={() => window.open(`https://www.ratemyprofessors.com/search/professors/783?q=${selectedInstructors[selectedInstructors.length - 1]}`, '_blank')}>

                      {/* For when there is no RMP data for firstInstructor */}
                      {selectedInstructors[selectedInstructors.length - 1] && (!curRMP[selectedInstructors[selectedInstructors.length - 1]] || curRMP[selectedInstructors[selectedInstructors.length - 1]] === 0) &&
                        <div className='absolute right-0 left-0 top-0 p-2 backdrop-blur-sm text-center'>
                          <p className='text-zinc-500 text-md font-bold text-center'>No rating available for {selectedInstructors[selectedInstructors.length - 1]}</p>
                          <p className='text-zinc-500 text-xs font-light text-center'>Click on <span className='text-yellow-500'>this</span> to open RMP!</p>
                        </div>
                      }

                      {/* RMP circular stat */}
                      <div className='md:w-1/2 m-auto mt-1'>
                        {selectedInstructors[selectedInstructors.length - 1] && curRMP[selectedInstructors[selectedInstructors.length - 1]] ? (
                          <CircularProgressbar
                            value={curRMP[selectedInstructors[selectedInstructors.length - 1]]}
                            maxValue={5}
                            text={curRMP[selectedInstructors[selectedInstructors.length - 1]]}
                            styles={buildStyles({
                              pathColor: curGPA[selectedInstructors[selectedInstructors.length - 1]] ? curGPA[selectedInstructors[selectedInstructors.length - 1]][1] : "",
                              textColor: curGPA[selectedInstructors[selectedInstructors.length - 1]] ? curGPA[selectedInstructors[selectedInstructors.length - 1]][1] : "",
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
                    <div className='md:mt-4 mt-2 mb-4 h-96'>
                      <Graph data={gpaGraph} />
                    </div>
                  )}

                  {!(defaultGPA.datasets && Array.isArray(defaultGPA.datasets) && defaultGPA.datasets.length > 0) && (
                    <div className="lg:mt-6 md:mt-4 mt-2 mb-8 w-full h-full bg-gray-800 mx-auto p-4 rounded-xl">
                      <p className='text-center'>No data!</p>
                    </div>
                  )}

                </TabPanel>

                {/* All Instructors Tab */}
                <TabPanel>
                  <FullInstructorModal course={courseData} />
                </TabPanel>

                {/* GPA by Professor Tab */}
                <TabPanel>
                  <GpaModal course={courseData} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>}
        </div>

        {/* Calendar View for Lecture Times */}
        {<Calendar subjectCode={courseData.subjectCode} courseCode={courseData.courseCode} title={courseData.title} />}

        <div className='mt-auto'>
          <Footer />
        </div>
      </div>
    </>
  );


};

export default CardDetails;


// function to strip courseData code to remove the 00s
export function stripCourseCode(courseCode) {
  let formattedName = courseCode.toString();
  if (/\d{5}$/.test(formattedName) && formattedName.slice(-2) === "00") {
    formattedName = formattedName.slice(0, -2);
  }
  return formattedName;
}


// @Sarthak made this, some api call to get courseData data
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
