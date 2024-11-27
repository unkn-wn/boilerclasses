// CourseCatalog.js

import React, { useEffect } from 'react';
import { Inter } from 'next/font/google';
import Card from "../components/card";
import Footer from "../components/footer";
import Head from "next/head";

import { WarningTwoIcon, ArrowUpIcon } from '@chakra-ui/icons';

import SearchFilters from '@/components/searchFilters';
import { useSearchFilters } from '@/hooks/useSearchFilters';

const inter = Inter({ subsets: ['latin'] });
const currentSemester = "Spring 2025";

const CourseCatalog = () => {

  const {
    filters,
    updateFilter,
    displayLanding,
    setDisplayLanding,
    filtersCollapsed,
    setFiltersCollapsed,
    courses,
    transformQuery
  } = useSearchFilters(currentSemester);

  // Gets all the filters as a string for displaying to users
  const getAllFiltersString = () => {
    const selectedSubjectsString = filters.subjects.length !== 0
      ? (filters.subjects.length === 1 ? filters.subjects[0].value : "subjects")
      : "";
    const selectedSemestersString = filters.semesters.length > 0
      ? (filters.semesters.length === 1 ? filters.semesters[0].label : "semesters")
      : "";
    const selectedGenEdsString = filters.genEds.length !== 0
      ? (filters.genEds.length === 1 ? filters.genEds[0].label : "gen eds")
      : "";
    const creditsString = filters.credits.min !== 0 || filters.credits.max !== 18 ? "credits" : "";
    const levelsString = filters.levels.length !== 9 ? "levels" : "";
    const schedsString = filters.scheduleTypes.length !== 12 ? "type of course" : "";

    return [
      selectedSubjectsString,
      selectedSemestersString,
      selectedGenEdsString,
      creditsString,
      levelsString,
      schedsString
    ].filter(x => x !== "").join(", ");
  };

  // Function to change from initial page to search result page
  const changeLanding = (searchTerm) => {
    if (searchTerm.length >= 2) {
      setDisplayLanding(false);
      updateFilter('searchTerm', searchTerm);
    }
  };

  // Make sure search bar updates when query changes
  useEffect(() => {
    changeLanding(filters.searchTerm || "");
  }, [filters.searchTerm]);

  // Focus on proper search bar on load
  useEffect(() => {
    const inputId = displayLanding ? 'landingSearch' : 'search';
    document.getElementById(inputId)?.focus();
  }, [displayLanding]);

  // Scroll to top listener
  useEffect(() => {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    const onScroll = () => {
      if (scrollToTopBtn) {
        scrollToTopBtn.style.display = window.scrollY > 400 ? "block" : "none";
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Get all filters as a string
  const allFiltersString = getAllFiltersString();

  return (
    <>
      <Head>
        <title>BoilerClasses - Purdue Course Catalog</title>
        <meta name="title" content="BoilerClasses - Purdue Course Catalog" />
        <meta name="description" content="BoilerClasses (Boiler Classes) - Purdue's course catalog with over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more." />
        <meta name="keywords" content="Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, Courses, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers" />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <meta property="og:url" content="https://boilerclasses.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BoilerClasses - Purdue Course Catalog" />
        <meta property="og:description" content="BoilerClasses (Boiler Classes) is a Purdue course catalog containing 8000+ Purdue courses and courses. Find geneds, grades, prerequisites, and more." />
        <meta property="og:image" content="https://opengraph.b-cdn.net/production/documents/a3f504c0-3442-4320-8fc3-f850a5bd1582.png?token=oOcg3vK9F6YcqVmHSegc9vJczzLuo4Oq-yrDM01kKtQ&height=776&width=1200&expires=33246633286" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="boilerclasses.com" />
        <meta property="twitter:url" content="https://boilerclasses.com/" />
        <meta name="twitter:title" content="BoilerClasses - Purdue Course Catalog" />
        <meta name="twitter:description" content="BoilerClasses (Boiler Classes) is a Purdue course catalog containing 8000+ Purdue courses and courses. Find geneds, grades, prerequisites, and more." />
        <meta name="twitter:image" content="https://opengraph.b-cdn.net/production/documents/a3f504c0-3442-4320-8fc3-f850a5bd1582.png?token=oOcg3vK9F6YcqVmHSegc9vJczzLuo4Oq-yrDM01kKtQ&height=776&width=1200&expires=33246633286" />

        <link rel="canonical" href="https://boilerclasses.com/" />
      </Head>

      <div id="scrollToTopBtn" className='hidden'>
        <button
          className='fixed bg-zinc-900 z-50 w-12 h-12 rounded-full right-12 bottom-20 shadow-black shadow-sm hover:bg-zinc-700 transition'
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUpIcon fontSize={[18, 24]} color={'white'} />
        </button>
      </div>

      {!displayLanding ? (
        <div id="parent" className={`flex flex-col h-screen min-h-screen bg-neutral-950 container mx-auto p-4 ${inter.className}`}>
          {/* Header */}
          <div className='flex flex-row my-2 md:my-4 lg:my-0 lg:mt-4 lg:mb-8'>
            <img
              src='/boilerclasses-FULL.png'
              onClick={() => setDisplayLanding(true)}
              className='my-auto w-10 h-10 ml-2 mr-2 lg:ml-0 md:w-16 md:h-16 cursor-pointer'
              alt="BoilerClasses Logo"
            />
            <h1
              onClick={() => setDisplayLanding(true)}
              className='text-2xl md:text-5xl font-semibold my-auto ml-2 select-none text-white cursor-pointer'
            >
              BoilerClasses
            </h1>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              id="search"
              type="text"
              placeholder="Search for courses..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="text-white text-xl bg-neutral-950 w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
            />
          </div>

          {/* Filters */}
          <SearchFilters
            filters={filters}
            updateFilter={updateFilter}
            filtersCollapsed={filtersCollapsed}
            setFiltersCollapsed={setFiltersCollapsed}
            allFiltersString={allFiltersString}
          />

          {/* Results */}
          {courses.length > 0 || filters.searchTerm.length < 2 ?
            <div className="text-black grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
              {courses.length > 0 && courses.map(course => (
                <Card key={course.id} course={course.value} searchTerm={filters.searchTerm} />
              ))}
            </div>
            :
            <div className='flex flex-col h-full w-full items-center justify-center align-center gap-2'>
              <WarningTwoIcon boxSize={16} color='#DAAA00' />
              <div className='text-white'>No results found!</div>
              <div className='text-white -translate-y-3'>Try changing the filters</div>
            </div>
          }
          <div className='mt-auto'>
            <Footer />
          </div>
        </div>

      ) : (

        /* Landing Page */
        <div>
          <div className="flex-col z-40 grid place-content-center mx-4 h-screen items-center">
            <div className='flex flex-row justify-around my-2 md:gap-4 md:my-4 lg:my-0 lg:mt-4 lg:mb-6'>
              <img src='/boilerclasses-FULL.png' onClick={() => setDisplayLanding(false)} className='my-auto w-10 h-10 mx-2 md:w-16 md:h-16 lg:w-20 lg:h-20 cursor-pointer' />
              <h1 onClick={() => setDisplayLanding(false)} className='text-2xl md:text-6xl mr-2 font-semibold my-auto select-none text-white cursor-pointer'>BoilerClasses</h1>
            </div>
            <input
              id="landingSearch"
              type="text"
              placeholder="I want to take a class about..."
              onChange={(e) => {
                changeLanding(e.target.value);
              }}
              className="text-white text-sm md:text-xl bg-neutral-950 w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
            />

          </div >
          <div className='absolute bottom-0 w-full'>
            <Footer />
          </div>
        </div>
      )}
    </>
  );
};

export default CourseCatalog;


