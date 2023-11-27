import { semesters } from "../lib/utils"

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button
} from '@chakra-ui/react'

const Card = ({ course }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const instructors = new Set();
  const availableSemesters = [];

  semesters.forEach((sem) => {
    try {
      course.instructor[sem].forEach((prof) => instructors.add(prof));
      if (course.terms.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch { }
  });
  const uniqueInstructors = [...instructors];

  return (
    <>
      <div className="flex flex-col bg-slate-200 p-6 rounded-md shadow-md hover:scale-105 transition hover:transition cursor-pointer"
        onClick={onOpen}>
        <h2 className="lg:text-lg md:text-lg font-bold">{course.subjectCode} {course.courseCode}: {course.title}</h2>
        <p className="lg:text-sm text-sm text-gray-700 font-medium my-1">
          <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${uniqueInstructors[0].split(" ")[0]} ${uniqueInstructors[0].split(" ")[uniqueInstructors[0].split(" ").length - 1]}`}
            target="_blank" rel="noopener noreferrer"
            className='underline decoration-dotted'>
            {uniqueInstructors[0]}
          </a>
          {uniqueInstructors.length > 1 && ", "}
          {uniqueInstructors.length > 1 &&
            <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${uniqueInstructors[1].split(" ")[0]} ${uniqueInstructors[1].split(" ")[uniqueInstructors[1].split(" ").length - 1]}`}
              target="_blank" rel="noopener noreferrer"
              className='underline decoration-dotted '>
              {uniqueInstructors[1]}
            </a>
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
        <ModalContent minH="75%" maxH="90%" maxW="90%">
          <ModalHeader>
            <h2 className="lg:text-3xl md:text-3xl font-bold">{course.subjectCode} {course.courseCode}: {course.title}</h2>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p className="lg:text-sm text-sm text-gray-700 font-medium -mt-3 mb-2">
              <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${uniqueInstructors[0].split(" ")[0]} ${uniqueInstructors[0].split(" ")[uniqueInstructors[0].split(" ").length - 1]}`}
                target="_blank" rel="noopener noreferrer"
                className='underline decoration-dotted'>
                {uniqueInstructors[0]}
              </a>
              {uniqueInstructors.length > 1 && ", "}
              {uniqueInstructors.length > 1 &&
                <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${uniqueInstructors[1].split(" ")[0]} ${uniqueInstructors[1].split(" ")[uniqueInstructors[1].split(" ").length - 1]}`}
                  target="_blank" rel="noopener noreferrer"
                  className='underline decoration-dotted '>
                  {uniqueInstructors[1]}
                </a>
              }
            </p>
            <p className="text-md text-gray-800 mb-4 break-words grow">{course.description}</p>

            <div className="flex flex-row flex-wrap">
              {availableSemesters.map((sem, i) => (
                (i < 3) && <span className="text-sm px-2 py-1 mx-1 my-1 rounded-full border-solid border border-sky-500 bg-sky-300 whitespace-nowrap" key={i}>{sem}</span>
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