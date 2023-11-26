// CourseCatalog.js

import React, { useState } from 'react';
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import Card from "../components/card"
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
  FormHelperText
} from '@chakra-ui/react'

import { subjects, subjectOptions } from '@/lib/utils';


const colourStyles = {
  control: (base, state) => ({
    ...base,
    background: "#000000",
    borderColor: '#1f2937',
    paddingLeft: "4px",
    color: 'white',
    ':hover': {
      borderColor: '#1f2937'
    },
    ':focus': {
      outline: "none"
    }
  }),
  menuList: styles => ({
      ...styles,
      borderColor: '#1f2937',
      background: '#000000'
  }),
  option: (styles, { isDisabled, isFocused, isSelected }) => {
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? "#9333ea"
        : isFocused
        ? "#d8b4fe"
        : undefined,
      color: isDisabled
        ? '#ccc'
        : isFocused
        ? "#9333ea"
        : "white",
      cursor: isDisabled ? 'not-allowed' : 'default',

      ':active': {
        ...styles[':active'],
        backgroundColor: !isDisabled
          ? isSelected
            ? "#9333ea"
            : "#d8b4fe"
          : undefined,
      }
  }},
  menu: base => ({
      ...base,
      zIndex: 100,
      color: 'white'
  }),
  multiValue: (styles, { data }) => {
    return {
      ...styles,
      backgroundColor: "#d8b4fe",
    };
  },
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: "#9333ea",
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: "#9333ea",
    ':hover': {
      backgroundColor: "#9333ea",
      color: 'white',
    },
  }),

  }
  

const CourseCatalog = () => {

  const [courses, setCourses] = useState([]);
  
  
  const search = async (event) => {
    const q = event.target.value;
    if (q.length <= 1) {
      setCourses([]);
    } else {
      const params = new URLSearchParams({ q });
      fetch('/api/search?' + params)
        .then((response) => response.json())
        .then((data) => {
          setCourses(data['courses']['documents']);
        })
    }
  };


  return (
    <>
      <div id="parent" className={`h-screen bg-black container mx-auto p-4 ${inter.className}`}>
          <h1 className='text-2xl md:text-5xl font-semibold mt-4 mb-8 select-none text-white'>BoilerClasses</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for courses..."
            onChange={search}
            className="text-white text-xl bg-black w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
          />
        </div>
        <div className="flex flex-row mb-8 gap-5 items-center">
          <p className='mr-4 text-white'>Filter by </p>
          {/* <Popover placement='bottom-start'>
            <PopoverTrigger>
              <button className='flex flex-row gap-4 px-4 py-2 bg-black items-center border border-gray-800 text-white rounded-xl font-semibold hover:bg-black' >
                <span>Subject</span>
                <ChevronDownIcon color='gray-800'/>
              </button>
            </PopoverTrigger>
            <PopoverContent backgroundColor='black' borderColor='gray.800' className='bg-black border-gray-800 '> */}
              <Select
                isMulti
                options={subjectOptions}
                className="basic-multi-select w-1/2"
                classNamePrefix="select"
                placeholder="Subject..."
                styles={colourStyles}
              />

              {/* </PopoverBody> */}
              {/* <PopoverFooter borderColor='gray.800' className='flex flex-row justify-between'>
                <Button backgroundColor='black' textColor='white' _hover={{bg: "black"}} className='rounded-md text-white hover:bg-black' size='sm'>
                  Cancel
                </Button>  
                <Button colorScheme='blue' size='sm'>
                  Save
                </Button>  
              </PopoverFooter> */}
            {/* </PopoverContent>
          </Popover> */}
        </div>

        <div className="text-black grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
          {courses.map(course => (
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
      </div>
    </>
  );
};

export default CourseCatalog;


