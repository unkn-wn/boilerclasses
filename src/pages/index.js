// CourseCatalog.js

import React, { use, useState, useEffect } from 'react';
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import Card from "../components/card"
import Footer from "../components/footer"
import { ChevronDownIcon, WarningTwoIcon } from '@chakra-ui/icons'
import Select from 'react-select';
import Head from "next/head";
import Script from 'next/script';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Stack,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Checkbox,
  Grid,
  Button
} from '@chakra-ui/react'

import { subjectStyles, semesterStyles, subjects, semesterOptions, subjectOptions, genedsOptions, instructorStyles } from '@/lib/utils';


const CourseCatalog = () => {

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([{ label: "Fall 2024", value: "Fall 2024" }]);
  const [selectedGenEds, setSelectedGenEds] = useState([]);
  const [creditsMin, setCreditsMin] = useState(0);
  const [creditsMax, setCreditsMax] = useState(18);
  const [levelMin, setLevelMin] = useState(100);
  const [levelMax, setLevelMax] = useState(900);
  const [levels, setLevels] = useState([100, 200, 300, 400, 500, 600, 700, 800, 900]);
  const [scheds, setScheds] = useState(["Lecture", "Distance Learning"]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayLanding, setDisplayLanding] = useState(true);

  function changeLanding(event) {
    if (event.length >= 2) {
      setDisplayLanding(!displayLanding);
      setSearchTerm(event);
    }
  }

  function transform(query) {
    query = query.trim()
    query = query.replaceAll(/[-;+]/g, " ");
    query = query.replaceAll(/[~!#%$^&*()\[\]\{\}:'<>,@=|?.`"“”]/g, "");
    query = query.replaceAll(/[–—…«»‘’]/g, " ");
    query = query.replaceAll(/([a-zA-Z])(\d)/g, '$1 $2');
    query = query.trim()
    return query;
  }


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


  const search = async (event) => {
    if (searchTerm.length <= 1 && selectedSubjects.length == 0 && selectedSemesters.length == 0 && selectedGenEds.length == 0) {
      setCourses([]);
    } else {
      const subParam = selectedSubjects.map((x) => x.value)
      const termParam = selectedSemesters.map((x) => x.value)
      const genParam = selectedGenEds.map((x) => x.value)
      const params = new URLSearchParams({ q: transform(searchTerm), sub: subParam, term: termParam, gen: genParam, cmin: creditsMin, cmax: creditsMax, levels: levels, sched: scheds});
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


  return (
    <>
      <Head>
        <title>BoilerClasses - Purdue University's Unofficial Course Catalog</title>
        {/* <!-- Google tag (gtag.js) --> */}
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
        <meta name="title" content="BoilerClasses - Purdue University's Unofficial Course Catalog" />
        <meta name="description" content="A more user-friendly course catalog for Purdue students with blazing-fast search. From 8000+ classes offered, find more engaging geneds, discover classes more aligned with your interests, and delve into specialized offerings. BoilerClasses is an all-in-one access that provides related links for each course, including RateMyProfessor reviews, in one centralized platform." />
        <meta name="keywords" content="Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers" />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <meta property="og:url" content="https://boilerclasses.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BoilerClasses - Purdue University's Unofficial Course Catalog" />
        <meta property="og:description" content="A more user-friendly course catalog for Purdue students with blazing-fast search. From 8000+ classes offered, find more engaging geneds, discover classes more aligned with your interests, and delve into specialized offerings. BoilerClasses is an all-in-one access that provides related links for each course, including RateMyProfessor reviews, in one centralized platform." />
        <meta property="og:image" content="https://opengraph.b-cdn.net/production/documents/a3f504c0-3442-4320-8fc3-f850a5bd1582.png?token=oOcg3vK9F6YcqVmHSegc9vJczzLuo4Oq-yrDM01kKtQ&height=776&width=1200&expires=33246633286" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="boilerclasses.com" />
        <meta property="twitter:url" content="https://boilerclasses.com/" />
        <meta name="twitter:title" content="BoilerClasses - Purdue University's Unofficial Course Catalog" />
        <meta name="twitter:description" content="A more user-friendly course catalog for Purdue students with blazing-fast search. From 8000+ classes offered, find more engaging geneds, discover classes more aligned with your interests, and delve into specialized offerings. BoilerClasses is an all-in-one access that provides related links for each course, including RateMyProfessor reviews, in one centralized platform."/>
        <meta name="twitter:image" content="https://opengraph.b-cdn.net/production/documents/a3f504c0-3442-4320-8fc3-f850a5bd1582.png?token=oOcg3vK9F6YcqVmHSegc9vJczzLuo4Oq-yrDM01kKtQ&height=776&width=1200&expires=33246633286" />

      </Head>
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
          <div className="flex flex-row mb-8 gap-5 items-center">
            <p className='text-white whitespace-nowrap md:block hidden'>Filter by </p>
            <div className='flex flex-row w-full justify-evenly gap-5 items-center md:flex-nowrap flex-wrap'>
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
              <Popover placement='bottom-start'>
                <PopoverTrigger>
                  <button className='flex flex-row gap-4 px-4 py-1.5 bg-zinc-900 items-center border text-white rounded-xl border-zinc-900 hover:border-zinc-700' >
                    <span>Credits</span>
                    <ChevronDownIcon color='gray-800' />
                  </button>
                </PopoverTrigger>
                <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-zinc-900 border-gray-800 '>
                  <PopoverBody paddingLeft={8} paddingRight={8} paddingTop={4} paddingBottom={4}>
                    <RangeSlider aria-label={['min', 'max']} defaultValue={[0, 100]}
                      onChangeEnd={(val) => {
                        setCreditsMin(Math.round((val[0]*18/100)))
                        setCreditsMax(Math.round((val[1]*18/100)))
                      }}
                      onChangeStart={(val) => {
                        setCreditsMin(Math.round((val[0]*18/100)))
                        setCreditsMax(Math.round((val[1]*18/100)))
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
                  <Grid templateColumns='repeat(1, 1fr)' gap={3} marginLeft={6} marginRight={6} paddingTop={3} paddingBottom={3}>
                    <Checkbox size='md' isChecked={scheds.includes("Lecture")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Lecture"]) : setScheds(scheds.filter(x => x !== "Lecture"))}>Lecture</Checkbox>
                    <Checkbox size='md' isChecked={scheds.includes("Distance Learning")} textColor='white' onChange={(e) => e.target.checked ? setScheds([...scheds, "Distance Learning"]) : setScheds(scheds.filter(x => x !== "Distance Learning"))}>Distance Learning</Checkbox>
                  </Grid>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {courses.length > 0 || searchTerm.length < 2 ?
          <div className="text-black grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
            {courses.length > 0 && courses.map(course => (
              <Card key={course.id} course={course.value} />
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
              <WarningTwoIcon boxSize={16} color='#DAAA00'/>
              <div className='text-white'>No results found!</div>
          </div>
          }
          <div className='mt-auto'>
            <Footer />
          </div>
        </div>

        :
        /* Landing Page */
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
      }
    </>
  );
};

export default CourseCatalog;


