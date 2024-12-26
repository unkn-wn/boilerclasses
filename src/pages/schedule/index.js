// schedule.boilerclasses.com

// Group external imports
import Head from 'next/head';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { useState, useEffect, useMemo } from 'react';
import { Spinner, Tooltip } from '@chakra-ui/react'
import { IoMdOpen, IoMdTrash, IoIosClose, IoIosWarning, IoMdAdd } from "react-icons/io";

// Group internal imports
import { useSearchFilters, CURRENT_SEMESTER } from '@/hooks/useSearchFilters';
import { genedsOptions, labels, graphColors } from '@/lib/utils';
import CourseSearch from '@/components/schedule/courseSearch';
import ScheduleCalendar from '@/components/schedule/schedule';
import Graph, { sanitizeDescription, collectAllProfessors, calculateGradesAndGPA, averageAllData } from '@/components/graph';
import { ScheduleGpaModal } from '@/components/gpaModal';
import Prereqs from '@/components/prereqs';
import Footer from '@/components/footer';

const inter = Inter({ subsets: ['latin'] });

const Schedule = () => {
  const {
    updateFilter,
    courses,
    filters,
  } = useSearchFilters();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [gpaGraph, setGpaGraph] = useState({
    labels,
    datasets: []
  });

  const [pinCourses, setPinCourses] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pinnedCourses');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);

  // loads the previously selected course from localStorage when the page loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCourse = localStorage.getItem('selectedCourse');
      if (savedCourse) {
        setSelectedCourse(JSON.parse(savedCourse));
      }
    }
  }, []);

  // saves the selected course to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedCourse) {
        localStorage.setItem('selectedCourse', JSON.stringify(selectedCourse));
      } else {
        localStorage.removeItem('selectedCourse');
      }
    }
  }, [selectedCourse]);

  // keeps the pinned courses synced with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // remove initialPin before saving
      const coursesToSave = pinCourses.map(({ initialPin, ...course }) => course);
      localStorage.setItem('pinnedCourses', JSON.stringify(coursesToSave));
    }
  }, [pinCourses]);

  // processes the selected course data and generates the grade distribution graph
  const graphData = useMemo(() => {
    if (!selectedCourse) return null;

    sanitizeDescription(selectedCourse);
    const allProfs = collectAllProfessors(selectedCourse.instructor);
    const { grades } = calculateGradesAndGPA(allProfs, selectedCourse.gpa, graphColors);
    return {
      labels,
      datasets: averageAllData(grades),
    };
  }, [selectedCourse]);

  // updates the graph and adds a brief highlight animation to the course details section
  useEffect(() => {
    if (!graphData) return;
    setGpaGraph(graphData);

    // Highlight course details section
    const highlightCourseDiv = async () => {
      const courseDiv = document.getElementById("course_details");
      courseDiv.classList.add("ring-4", "ring-yellow-500");
      await new Promise(resolve => setTimeout(resolve, 500));
      courseDiv.classList.remove("ring-4", "ring-yellow-500");
    };

    highlightCourseDiv();
  }, [graphData]);

  // handles when a user selects a course from the search dropdown
  const handleOnSelect = (course) => {
    if (!course) return;
    updateFilter('searchTerm', '');
    setSelectedCourse(course.value);
    localStorage.setItem('selectedCourse', JSON.stringify(course.value));
  };

  // removes a course from the pinned courses list and clears selection if it was selected
  const handleCourseRemove = (detailId) => {
    setPinCourses(prevCourses => prevCourses.filter(course => course.detailId !== detailId));
    if (selectedCourse?.detailId === detailId) {
      setSelectedCourse(null);
      localStorage.removeItem('selectedCourse');
    }
  };

  return (
    <>
      <Head>
        <title>Schedule Assistant | BoilerClasses</title>
        <meta name="title" content="Schedule Assistant | BoilerClasses" />
        <meta name="description" content="BoilerClasses Scheduling Assistant - Plan your next courses from over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more." />
        <meta name="keywords" content="Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, Courses, Schedule, Scheduling, Assistant, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers" />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <meta property="og:url" content="https://schedule.boilerclasses.com" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Schedule Assistant | BoilerClasses" />
        <meta property="og:description" content="BoilerClasses Scheduling Assistant - Plan your next courses from over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more." />
        <meta property="og:image" content="https://opengraph.b-cdn.net/production/images/0413e8c7-edd6-4344-bc7a-8fc27d840783.png?token=XWki0pXYsNvGaeuQwxsWOq1GkgkT-SJQTrP2LtDWKyE&height=776&width=1200&expires=33268877667" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="boilerclasses.com" />
        <meta property="twitter:url" content="https://schedule.boilerclasses.com" />
        <meta name="twitter:title" content="Schedule Assistant | BoilerClasses" />
        <meta name="twitter:description" content="BoilerClasses Scheduling Assistant - Plan your next courses from over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more." />
        <meta name="twitter:image" content="https://opengraph.b-cdn.net/production/images/0413e8c7-edd6-4344-bc7a-8fc27d840783.png?token=XWki0pXYsNvGaeuQwxsWOq1GkgkT-SJQTrP2LtDWKyE&height=776&width=1200&expires=33268877667" />

        <link rel="canonical" href="https://schedule.boilerclasses.com/" />
      </Head>

      {/* Logo */}
      <div className='flex flex-row mt-4 mb-2 justify-center'>
        <Link className="flex flex-row" href='https://boilerclasses.com'>
          <img
            src='/boilerclasses-FULL.png'
            className='my-auto w-8 h-8'
            alt="BoilerClasses Logo"
          />
          <h1 className='text-md md:text-lg font-semibold my-auto ml-2 select-none text-primary'>
            BoilerClasses
          </h1>
        </Link>
      </div>

      {/* mobile message */}
      <div id="mobile_msg" className='m-2 text-center text-sm text-primary items-center justify-center font-light lg:hidden bg-yellow-900 px-2 py-1 flex flex-row'>
        <div className='cursor-pointer' onClick={() => document.getElementById('mobile_msg').classList.add('hidden')}><IoIosClose size={24} /></div>
        Use the Scheduling Assistant on Desktop for the best experience!
      </div>

      <div id="parent" className={`flex flex-col lg:flex-row gap-10 min-h-screen bg-background container mx-auto px-4 text-primary ${inter.className}`}>
        {/* Left Side */}
        <div className='flex flex-col w-full lg:w-1/2 gap-2'>
          <div className='mx-2'>
            <ScheduleCalendar courses={pinCourses} setIsLoading={setIsLoading} setSelectedCourse={setSelectedCourse} onCourseRemove={handleCourseRemove} />
          </div>
        </div>

        {/* Right Side */}
        <div id="right_side" className='flex flex-col w-full lg:w-1/2'>
          <div className="mb-6">
            <CourseSearch
              courses={courses}
              onSelect={handleOnSelect}
              searchTerm={filters.searchTerm}
              updateFilter={updateFilter}
            />
          </div>
          {selectedCourse === null ? (
            <div className='flex flex-col justify-center mx-12 max-h-screen h-full'>
              <h1 className='font-bold text-2xl lg:text-3xl'>Welcome to <span className='text-yellow-500'>BoilerClasses</span></h1>
              <h2 className='font-light text-sm'>
                Utilize the scheduling assistant to plan your semester. Use the search bar to find courses, and add them to show up in the schedule!
              </h2>
            </div>
          ) : (
            <>
              {/* Selected Course */}
              <div className='flex flex-col lg:h-screen'>
                <div id="course_details" className='flex flex-col lg:flex-row gap-2 h-1/2 overflow-y-scroll p-4 rounded-xl shadow-white/10 bg-background shadow-md border-background-secondary border transition-all'>

                  {/* LEFT SIDE - Course Info */}
                  <div className='lg:w-1/2'>
                    <h1 className='font-bold text-3xl'>{selectedCourse.subjectCode} {selectedCourse.courseCode}</h1>
                    <h2 className='font-bold text-lg'>{selectedCourse.title}</h2>

                    {/* Description Display */}
                    <p className="text-sm text-gray-200 mt-1 pb-4 break-words">{selectedCourse.description}</p>
                  </div>

                  {/* RIGHT SIDE - Course Details */}
                  <div className="flex flex-col lg:w-1/2 gap-2 h-fit">

                    <div className='flex flex-row self-center lg:self-end gap-2'>

                      {/* Open in details button */}
                      <a
                        href={`https://www.boilerclasses.com/detail/${selectedCourse.detailId}`}
                        target="_blank"
                      >
                        <div className="flex gap-1 self-end rounded-full border h-8 items-center justify-center px-2 text-sm cursor-pointer transition border-background-secondary bg-background hover:bg-background-secondary">
                          <IoMdOpen />
                          <span className='whitespace-nowrap'>Open Details</span>
                        </div>
                      </a>

                      {/* Add Course button */}
                      {selectedCourse.instructor[CURRENT_SEMESTER] && selectedCourse.instructor[CURRENT_SEMESTER].length > 0 ? (
                        pinCourses.some(course => course.detailId === selectedCourse.detailId) ? (
                          <button
                            className="flex self-end rounded-full border h-8 w-8 items-center justify-center p-0 font-bold cursor-pointer transition border-red-700 bg-red-900 hover:bg-red-700"
                            onClick={() => setPinCourses(pinCourses.filter(course => course.detailId !== selectedCourse.detailId))}
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center"><Spinner /></div>
                            ) : (
                              <div className="flex items-center justify-center"><IoMdTrash size={16} /></div>
                            )}
                          </button>
                        ) : (
                          <button
                            className="flex self-end gap-0.5 rounded-full border h-8 items-center justify-center px-2 text-sm cursor-pointer transition border-green-700 bg-green-900 hover:bg-green-700"
                            onClick={() => {
                              setPinCourses([...pinCourses, {
                                ...selectedCourse,
                                initialPin: true,
                                tmp_inc: Date.now()
                              }]);
                            }}
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center"><Spinner /></div>
                            ) : (<>
                              <IoMdAdd />
                              <span className='whitespace-nowrap'>Add Course</span>
                            </>)}
                          </button>
                        )) : (
                        <Tooltip
                          label={`Course not offered in ${CURRENT_SEMESTER}`}
                          aria-label="Course availability tooltip"
                          hasArrow
                          placement="bottom"
                          background="#a16207"
                        >
                          <div
                            className="flex self-end rounded-full border h-8 w-8 items-center justify-center p-0 font-bold cursor-pointer transition border-yellow-700 bg-yellow-900 hover:bg-yellow-700"
                          >
                            <div className="flex items-center justify-center"><IoIosWarning size={16} /></div>
                          </div>
                        </Tooltip>
                      )}

                    </div>

                    <div className='grid grid-cols-2 gap-4 w-full'>

                      {/* Course Type Display */}
                      <div className='flex flex-col'>
                        <p className='font-bold text-sm'>Course Type</p>

                        <div className='flex flex-row gap-1 flex-wrap'>
                          {/* Schedule Type Display */}
                          {selectedCourse.sched.map((s, i) => (
                            <span className='text-xs px-2 py-1 rounded-full border-solid border bg-purple-600 border-purple-800 whitespace-nowrap text-ellipsis overflow-hidden hover:overflow-visible transition-all z-10'
                              key={i}>
                              {s}
                            </span>
                          ))}


                          {/* Gened Type Display */}
                          {selectedCourse.gened.length > 0 && selectedCourse.gened.map((gened, i) => (
                            <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-[#64919b] border-[#415f65] whitespace-nowrap transition-all`}
                              key={i}>
                              {genedsOptions.filter(x => x.value === gened)[0]?.label || ''}
                            </span>
                          ))}
                        </div>
                      </div>


                      {/* Credits Display */}
                      <div className="text-sm font-bold flex flex-col">
                        Credits
                        <p className='px-4 text-opposite bg-background-opposite rounded-md text-center w-fit'>
                          {selectedCourse.credits[0] === selectedCourse.credits[1]
                            ? `${selectedCourse.credits[0]}`
                            : `${selectedCourse.credits[0]} - ${selectedCourse.credits[1]}`}
                        </p>
                      </div>

                    </div>



                    {/* Instructors Display */}
                    <div>
                      <p className="text-sm font-bold">Instructors</p>
                      <div className="flex flex-wrap flex-row gap-x-1 text-sm text-blue-400 font-light">


                        {selectedCourse.instructor[CURRENT_SEMESTER] ? (
                          selectedCourse.instructor[CURRENT_SEMESTER].map((prof, i) => (

                            <span key={i}>
                              <a
                                href={`https://www.ratemyprofessors.com/search/professors/783?q=${prof.split(" ")[0]} ${prof.split(" ")[prof.split(" ").length - 1]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className='underline decoration-dotted hover:text-blue-300 transition-all duration-300 ease-out'
                                key={i}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {prof}
                              </a>
                              {i < selectedCourse.instructor[CURRENT_SEMESTER].length - 1 && ", "}
                            </span>
                          ))
                        ) : (
                          <p className='text-primary text-sm font-light text-left w-full'>No instructors listed for {CURRENT_SEMESTER}</p>
                        )}
                      </div>
                    </div>

                    {/* Prerequisites Display */}
                    {selectedCourse.prereqs && (
                      <div className='w-full'>
                        <p className="text-sm font-bold">Prerequisites</p>
                        <Prereqs
                          course={selectedCourse}
                          scheduler={true}
                        />
                      </div>
                    )}

                    {/* gpaModal */}
                    <div className='w-full'>
                      <p className="text-sm font-bold">GPA Avg Per Semester</p>
                      <ScheduleGpaModal
                        course={selectedCourse}
                      />
                    </div>

                  </div>
                </div>
                {/* <p>{selectedCourse.gpa[""]}</p> */}


                {/* Graph */}
                <div className="my-4">
                  {gpaGraph.datasets &&
                    gpaGraph.datasets.length > 0 &&
                    !gpaGraph.datasets[0].data.every(value => value === 0) ? (
                    <div className='border border-background-secondary shadow-md shadow-white/10 rounded-xl h-96'>
                      <div className='h-full'>
                        <Graph data={gpaGraph} scheduler />
                      </div>
                    </div>
                  ) : (
                    <div className="border border-background-secondary shadow-md shadow-white/10 rounded-xl bg-background p-4">
                      <h1 className="text-center text-md font-light text-primary py-4">
                        No grade data available for this course.
                      </h1>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Schedule;