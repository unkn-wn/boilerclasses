import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stack,
  Checkbox,
} from '@chakra-ui/react';
import { IoMdInformationCircleOutline, IoIosSwap, IoIosArrowForward, IoMdClose } from "react-icons/io";
import { loadRatingsForProfs, getRMPScore } from '@/components/RMP';
import { calculateGradesAndGPA, collectAllProfessors, getColor } from '@/lib/gpaUtils';
import { translateType } from '../calendar';
import { sortByTime, sortByFirstDay } from './utils/sortUtils';
import { getCourseColorIndex } from './schedule';
import { graphColors } from '@/lib/utils';

// Cache for RMP ratings
const rmpScoresCache = new Map();

const CourseGroup = ({ parentCourse, lectures, selectedLectures, onLectureToggle, setSelectedCourse, onCourseRemove, courseColorMap }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rmpScores, setRmpScores] = useState(() => rmpScoresCache.get(parentCourse.detailId) || {});
  const [instructorGPAs, setInstructorGPAs] = useState({});
  const colorIndex = getCourseColorIndex(parentCourse.detailId, courseColorMap);
  const courseColor = graphColors[colorIndex % graphColors.length];

  // Load RMP scores and calculate GPAs when modal opens
  useEffect(() => {
    if (parentCourse?.initialPin) {
      onOpen();
      delete parentCourse.initialPin;

      // SCROLL TO MEETING CHECKBOX on modal open
      if (parentCourse?.scrollToMeeting) {
        const meetingId = parentCourse.scrollToMeeting;
        // Use a MutationObserver to wait for the element to exist
        const observer = new MutationObserver((mutations, obs) => {
          const meetingCheckbox = document.getElementById(meetingId);
          if (meetingCheckbox) {
            setTimeout(() => {
              meetingCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100); // Small additional delay for modal animation
            obs.disconnect(); // Stop observing once found
          }
        });

        // Start observing the modal body for changes
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Cleanup observer after 2 seconds if element is never found
        setTimeout(() => observer.disconnect(), 2000);
      }
    }

    if (isOpen) {
      // Only load RMP scores if they're not in the cache
      if (!rmpScoresCache.has(parentCourse.detailId)) {
        loadRatingsForProfs(parentCourse, (updatedScores) => {
          setRmpScores(updatedScores);
          rmpScoresCache.set(parentCourse.detailId, updatedScores);
        });
      }

      // Calculate GPAs using graph.js function
      const allInstructors = collectAllProfessors(parentCourse.instructor);

      const { gpa } = calculateGradesAndGPA(
        Array.from(allInstructors),
        parentCourse.gpa,
      );

      setInstructorGPAs(gpa);
    }
  }, [isOpen, parentCourse]);

  const selectedCourseLectures = lectures.filter(lecture => selectedLectures.has(lecture.id));
  const hasSelectedLectures = selectedCourseLectures.length > 0;

  const reselectCourseDetails = () => {
    document.getElementById('right_side').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const detailsDiv = document.getElementById('course_details');
    if (detailsDiv) {
      detailsDiv.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }

    const courseDetails = [...lectures][0].courseDetails;

    // Create a new object with all the properties to trigger React's change detection
    const newCourseDetails = {
      ...courseDetails,
      tmp_inc: Date.now(), // Use Date.now() for a unique value each time
    };

    setSelectedCourse(newCourseDetails);
  };

  // Modified section to process and sort class sections
  const classSections = lectures.reduce((acc, lecture) => {
    if (!acc[lecture.classId]) {
      acc[lecture.classId] = {};
    }
    const typeKey = lecture.type;
    if (!acc[lecture.classId][typeKey]) {
      acc[lecture.classId][typeKey] = {};
    }
    const timeKey = lecture.startTime;
    if (!acc[lecture.classId][typeKey][timeKey]) {
      acc[lecture.classId][typeKey][timeKey] = [];
    }
    acc[lecture.classId][typeKey][timeKey].push(lecture);
    return acc;
  }, {});

  // Sort class sections by type (Lecture first) and then by time
  const sortedClassSections = Object.entries(classSections)
    .sort(([, typesA], [, typesB]) => {
      const getEarliestTimeForType = (types, targetType) => {
        if (!types[targetType]) return "99:99"; // Return late time if type doesn't exist
        return Object.keys(types[targetType]).sort((a, b) => sortByTime(a, b))[0];
      };

      // Check for Lecture type first
      const hasLectureA = typesA["Lecture"];
      const hasLectureB = typesB["Lecture"];
      if (hasLectureA && !hasLectureB) return -1;
      if (!hasLectureA && hasLectureB) return 1;

      // If both have lectures or both don't, sort by earliest time
      const earliestTimeA = Object.keys(typesA).reduce((earliest, type) => {
        const typeEarliest = getEarliestTimeForType(typesA, type);
        return sortByTime(earliest, typeEarliest) < 0 ? earliest : typeEarliest;
      }, "99:99");

      const earliestTimeB = Object.keys(typesB).reduce((earliest, type) => {
        const typeEarliest = getEarliestTimeForType(typesB, type);
        return sortByTime(earliest, typeEarliest) < 0 ? earliest : typeEarliest;
      }, "99:99");

      return sortByTime(earliestTimeA, earliestTimeB);
    });

  // Add scroll handler when opening modal
  const handleModalOpen = () => {
    window.scrollTo({ top: 0 });
    onOpen();
  };

  // Add this new function to handle course removal
  const handleRemoveCourse = () => {
    const courseDetailId = parentCourse.detailId;
    // Remove all lectures associated with this course
    lectures.forEach(lecture => {
      if (selectedLectures.has(lecture.id)) {
        onLectureToggle(lecture.id, lecture.classId);
      }
    });
    // Remove the course from pinned courses
    onCourseRemove(parentCourse.detailId);
  };

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">

      <div className="flex-grow bg-zinc-900 p-2">
        <div className="flex flex-col sm:flex-row gap-2 mb-2 justify-between">
          <div className='flex flex-row'>
            <div className="self-center w-6 h-6 aspect-square rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer"
              onClick={handleRemoveCourse}>
              <IoMdClose className="text-zinc-400 text-sm" />
            </div>
            <div className="flex flex-col font-semibold text-white text-xl self-start mx-2 break-words overflow-hidden">
              {parentCourse.subjectCode} {parentCourse.courseCode}
              <p className='text-sm'>{parentCourse.title}</p>
            </div>
          </div>
          <div className='flex flex-col xl:flex-row gap-2 justify-center sm:justify-end'>
            <Button
              variant=""
              size="sm"
              onClick={handleModalOpen}
              style={{
                backgroundColor: hasSelectedLectures ? courseColor + "50" : 'rgb(39 39 42)',
                borderColor: hasSelectedLectures ? courseColor : 'rgb(39 39 42)',
              }}
              className="text-white hover:brightness-125 h-full border"
              leftIcon={hasSelectedLectures ? <IoIosSwap /> : <IoMdInformationCircleOutline />}
            ><p>{hasSelectedLectures ? 'Change Sections' : 'Pick Sections'}</p></Button>
            <Button
              variant=""
              size="sm"
              onClick={reselectCourseDetails}
              className="bg-zinc-800 text-white hover:brightness-125"
              rightIcon={<IoIosArrowForward />}
            ><p>Show Course</p></Button>
          </div>
        </div>
        {hasSelectedLectures ? (
          <div className="flex flex-col gap-2">
            {selectedCourseLectures.map(lecture => (
              <div
                key={lecture.id}
                className="flex justify-between items-center p-2 rounded-md bg-zinc-800"
              >
                <div className="text-sm text-white flex-1">
                  <div>{`${lecture.type} ${lecture.instructors.length === 0 ? '' : '-'} ${lecture.instructors.join(", ")}`}</div>
                  <div className="text-xs text-gray-400">
                    {`${lecture.day.join(', ')} • ${lecture.startTime} • ${lecture.room}`}
                  </div>
                </div>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => onLectureToggle(lecture.id, lecture.classId)}
                  _hover={{ bg: "blackAlpha.500" }}
                  className="shrink-0"
                >
                  Remove Section
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400 mx-2">No sections selected</div>
        )}
      </div>

      {/* Modal content remains the same */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay bg={'blackAlpha.400'} />
        <ModalContent containerProps={{ justifyContent: 'flex-end' }} marginEnd={[undefined, undefined, '1rem', '1rem', '4rem']}>
          <ModalHeader className='bg-zinc-900 text-white'>{parentCourse.subjectCode}{parentCourse.courseCode}: {parentCourse.title}</ModalHeader>
          <ModalCloseButton className='text-white' />
          <ModalBody pb={6} className='bg-zinc-900 text-white'>
            <Stack spacing={4}>
              {sortedClassSections.map(([classId, typeGroups], sectionIndex) => (
                <div key={classId} className="border-b border-zinc-700 pb=2 mb-2">
                  <div className="text-sm font-bold mb-2 text-blue-400">Class Section {sectionIndex + 1}</div>
                  {Object.entries(typeGroups)
                    .sort(([typeA], [typeB]) => {
                      // Sort by type, with Lecture always first
                      if (typeA === "Lecture") return -1;
                      if (typeB === "Lecture") return 1;
                      return typeA.localeCompare(typeB);
                    })
                    .map(([typeKey, timeGroups]) => (
                      <div key={typeKey} className="mb-4">
                        <div className="text-sm font-semibold mb-2 text-gray-400">{typeKey}</div>
                        {Object.entries(timeGroups)
                          .sort(([timeA], [timeB]) => sortByTime(timeA, timeB))
                          .map(([timeKey, lectures]) => (
                            <div key={timeKey} className="mb-2">
                              <div className="text-sm font-semibold mb-2">{timeKey}</div>
                              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                {lectures
                                  .sort(sortByFirstDay)
                                  .map((lecture) => (
                                    <div className='flex-grow flex-1 min-w-[100px]' key={lecture.id}>
                                      <Checkbox
                                        id={lecture.id} // Add this line to identify the checkbox
                                        isChecked={selectedLectures.has(lecture.id)}
                                        onChange={() => onLectureToggle(lecture.id, lecture.classId)}
                                        colorScheme="blue"
                                        sx={{
                                          '[data-checked] > span:first-of-type': {
                                            background: `${courseColor} !important`,
                                            borderColor: `${courseColor} !important`
                                          }
                                        }}
                                      >
                                        <span className="text-sm">
                                          <div className="font-medium text-white">
                                            {lecture.day.join(', ')}
                                          </div>
                                          <div className="text-xs text-zinc-300">

                                            {/* Instructor mapping, includes gpa and rmp per prof */}
                                            {lecture.instructors.map(instructor => (
                                              <div key={instructor} className='flex flex-row flex-wrap gap-1'>
                                                {instructor}
                                                {instructorGPAs[instructor]?.[0] > 0 && (
                                                  <div className='px-1 rounded font-bold relative overflow-hidden'
                                                    style={{
                                                      backgroundColor: getColor(instructorGPAs[instructor][0]),
                                                    }}>
                                                    {/* Dark gradient backdrop */}
                                                    <div className='absolute inset-0 bg-gradient-to-l from-black/30 to-transparent pointer-events-none' />
                                                    {/* Text on top */}
                                                    <span className='relative z-10 text-white'>
                                                      {`GPA: ${instructorGPAs[instructor][0].toFixed(2)}`}
                                                    </span>
                                                  </div>
                                                )}
                                                {getRMPScore(rmpScores, instructor) &&
                                                  <div className='px-1 rounded font-bold bg-zinc-600'>
                                                    {`RateMyProf: ${getRMPScore(rmpScores, instructor)}`}
                                                  </div>
                                                }
                                              </div>
                                            ))}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {translateType(lecture.type)} - {lecture.room}
                                          </div>
                                        </span>
                                      </Checkbox>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                </div>
              ))}
            </Stack>
          </ModalBody>
        </ModalContent>
        {/* Add fixed bottom button for mobile */}
        <div className="block md:hidden fixed z-[9999] bottom-0 left-0 right-0 m-4">
          <Button
            variant=""
            size="md"
            onClick={onClose}
            className='w-full bg-blue-900 text-white hover:brightness-125 shadow-md shadow-black'
          >
            Save and Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CourseGroup;