// CourseCatalog.js

import React, { use, useState, useEffect } from 'react';
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import Card from "../components/card"
import Footer from "../components/footer"
import { ChevronDownIcon } from '@chakra-ui/icons'
import Select from 'react-select';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  Button,
  PopoverFooter,
  FormControl,
  FormLabel,
  FormHelperText,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
} from '@chakra-ui/react'

import { subjectStyles, semesterStyles, subjects, semesterOptions, subjectOptions, genedsOptions } from '@/lib/utils';


const CourseCatalog = () => {

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [selectedGenEds, setSelectedGenEds] = useState([]);
  const [creditsMin, setCreditsMin] = useState(0);
  const [creditsMax, setCreditsMax] = useState(18);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayLanding, setDisplayLanding] = useState(true);

  function changeLanding(event) {
    setDisplayLanding(!displayLanding);
    setSearchTerm(event);
  }

  function addSpaceBetweenCharAndDigit(inputString) {
    const regex = /([a-zA-Z])(\d)/g;

    const resultString = inputString.replace(regex, '$1 $2');

    return resultString;
}


  useEffect(() => {
    search();
  }, [JSON.stringify(selectedSubjects), JSON.stringify(selectedSemesters), JSON.stringify(selectedGenEds), addSpaceBetweenCharAndDigit(searchTerm), creditsMin, creditsMax]);

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
      const params = new URLSearchParams({ q: addSpaceBetweenCharAndDigit(searchTerm.trim()), sub: subParam, term: termParam, gen: genParam, cmin: creditsMin, cmax: creditsMax});

      fetch('http://127.0.0.1:5000/query?' + params)
        .then((response) => response.json())
        .then((data) => {
          console.log(data)
          //TEMPORAY FIX FOR DESCRIPTIONS
          //for every item, console log description
          data.map((item) => {
            //console.log(item.value.description)
            //If description begins with <a href= then set it to No Description Available
            if (item.data.description.startsWith("<a href=")) {
              item.data.description = "No Description Available"
            }
          })
          //END TEMPORARY FIX

          setCourses(data);
        })
    }
  };


  return (
    <>
      {!displayLanding ?
        <div id="parent" className={`flex flex-col h-screen min-h-screen bg-black container mx-auto p-4 ${inter.className}`}>
          <div className='flex flex-row my-2 md:my-4 lg:my-0 lg:mt-4 lg:mb-8'>
            <img src='/favicon.ico' onClick={() => changeLanding("")} className='my-auto w-12 h-12 mr-2 md:w-20 md:h-20 lg:w-24 lg:h-24 cursor-pointer' />
            <h1 onClick={() => changeLanding("")} className='text-2xl md:text-5xl font-semibold my-auto select-none text-white cursor-pointer'>BoilerClasses</h1>
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
              className="text-white text-xl bg-black w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
            />
          </div>
          <div className="flex flex-row mb-8 gap-5 items-center">
            <p className='mr-4 text-white whitespace-nowrap md:block hidden'>Filter by </p>
            <div className='flex flex-row w-full justify-evenly gap-5 items-center md:flex-nowrap flex-wrap'>
              <Select
                isMulti
                options={subjectOptions}
                className="basic-multi-select w-full"
                classNamePrefix="select"
                placeholder="Subject..."
                styles={subjectStyles}
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
                styles={semesterStyles}
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
                styles={semesterStyles}
                color="white"
                onChange={(value) => {
                  setSelectedGenEds(value)
                }}
              />
              <Popover placement='bottom-start'>
                <PopoverTrigger>
                  <button className='flex flex-row gap-4 px-4 py-1.5 bg-black items-center border border-gray-800 text-white rounded-xl hover:bg-black' >
                    <span>Credits</span>
                    <ChevronDownIcon color='gray-800' />
                  </button>
                </PopoverTrigger>
                <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-black border-gray-800 '>
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
            </div>
          </div>

          <div className="text-black grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
            {courses.map(course => (
              <Card key={course.id} course={course.data} />
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
            className="text-white text-sm md:text-xl bg-black w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
          />
        </div >
      }
    </>
  );
};

export default CourseCatalog;


