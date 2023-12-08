import { semesters } from "../lib/utils"
import React, { useState } from 'react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Image
} from '@chakra-ui/react'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Card = ({ course }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  // const [curInstructors, setCurInstructors] = useState([]);
  // const [curGPA, setCurGPA] = useState([]);
  const [sem, setSem] = useState(course.terms[0]);

  const instructors = new Set();
  const availableSemesters = [];
  const boilerExamsCourses = ["MA15800", "MA16010", "MA16100", "MA16200", "MA26100", "MA26200", "MA26500", "MA26600", "MA30300", "CS15900", "CS17700", "CHM11500", "ECON25200", "PHYS17200"];

  const labels = ['A', 'A+', 'A-', 'B', 'B+', 'B-', 'C', 'C+', 'C-', 'D', 'D+', 'D-', 'F', 'AVG'];

  const perc2color = function (perc) {
    var r, g, b = 0;
    if (perc < 50) {
      r = 255;
      g = Math.round(5.1 * perc);
    }
    else {
      g = 255;
      r = Math.round(510 - 5.10 * perc);
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
  }


  semesters.forEach((sem) => {
    try {
      course.instructor[sem].forEach((prof) => instructors.add(prof));
      if (course.terms.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch { }
  });
  const uniqueInstructors = [...instructors];

  const changeInstructors = (sem) => {
    let gpa = [];

    for (const semester in course.gpa) {
      for (const entry of course.gpa[semester]) {
        const instructor = entry[0];
        const data = entry[1].slice(0, -1).map(Number);

        const existingIndex = gpa.findIndex(item => item.label === instructor);

        if (existingIndex !== -1) {
          // Label already exists, update existing data and count
          let existingData = gpa[existingIndex].data;
          let count = gpa[existingIndex].count;

          for (let k = 0; k < existingData.length; k++) {
            existingData[k] = ((existingData[k] * count + data[k]) / (count + 1)).toFixed(2);
          }

          // Increment the count
          gpa[existingIndex].count++;
        } else {
          // Label not found, add new entry with count 1
          const formattedData = data.map(value => {
            const roundedValue = value.toFixed(4);
            return parseFloat(roundedValue) === value ? value.toFixed(0) : roundedValue;
          });

          gpa.push({ 'label': instructor, 'data': formattedData, 'count': 1 });
        }
      }
    }

    console.log(gpa);


    // setCurGPA((sem in course.gpa) ? course.gpa[sem] : []);
    // console.log(curGPA);
    // setCurInstructors(course.instructor[sem]);
    setSem(sem);
    availableSemesters.forEach((otherSem) => {
      if (otherSem !== sem) {
        try {
          document.getElementById(otherSem).classList.add("bg-sky-300");
        } catch { }
      }
    });

    try {
      document.getElementById(sem).classList.remove("bg-sky-300");
    } catch { }
  }

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
  console.log(perc2color((3.20 * 100 / 4.0)))
  console.log(perc2color((2.3 * 100 / 4.0)))

  return (
    <>
      <div className="flex flex-col bg-slate-200 p-6 rounded-md shadow-md hover:scale-105 transition hover:transition cursor-pointer"
        onClick={onOpen}
        onClickCapture={() => changeInstructors(availableSemesters[0])}>
        <h2 className="lg:text-lg md:text-lg font-bold">{course.subjectCode} {course.courseCode}: {course.title}</h2>
        <p className="lg:text-sm text-sm text-gray-700 font-medium my-1">
          {/* <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${uniqueInstructors[0].split(" ")[0]} ${uniqueInstructors[0].split(" ")[uniqueInstructors[0].split(" ").length - 1]}`}
            target="_blank" rel="noopener noreferrer"
            className='underline decoration-dotted'>
            {uniqueInstructors[0]}
          </a> */}
          {uniqueInstructors[0]}
          {uniqueInstructors.length > 1 && ", "}
          {uniqueInstructors.length > 1 &&
            // <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${uniqueInstructors[1].split(" ")[0]} ${uniqueInstructors[1].split(" ")[uniqueInstructors[1].split(" ").length - 1]}`}
            //   target="_blank" rel="noopener noreferrer"
            //   className='underline decoration-dotted '>
            //   {uniqueInstructors[1]}
            // </a>
            uniqueInstructors[1]
          }

        </p>
        <p className="text-sm text-gray-600 mb-4 break-words grow">
          <span>{course.description.length > 300
            ? `${course.description.substring(0, 300)}...`
            : course.description}
          </span>
        </p>
        <div className="flex flex-row flex-wrap">
          {availableSemesters.map((sem, i) => (
            (i < 3) && <span className="text-sm px-2 py-1 mx-1 my-1 rounded-full border-solid border border-sky-500 bg-sky-300 whitespace-nowrap" key={i}>{sem}</span>
          ))}
        </div>
      </div>

      <Modal onClose={onClose} isOpen={isOpen} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent minH="" maxH="90%" maxW="90%">
          <ModalHeader>
            <h2 className="lg:text-3xl md:text-3xl font-bold">{course.subjectCode} {course.courseCode}: {course.title}</h2>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div className="flex flex-col gap-4 -mt-3 mb-2">
              {/* Credits Display */}
              <p className="text-sm text-gray-700 font-bold">
                {course.credits[0] === course.credits[1]
                  ? `${course.credits[0]} Credits`
                  : `${course.credits[0]} - ${course.credits[1]} Credits`}
              </p>
              {/* <p>{course.gpa[""]}</p> */}

              {/* Instructors Display */}
              <p className="lg:text-sm text-sm text-blue-600 -mt-3 font-medium">
                <span className="text-black font-normal text-xs">RateMyProfessor: </span>
                {course.instructor[sem].map((prof, i) => (
                  <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${prof.split(" ")[0]} ${prof.split(" ")[prof.split(" ").length - 1]}`}
                    target="_blank" rel="noopener noreferrer"
                    className='underline decoration-dotted'
                    key={i}>
                    {prof}
                    {i < course.instructor[sem].length - 1 && ", "}
                  </a>
                )
                )}
              </p>

            </div>
            {/* ${perc2color((prof[1]*100)/4.0)} */}

            <p className="text-md text-gray-800 mb-4 break-words grow">{course.description}</p>
            {/* {(sem in course.gpa) &&
              <p className="lg:text-sm text-sm mb-2 text-gray-800">
                <span className="text-black font-normal text-xs mb-2">BoilerGrades Average GPAs: </span>
                {course.gpa[sem].map((prof, i) => (
                  <p>
                    {prof[0]}: {prof[1]}
                  </p>
                ))}
              </p>
            } */}

            {/* Other Links Buttons */}
            <div className="flex flex-row flex-wrap">
              <a href={`https://www.reddit.com/r/Purdue/search/?q=${course.subjectCode}${course.courseCode.toString().replace(/00$/, '')} OR "${course.subjectCode} ${course.courseCode.toString().replace(/00$/, '')}" ${getSearchableProfString()}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-white px-5 py-2 mx-1 my-3 rounded-md whitespace-nowrap bg-orange-600 hover:bg-orange-800 transition-all">
                <div className="flex flex-row gap-2">
                  <Image src="https://static-00.iconduck.com/assets.00/reddit-icon-512x450-etuh24un.png" alt="" boxSize={4} className="my-auto" />
                  Reddit
                </div>
              </a>
              {boilerExamsCourses.includes(`${course.subjectCode}${course.courseCode}`) &&
                <a href={`https://www.boilerexams.com/courses/${course.subjectCode}${course.courseCode.toString()}/topics`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-white px-5 py-2 mx-1 my-3 rounded-md whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 transition-all">
                  <div className="flex flex-row gap-2">
                    <Image src="/boilerexams-icon.png" alt="" boxSize={4} className="my-auto filter" />
                    Boilerexams
                  </div>
                </a>
              }
            </div>

            {/* Semester Tags */}
            <div className="flex flex-row flex-wrap">
              {availableSemesters.map((sem, i) => (
                <button className={`text-sm px-2 py-1 mx-1 my-1 rounded-full border-solid border
                                    ${i === 0 ? "" : "bg-sky-300 "} border-sky-500 whitespace-nowrap transition-all`}
                  key={i}
                  id={sem}
                  onClick={() => changeInstructors(sem)}>{sem}</button>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
};

export default Card;
