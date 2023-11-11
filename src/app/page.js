'use client' //

// CourseCatalog.js

import React, { useState } from 'react';
import { Transition } from '@headlessui/react'
import classes from './out.json'

const CourseCatalog = () => {

  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [instructor, setInstructor] = useState([]);
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [credits, setCredits] = useState(0);
  const [term, setTerm] = useState("");


  // Filter courses based on search term
  let filteredCourses = [];
  if (searchTerm != "") {
    filteredCourses = classes.filter(course =>
//      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const openPopUp = (title, scode, ccode, ins, desc, cap, cred, term) => {
    setOpen(!open);
    setTitle(title);
    setSubjectCode(scode);
    setCourseCode(ccode);
    setInstructor(ins);
    setDescription(desc);
    setCapacity(cap);
    setCredits(cred);
    setTerm(term);
  }

  if (open) {
    document.getElementById("parent").classList.add("blur-sm");
  } else {
    try {
      document.getElementById("parent").classList.remove("blur-sm");
    }
    catch (err) {
      //
    }
  }

  return (
    <>
      {/* Popup */}
      <Transition
        show={open}
        enter="transition-opacity duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className={"fixed blur-none top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40"}
      >
        <div
          className="fixed blur-none top-0 left-0 w-full h-full lg:py-28 lg:px-48 py-8 px-4 z-40 transition-opacity"
          id="a"
          aria-hidden="true"
          onClick={() => setOpen(!open)}
        >
          <div className='h-full overflow-auto bg-zinc-900 rounded-lg lg:p-16 p-4'>
            <p className='text-3xl font-bold mb-3 break-words'>{title}</p>
            <p className='text-xl font-medium'>{subjectCode} {courseCode}</p>
            <p className='text-xl font-medium'>Prof. {instructor.join(", ")}</p>
            <p className='my-2 break-words'>{description}</p>
            <p className='mt-5'>{capacity}</p>
            <p className=''>Available {term}</p>
          </div>
        </div>
      </Transition>


      <div id="parent" className="h-screen container mx-auto p-4 ">

        <h1 className="text-2xl md:text-5xl font-bold mb-8">BoilerClasses</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search for courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-white font-semibold text-xl bg-black w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
          />
        </div>

        <div className="text-black grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div key={course.id}
              onClick={() => openPopUp(course.title, course.subjectCode, course.courseCode, course.instructor, course.description, course.capacity, course.credits, course.term)}
              className="flex flex-col bg-slate-200 p-6 rounded-md shadow-md hover:scale-105 transition hover:transition">
              <h2 className="lg:text-2xl md:text-lg font-bold">{course.subjectCode}{course.courseCode} {course.title}</h2>
              <p className="lg:text-lg text-small font-medium mb-2">Instructor: {course.instructor.join(", ")}</p>
              <p className="text-gray-600 mb-4 break-words grow"> {course.description.length > 200
                ? `${course.description.substring(0, 200)}...`
                : course.description}
              </p>
              <a onClick={(e) => e.stopPropagation()} href={`https://www.ratemyprofessors.com/search/professors/783?q=${course.instructor[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className=''>
                <button className='bg-blue-500 text-white rounded-md px-2 py-1 shadow-md hover:-translate-y-1 transition-all bottom-0'>RateMyProfessor</button>
              </a>

            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CourseCatalog;


