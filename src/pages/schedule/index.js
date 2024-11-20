// schedule.boilerclasses.com

import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Spinner } from '@chakra-ui/react'

import { useSearchFilters, CURRENT_SEMESTER } from '@/hooks/useSearchFilters';
import { genedsOptions, labels, graphColors } from '@/lib/utils';

import CourseSearch from '@/components/courseSearch';
import ScheduleCalendar from '@/components/schedule';
import Graph, { sanitizeDescription, collectAllProfessors, calculateGradesAndGPA, averageAllData } from '@/components/graph';
import { ScheduleGpaModal } from '@/components/gpaModal';
import Prereqs from '@/components/prereqs';

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

  const [pinCourses, setPinCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Process data into graph data
  useEffect(() => {
    if (!selectedCourse) return;

    sanitizeDescription(selectedCourse.value);
    const allProfs = collectAllProfessors(selectedCourse.value.instructor);
    const { grades, gpa } = calculateGradesAndGPA(
      allProfs,
      selectedCourse.value.gpa,
      graphColors
    );

    const averageGrades = averageAllData(grades);

    setGpaGraph({
      labels,
      datasets: averageGrades,
    });
  }, [selectedCourse]);

  // When selecting an item
  const handleOnSelect = (course) => {
    if (!course) {
      console.error("No course selected");
      return;
    }
    console.log("Selected course:", course);
    updateFilter('searchTerm', '');
    setSelectedCourse(course);
  };

  return (
    <>
      <Head>
        <title>Schedule Assistant - BoilerClasses</title>
        <meta name="title" content="Schedule Assistant - BoilerClasses" />
        <meta name="description" content="BoilerClasses Scheduling Assistant - Plan your next courses from over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more." />
        <meta name="keywords" content="Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, Courses, Schedule, Scheduling, Assistant, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers" />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />
        <link rel="canonical" href="https://schedule.boilerclasses.com/" />
      </Head>

      <div id="parent" className="flex flex-row gap-10 h-screen min-h-screen bg-neutral-950 container mx-auto p-4 text-white">
        {/* Left Side */}
        <div className='flex flex-col w-1/2 gap-2'>
          {/* Logo */}
          <div className='flex flex-row my-2 justify-center'>
            <Link className="flex flex-row" href='https://boilerclasses.com'>
              <img
                src='/boilerclasses-FULL.png'
                className='my-auto w-8 h-8'
                alt="BoilerClasses Logo"
              />
              <h1 className='text-md md:text-lg font-semibold my-auto ml-2 select-none text-white'>
                BoilerClasses
              </h1>
            </Link>
          </div>

          <div className='mx-2'>
            <ScheduleCalendar courses={pinCourses} setIsLoading={setIsLoading} />
          </div>
        </div>

        {/* Right Side */}
        <div className='flex flex-col w-1/2 h-full overflow-hidden'>
          <div className="mb-6">
            <CourseSearch
              courses={courses}
              onSelect={handleOnSelect}
              searchTerm={filters.searchTerm}
              updateFilter={updateFilter}
            />
          </div>
          {selectedCourse === null ? (
            <div className='flex flex-col h-full justify-center mx-12'>
              <h1 className='font-bold text-3xl'>Welcome to <span className='text-yellow-500'>BoilerClasses</span></h1>
              <h2 className='font-light text-sm'>
                Utilize the scheduling assistant to plan your semester. Use the search bar to find courses, and pin them to show up in the schedule!
              </h2>
            </div>
          ) : (
            <>
              {/* Selected Course */}
              <div className='flex flex-col h-full'>
                <div className='flex flex-row gap-2 h-1/2 overflow-y-scroll p-4 rounded-xl shadow-white/10 bg-zinc-900 shadow-md border-zinc-800 border'>

                  {/* LEFT SIDE - Course Info */}
                  <div className='w-1/2'>
                    <h1 className='font-bold text-3xl'>{selectedCourse.value.subjectCode} {selectedCourse.value.courseCode}</h1>
                    <h2 className='font-bold text-lg'>{selectedCourse.value.title}</h2>

                    {/* Description Display */}
                    <p className="text-sm text-gray-200 mt-1 pb-4 break-words">{selectedCourse.value.description}</p>
                  </div>

                  {/* RIGHT SIDE - Course Details */}
                  <div className="flex flex-col w-1/2 gap-2 h-fit">

                    {/* Pin Course button */}
                    {pinCourses.some(course => course.detailId === selectedCourse.value.detailId) ? (
                      <div
                        className="flex self-end rounded-full border h-8 w-8 text-center justify-center px-2 font-bold shadow-sm shadow-white/20 cursor-pointer transition border-red-700 bg-red-900 hover:bg-red-700"
                        onClick={() => setPinCourses(pinCourses.filter(course => course.detailId !== selectedCourse.value.detailId))}
                      >
                        {isLoading ? <div><Spinner /></div> : '-'}
                      </div>
                    ) : (
                      <div
                        className="flex self-end rounded-full border h-8 w-8 text-center justify-center px-2 font-bold shadow-sm shadow-white/20 cursor-pointer transition border-yellow-500 bg-yellow-500/50 hover:bg-yellow-500"
                        onClick={() => setPinCourses([...pinCourses, selectedCourse.value])}
                      >
                        {isLoading ? <div><Spinner /></div> : '+'}
                      </div>
                    )}

                    <div className='grid grid-cols-2 gap-4 w-full'>

                      {/* Course Type Display */}
                      <div className='flex flex-col'>
                        <p className='font-bold text-sm'>Course Type</p>

                        <div className='flex flex-row gap-1 flex-wrap'>
                          {/* Schedule Type Display */}
                          {selectedCourse.value.sched.map((s, i) => (
                            <span className='text-xs px-2 py-1 rounded-full border-solid border bg-purple-600 border-purple-800 whitespace-nowrap text-ellipsis overflow-hidden hover:overflow-visible transition-all z-10'
                              key={i}>
                              {s}
                            </span>
                          ))}


                          {/* Gened Type Display */}
                          {selectedCourse.value.gened.map((gened, i) => (
                            <span className={`text-xs px-2 py-1 rounded-full border-solid border bg-[#64919b] border-[#415f65] whitespace-nowrap transition-all`}
                              key={i}>
                              {genedsOptions.filter(x => x.value === gened)[0].label}
                            </span>
                          ))}
                        </div>
                      </div>


                      {/* Credits Display */}
                      <div className="text-sm font-bold flex flex-col">
                        Credits
                        <p className='px-4 text-black bg-white rounded-md text-center w-fit'>
                          {selectedCourse.value.credits[0] === selectedCourse.value.credits[1]
                            ? `${selectedCourse.value.credits[0]}`
                            : `${selectedCourse.value.credits[0]} - ${selectedCourse.value.credits[1]}`}
                        </p>
                      </div>

                    </div>



                    {/* Instructors Display */}
                    <div>
                      <p className="text-sm font-bold">Instructors</p>
                      <div className="flex flex-wrap flex-row gap-x-1 text-sm text-blue-400 font-light">


                        {selectedCourse.value.instructor[CURRENT_SEMESTER].map((prof, i) => (
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
                            {i < selectedCourse.value.instructor[CURRENT_SEMESTER].length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Prerequisites Display */}
                    {selectedCourse.value.prereqs && (
                      <div className='w-full'>
                        <p className="text-sm font-bold">Prerequisites</p>
                        <Prereqs
                          course={selectedCourse.value}
                        />
                      </div>
                    )}

                    {/* gpaModal */}
                    <div className='w-full'>
                      <p className="text-sm font-bold">GPA Averages (Last 5 Semesters)</p>
                      <ScheduleGpaModal
                        course={selectedCourse.value}
                      />
                    </div>

                  </div>
                </div>
                {/* <p>{selectedCourse.value.gpa[""]}</p> */}


                {/* Graph */}
                <div className='border border-zinc-800 shadow-md shadow-white/10 h-1/3 rounded-xl my-4'>

                  {gpaGraph.datasets ? (
                    <div className='h-full'>
                      <Graph data={gpaGraph} />
                    </div>
                  ) : (
                    <div className="flex flex-col w-full h-96 bg-zinc-900 mx-auto p-4 rounded-xl">
                      <div className="h-full w-full mb-4">
                        <h1 className="text-center text-lg font-semibold text-white">
                          No grade data available for this course.
                        </h1>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Schedule;