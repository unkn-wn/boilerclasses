// CourseCatalog.js

import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import Card from "../components/card"
import Footer from "../components/footer"
import { ChevronDownIcon, ChevronUpIcon, HamburgerIcon, WarningTwoIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { Collapse } from 'react-collapse';
import Select from 'react-select';
import Head from "next/head";
import Script from 'next/script';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Checkbox,
  Grid,
  Button
} from '@chakra-ui/react'

import { subjectStyles, semesterStyles, subjects, semesterOptions, subjectOptions, genedsOptions, instructorStyles } from '@/lib/utils';

const currentSemester = "Spring 2025";

const CourseCatalog = () => {

  const router = useRouter();
  const { query } = router;

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([{ label: currentSemester, value: currentSemester }]);
  const [selectedGenEds, setSelectedGenEds] = useState([]);
  const [creditsMin, setCreditsMin] = useState(0);
  const [creditsMax, setCreditsMax] = useState(18);
  const [levelMin, setLevelMin] = useState(100);
  const [levelMax, setLevelMax] = useState(900);
  const [levels, setLevels] = useState([100, 200, 300, 400, 500, 600, 700, 800, 900]);
  const [scheds, setScheds] = useState(["Clinic",
    "Distance Learning",
    "Experiential",
    "Individual Study",
    "Laboratory",
    "Laboratory Preparation",
    "Lecture",
    "Practice Study Observation",
    "Presentation",
    "Recitation",
    "Research",
    "Studio"]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState(transform(query.q) || '');
  const [displayLanding, setDisplayLanding] = useState(true);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);


  // Gets all the filters as a string for displaying to users
  const getAllFiltersString = () => {
    const selectedSubjectsString = selectedSubjects.length != 0 ? (selectedSubjects.length == 1 ? selectedSubjects[0].value : "subjects") : "";
    // if single semester selected, show that semester
    const selectedSemestersString = selectedSemesters.length > 0 ? (selectedSemesters.length == 1 ? selectedSemesters[0].label : "semesters") : "";
    const selectedGenEdsString = selectedGenEds.length != 0 ? (selectedGenEds.length == 1 ? selectedGenEds[0].label : "gen eds") : "";
    const creditsString = creditsMin != 0 || creditsMax != 18 ? "credits" : "";
    // levelsString checking if length is 9 for 100-900
    const levelsString = levels.length != 9 ? "levels" : "";
    // checkinf if length is 12 for all 12 types
    const schedsString = scheds.length != 12 ? "type of course" : "";

    return [selectedSubjectsString, selectedSemestersString, selectedGenEdsString, creditsString, levelsString, schedsString].filter(x => x != "").join(", ");
  }

  const allFiltersString = getAllFiltersString();

  // Function to change from initial page to search result page
  function changeLanding(event) {
    if (event.length >= 2) {
      setDisplayLanding(false);
      setSearchTerm(event);
    }
  }

  function transform(query) {
    if (!query) {
      return "";
    }
    query = query.trim()
    query = query.replaceAll(/[-;+]/g, " ");
    query = query.replaceAll(/[~!#%$^&*()\[\]\{\}:'<>,@=|?.`"“”]/g, "");
    query = query.replaceAll(/[–—…«»‘’]/g, " ");
    query = query.replaceAll(/([a-zA-Z])(\d)/g, '$1 $2');
    query = query.trim()
    return query;
  }

  // On a filter change, rerun the search
  useEffect(() => {
    search();
  }, [JSON.stringify(selectedSubjects), JSON.stringify(selectedSemesters), JSON.stringify(selectedGenEds), transform(searchTerm), creditsMin, creditsMax, levelMin, levelMax, JSON.stringify(levels), JSON.stringify(scheds)]);

  // This is used for focusing on proper search bar on load
  useEffect(() => {
    if (!displayLanding) {
      var input = document.getElementById('search');
    } else {
      var input = document.getElementById('landingSearch');
    }
    input.focus();
  }, [displayLanding]);


  // Search function, set courses to the result of the search
  const search = async (event) => {
    if (searchTerm.length <= 1 && selectedSubjects.length == 0 && selectedSemesters.length == 0 && selectedGenEds.length == 0) {
      setCourses([]);
    } else {
      const subParam = selectedSubjects.map((x) => x.value)
      const termParam = selectedSemesters.map((x) => x.value)
      const genParam = selectedGenEds.map((x) => x.value)
      const params = new URLSearchParams({ q: transform(searchTerm), sub: subParam, term: termParam, gen: genParam, cmin: creditsMin, cmax: creditsMax, levels: levels, sched: scheds, maxlim: 100 });
      fetch('/api/search?' + params)
        .then((response) => response.json())
        .then((data) => {
          //TEMPORAY FIX FOR DESCRIPTIONS
          //for every item, console log description
          data['courses']['documents'].map((item) => {
            //console.log(item.value.description)
            //If description begins with <a href= then set it to No Description Available
            if (item.value.description.startsWith("<a href=")) {
              item.value.description = "No Description Available"
            }
          })
          //END TEMPORARY FIX

          setCourses(data['courses']['documents']);
        })
    }
  };

  useEffect(() => {
    // Set searchbar to searchTerm, and change landing
    changeLanding(searchTerm);
  }, [searchTerm]);


  // scroll to top listener
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        const scrollToTopBtn = document.getElementById("scrollToTopBtn");
        const onScroll = () => {
          if (scrollToTopBtn) {
            if (window.scrollY > 400) {
              scrollToTopBtn.style.display = "block";
            } else {
              scrollToTopBtn.style.display = "none";
            }
          }
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
      }
    } catch (e) { }
  }, []);



  return (
    <>
      {/* <!-- Google tag (gtag.js) --> */}
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=G-48L6TGYD2L`}
      />
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-48L6TGYD2L', {
              page_path: window.location.pathname,
            });
          `
        }}
      />
      <Head>
        <title>BoilerClasses - Purdue Course Catalog</title>
        <meta name="title" content="BoilerClasses - Purdue Course Catalog" />
        <meta name="description" content="BoilerClasses (Boiler Classes) - Purdue's course catalog with over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more." />
        <meta name="keywords" content="Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers" />
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
        <button className='fixed bg-zinc-900 z-50 w-12 h-12 rounded-full right-12 bottom-20 shadow-black shadow-sm hover:bg-zinc-700 transition' onClick={() => window.scrollTo({ top: "0px", behavior: "smooth" })}>
          <ArrowUpIcon fontSize={[18, 24]} color={'white'} />
        </button>
      </div>
      {!displayLanding ?
        <div id="parent" className={`flex flex-col h-screen min-h-screen bg-neutral-950 container mx-auto p-4 ${inter.className}`}>
          <div className='flex flex-row my-2 md:my-4 lg:my-0 lg:mt-4 lg:mb-8'>
            <img src='/boilerclasses-FULL.png' onClick={() => changeLanding("")} className='my-auto w-10 h-10 ml-2 mr-2 lg:ml-0 md:w-16 md:h-16 cursor-pointer' />
            <h1 onClick={() => changeLanding("")} className='text-2xl md:text-5xl font-semibold my-auto ml-2 select-none text-white cursor-pointer'>BoilerClasses</h1>
          </div>
          {/* Search Bar */}
          <div className="mb-6">
            <input
              id="search"
              type="text"
              placeholder="Search for courses..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
              }}
              className="text-white text-xl bg-neutral-950 w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
            />
          </div>

          {/* All filters*/}
          <div className="flex flex-col mb-4 gap-2">
            <Collapse isOpened={filtersCollapsed}>
              <div className='w-full flex place-content-end'>
                <div onClick={() => setFiltersCollapsed(false)} className='flex gap-2 items-center justify-center p-2 rounded-lg cursor-pointer bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 transition-all'>
                  <HamburgerIcon />
                    {allFiltersString != "" ?
                      <p className="line-clamp-2 md:line-clamp-1 max-w-md">Filtering by {allFiltersString}</p>
                      :
                      <p>Show filters</p>
                    }
                </div>
              </div>
            </Collapse>
            <Collapse isOpened={!filtersCollapsed}>
              <div className='flex flex-row items-center gap-5'>
                <p className='text-white whitespace-nowrap lg:block hidden'>Filter by </p>
                <div className='flex flex-row w-full justify-evenly gap-5 items-center lg:flex-nowrap flex-wrap'>
                  <Select
                    isMulti
                    options={subjectOptions}
                    className="basic-multi-select w-full"
                    classNamePrefix="select"
                    placeholder="Subject..."
                    styles={instructorStyles}
                    color="white"
                    onChange={(value) => {
                      setSelectedSubjects(value)
                    }}
                  />
                  <Select
                    isMulti
                    options={semesterOptions}
                    className="basic-multi-select w-full"
                    classNamePrefix="select"
                    placeholder="Semester..."
                    defaultValue={semesterOptions[0]}
                    styles={instructorStyles}
                    color="white"
                    onChange={(value) => {
                      setSelectedSemesters(value)
                    }}
                  />
                  <Select
                    isMulti
                    options={genedsOptions}
                    className="basic-multi-select w-full"
                    classNamePrefix="select"
                    placeholder="Gen Ed..."
                    styles={instructorStyles}
                    color="white"
                    onChange={(value) => {
                      setSelectedGenEds(value)
                    }}
                  />

                  {/* Credits filter */}
                  <Popover placement='bottom-start'>
                    <PopoverTrigger>
                      <button className='flex flex-row gap-4 px-4 py-1.5 bg-zinc-900 items-center border text-white rounded-xl border-zinc-900 hover:border-zinc-700' >
                        <span>Credits</span>
                        <ChevronDownIcon color='gray-800' />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-zinc-900 border-gray-800 '>
                      <PopoverBody paddingLeft={8} paddingRight={8} paddingTop={4} paddingBottom={4}>
                        <RangeSlider aria-label={['min', 'max']} defaultValue={[0, 100]} step={100 / 18}
                          onChange={(val) => {
                            setCreditsMin(Math.round((val[0] * 18 / 100)))
                            setCreditsMax(Math.round((val[1] * 18 / 100)))
                          }}
                        >
                          <RangeSliderTrack>
                            <RangeSliderFilledTrack />
                          </RangeSliderTrack>
                          <RangeSliderThumb index={0} />
                          <RangeSliderThumb index={1} />
                        </RangeSlider>
                        <div className='text-white'>
                          {creditsMin} - {creditsMax} Credits
                        </div>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                  <Popover placement='bottom-start'>
                    <PopoverTrigger>
                      <button className='flex flex-row gap-4 px-4 py-1.5 bg-zinc-900 items-center border text-white rounded-xl border-zinc-900 hover:border-zinc-700' >
                        <span>Level</span>
                        <ChevronDownIcon color='gray-800' />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-black border-gray-800' width='fit-content'>
                      <Grid templateColumns='repeat(3, 1fr)' gap={3} marginLeft={6} marginRight={6} paddingTop={3}>
                        <Checkbox size='md' isChecked={levels.includes(100)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 100]) : setLevels(levels.filter(x => x !== 100))}>100</Checkbox>
                        <Checkbox size='md' isChecked={levels.includes(200)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 200]) : setLevels(levels.filter(x => x !== 200))}>200</Checkbox>
                        <Checkbox size='md' isChecked={levels.includes(300)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 300]) : setLevels(levels.filter(x => x !== 300))}>300</Checkbox>
                        <Checkbox size='md' isChecked={levels.includes(400)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 400]) : setLevels(levels.filter(x => x !== 400))}>400</Checkbox>
                        <Checkbox size='md' isChecked={levels.includes(500)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 500]) : setLevels(levels.filter(x => x !== 500))}>500</Checkbox>
                        <Checkbox size='md' isChecked={levels.includes(600)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 600]) : setLevels(levels.filter(x => x !== 600))}>600</Checkbox>
                        <Checkbox size='md' isChecked={levels.includes(700)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 700]) : setLevels(levels.filter(x => x !== 700))}>700</Checkbox>
                        <Checkbox size='md' isChecked={levels.includes(800)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 800]) : setLevels(levels.filter(x => x !== 800))}>800</Checkbox>
                        <Checkbox size='md' isChecked={levels.includes(900)} textColor='white' onChange={(e) => e.target.checked ? setLevels([...levels, 900]) : setLevels(levels.filter(x => x !== 900))}>900</Checkbox>
                      </Grid>
                      <div className='flex flex-row justify-evenly m-4 grow	gap-2'>
                        <Button size='sm' className='w-full' onClick={() => setLevels([100, 200, 300, 400, 500, 600, 700, 800, 900])}>Reset</Button>
                        <Button size='sm' className='w-full' onClick={() => setLevels([])}>Clear</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover placement='bottom-start'>
                    <PopoverTrigger>
                      <button className='flex flex-row gap-4 px-4 py-1.5 bg-zinc-900 items-center border text-white rounded-xl border-zinc-900 hover:border-zinc-700' >
                        <span>Schedule</span>
                        <ChevronDownIcon color='gray-800' />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-black border-gray-800' width='fit-content'>
                      <Grid templateColumns='repeat(1, 1fr)' gap={3} marginLeft={6} marginRight={6} paddingTop={3}>
                        <Checkbox size='md' isChecked={scheds.includes("Lecture")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Lecture"]) : setScheds(scheds.filter(x => x !== "Lecture"))}>Lecture</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Distance Learning")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Distance Learning"]) : setScheds(scheds.filter(x => x !== "Distance Learning"))}>Distance Learning</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Studio")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Studio"]) : setScheds(scheds.filter(x => x !== "Studio"))}>Studio</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Individual Study")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Individual Study"]) : setScheds(scheds.filter(x => x !== "Individual Study"))}>Individual Study</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Clinic")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Clinic"]) : setScheds(scheds.filter(x => x !== "Clinic"))}>Clinic</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Experiential")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Experiential"]) : setScheds(scheds.filter(x => x !== "Experiential"))}>Experiential</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Research")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Research"]) : setScheds(scheds.filter(x => x !== "Research"))}>Research</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Recitation")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Recitation"]) : setScheds(scheds.filter(x => x !== "Recitation"))}>Recitation</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Practice Study Observation")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Practice Study Observation"]) : setScheds(scheds.filter(x => x !== "Practice Study Observation"))}>Practice Study Observation</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Laboratory")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Laboratory"]) : setScheds(scheds.filter(x => x !== "Laboratory"))}>Laboratory</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Laboratory Preparation")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Laboratory Preparation"]) : setScheds(scheds.filter(x => x !== "Laboratory Preparation"))}>Laboratory Preparation</Checkbox>
                        <Checkbox size='md' isChecked={scheds.includes("Presentation")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Presentation"]) : setScheds(scheds.filter(x => x !== "Presentation"))}>Presentation</Checkbox>
                      </Grid>
                      <div className='flex flex-row justify-evenly m-4 grow	gap-2'>
                        <Button size='sm' className='w-full' onClick={() => setScheds(["Clinic", "Distance Learning", "Experiential", "Individual Study", "Laboratory", "Laboratory Preparation", "Lecture", "Practice Study Observation", "Presentation", "Recitation", "Research", "Studio"])}>Reset</Button>
                        <Button size='sm' className='w-full' onClick={() => setScheds([])}>Clear</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </Collapse>

            {/* Hide filters button */}
            <Collapse isOpened={!filtersCollapsed} >
              <div className="flex flex-col w-full items-center text-white" >
                <button onClick={() => setFiltersCollapsed(true)} className="flex flex-col items-center cursor-pointer hover:-translate-y-1 transition" >
                  <ChevronUpIcon />
                  Hide filters
                </button>
              </div>
            </Collapse>
          </div>

          {courses.length > 0 || searchTerm.length < 2 ?
            <div className="text-black grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
              {courses.length > 0 && courses.map(course => (
                <Card key={course.id} course={course.value} searchTerm={searchTerm} />
                // <div key={course.id}
                //   // onClick={() => openPopUp(course.title, course.subjectCode, course.courseCode, course.instructor, course.description, course.capacity, course.credits, course.term)}
                //   >


                //   {/* <a onClick={(e) => e.stopPropagation()} href={`https://www.ratemyprofessors.com/search/professors/783?q=${course.instructor[0]}`}
                //     target="_blank"
                //     rel="noopener noreferrer"
                //     className=''>
                //     <button className='bg-blue-500 text-white rounded-md px-2 py-1 shadow-md hover:-translate-y-1 transition-all bottom-0'>RateMyProfessor</button>
                //   </a> */}

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

        :

        /* Landing Page */
        <div>
          <div className="flex-col z-40 grid place-content-center mx-4 h-screen items-center">
            <div className='flex flex-row justify-around my-2 md:gap-4 md:my-4 lg:my-0 lg:mt-4 lg:mb-6'>
              <img src='/boilerclasses-FULL.png' onClick={() => changeLanding("")} className='my-auto w-10 h-10 mx-2 md:w-16 md:h-16 lg:w-20 lg:h-20 cursor-pointer' />
              <h1 onClick={() => changeLanding("")} className='text-2xl md:text-6xl mr-2 font-semibold my-auto select-none text-white cursor-pointer'>BoilerClasses</h1>
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
      }
    </>
  );
};

export default CourseCatalog;


