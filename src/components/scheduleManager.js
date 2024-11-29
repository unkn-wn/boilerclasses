import React, { useState, useEffect } from 'react';
import {
  Checkbox,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Tooltip
} from '@chakra-ui/react';
import { IoMdInformationCircleOutline, IoIosSwap, IoIosArrowForward, IoMdClose, IoMdDownload } from "react-icons/io";

import { convertTo12HourFormat, translateType } from './calendar';
import { loadRatingsForProfs, getRMPScore } from '@/components/RMP';
import { calculateGradesAndGPA, collectAllProfessors } from '@/components/graph';
import { getColor } from './gpaModal';
import { graphColors } from '@/lib/utils';
import { downloadICS } from '@/lib/ics';

// Add this at the top of the file, outside of any component
const rmpScoresCache = new Map();

/**
 * Normalizes instructor names between RMP and course data
 */
const normalizeInstructorName = (lectureName, courseInstructors) => {
  if (!lectureName) return "";
  const nameParts = lectureName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return Object.values(courseInstructors)
    .flat()
    .find(instructor => {
      const instructorParts = instructor.split(' ');
      return instructorParts[0] === firstName &&
        instructorParts[instructorParts.length - 1] === lastName;
    }) || lectureName;
};

/**
 * Processes raw lecture data into a standardized format
 * @param {Array} courseResults - Raw course data from API
 * @param {Array} courses - Course objects from application state
 * @returns {Array} Processed lecture data
 */
export const processLectureData = (courseResults, courses) => {
  const coursesArray = [];

  courseResults.forEach((courseData, index) => {
    if (!courseData?.Classes?.[0]?.Sections) return;

    // Store the full course object for reference
    const course = courses[index];
    const courseName = `${course.subjectCode} ${course.courseCode}`;

    courseData.Classes.forEach(classData => {
      classData.Sections.forEach(section => {
        section.Meetings.forEach(meeting => {
          const days = meeting.DaysOfWeek.split(',').map(day => day.trim().slice(0, 3));
          const startTime = meeting.StartTime == null ? '00:00' : meeting.StartTime.split('.')[0];
          const [hours, minutes] = startTime.split(':').map(Number);
          const duration = meeting.Duration.replace('PT', '');
          const start = hours * 100 + minutes;
          const end = calculateEndTime(startTime, duration);

          // Normalize instructor names before adding to coursesArray
          const normalizedInstructors = meeting.Instructors.map(i =>
            normalizeInstructorName(i.Name, course.instructor)
          );

          coursesArray.push({
            id: meeting.Id,
            name: courseName,
            classId: classData.Id,
            type: meeting.Type,
            start,
            end,
            day: days.includes("Non") ? ["None"] : days,
            instructors: normalizedInstructors,
            startTime: startTime === '00:00' ? "No Meeting Time" : convertTo12HourFormat(startTime), // if no time, set to No Meeting Time
            room: `${meeting.Room.Building.ShortCode}` === 'TBA' ? 'TBA' : `${meeting.Room.Building.ShortCode} ${meeting.Room.Number}`, // if "TBA", set to TBA
            duration,
            crn: section.Crn,
            courseDetails: course,
            startDate: meeting.StartDate,
            endDate: meeting.EndDate
          });
        });
      });
    });
  });

  return coursesArray;
};

const sortByTime = (a, b) => {
  // Have "No Meeting Time" show last
  if (a === "No Meeting Time") return 1;
  if (b === "No Meeting Time") return -1;

  // Convert times to comparable numbers (assuming 12-hour format)
  const getTimeValue = (time) => {
    const [hour, minute] = time.split(':');
    const isPM = time.includes('PM');
    let hourNum = parseInt(hour);
    if (isPM && hourNum !== 12) hourNum += 12;
    if (!isPM && hourNum === 12) hourNum = 0;
    return hourNum * 60 + parseInt(minute);
  };

  return getTimeValue(a) - getTimeValue(b);
};

/**
 * Groups lectures by time and sorts them
 */
const groupLecturesByTime = (lectures) => {
  const grouped = lectures.reduce((acc, lecture) => {
    const timeKey = lecture.startTime;
    if (!acc[timeKey]) acc[timeKey] = [];
    acc[timeKey].push(lecture);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped)
      .sort(([timeA, _], [timeB, __]) => sortByTime(timeA, timeB))
  );
};

const dayOrder = {
  'Mon': 0,
  'Tue': 1,
  'Wed': 2,
  'Thu': 3,
  'Fri': 4,
  'None': 5
};

const sortByFirstDay = (a, b) => {
  const firstDayA = a.day[0] || 'None';
  const firstDayB = b.day[0] || 'None';
  return dayOrder[firstDayA] - dayOrder[firstDayB];
};

/**
 * Renders a group of related course sections
 */
const CourseGroup = ({ parentCourse, lectures, selectedLectures, onLectureToggle, setSelectedCourse, onCourseRemove }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rmpScores, setRmpScores] = useState(() => rmpScoresCache.get(parentCourse.detailId) || {});
  const [instructorGPAs, setInstructorGPAs] = useState({});

  // Load RMP scores and calculate GPAs when modal opens
  useEffect(() => {
    if (parentCourse?.initialPin) {
      onOpen();
      delete parentCourse.initialPin;

      // Add delay to wait for modal content to render
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
        graphColors
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
              onClick={handleModalOpen}  // Changed from onOpen to handleModalOpen
              className={`${hasSelectedLectures ? 'bg-blue-900' : 'bg-zinc-800'}
            text-white hover:brightness-125 h-full`}
              leftIcon={ hasSelectedLectures ? <IoIosSwap /> : <IoMdInformationCircleOutline />}
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
                                                {instructorGPAs[instructor]?.[0] > 0 &&
                                                  <div className='px-1 rounded font-bold'
                                                    style={{
                                                      backgroundColor: getColor(instructorGPAs[instructor][0]),
                                                    }}>
                                                    {`GPA: ${instructorGPAs[instructor][0].toFixed(2)}`}
                                                  </div>
                                                }
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

// Update ScheduleManager component to handle class-based selection
const ScheduleManager = ({ lectures, selectedLectureIds, onLectureSelectionChange, setSelectedCourse, onCourseRemove }) => {
  const [minCredits, setMinCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(0);

  useEffect(() => {
    const credits = Array.from(selectedLectureIds).reduce((acc, id) => {
      const lecture = lectures.find(lecture => lecture.id === id);
      if (lecture) {
        if (!acc[2].has(lecture.courseDetails.detailId)) {
          acc[0] += lecture.courseDetails.credits[0] || 0;
          acc[1] += lecture.courseDetails.credits[1] || 0;
          acc[2].add(lecture.courseDetails.detailId);
        }
      }
      return acc;
    }, [0, 0, new Set()]);

    setMinCredits(credits[0]);
    setMaxCredits(credits[1]);
  }, [selectedLectureIds, lectures]);

  const handleLectureToggle = (lectureId, classId) => {
    const newSelectedLectures = new Set(selectedLectureIds);
    const clickedLecture = lectures.find(lecture => lecture.id === lectureId);

    // If selecting a new lecture
    if (!selectedLectureIds.has(lectureId)) {
      // Remove other lectures from the same course (but keep other courses)
      lectures
        .filter(lecture => lecture.courseDetails.detailId === clickedLecture.courseDetails.detailId)
        .forEach(lecture => {
          newSelectedLectures.delete(lecture.id);
        });

      // Add the selected lecture and any other lectures from its class
      lectures
        .filter(lecture => lecture.classId === classId)
        .forEach(lecture => {
          if (selectedLectureIds.has(lecture.id) || lecture.id === lectureId) {
            newSelectedLectures.add(lecture.id);
          }
        });
    } else {
      // If deselecting, just remove this specific lecture
      newSelectedLectures.delete(lectureId);
    }

    onLectureSelectionChange([...newSelectedLectures]);
  };

  // Group lectures by course name - Update this grouping to use detailId
  const courseGroups = lectures.reduce((acc, lecture) => {
    const key = lecture.courseDetails.detailId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lecture);
    return acc;
  }, {});

  const selectedLectures = lectures.filter(lecture => selectedLectureIds.has(lecture.id));

  return (
    <div className="flex flex-col space-y-2 py-4 pl-4">
      <div className='flex flex-row justify-between mb-4'>
        <div className='flex md:flex-row flex-col gap-2'>
          <h2 className="text-lg font-semibold text-white">Course Sections</h2>
          {selectedLectures.length > 0 && (
            <Tooltip
              label={`Export schedule to .ics format`}
              aria-label="Download Schedule"
              hasArrow
              placement="bottom"
              background="#27272a"
            >
              <div
                className="flex rounded-full gap-1 items-center justify-center pl-2 pr-[0.6rem] font-light text-xs text-zinc-400 cursor-pointer transition bg-zinc-800 hover:brightness-125 duration-300"
                onClick={() => downloadICS(selectedLectures)}>
                <IoMdDownload />
                <p>Export Schedule</p>
              </div>
            </Tooltip>
          )}
        </div>
        <h2 className="text-xs text-zinc-400 self-end">
          Total Credits: {minCredits === maxCredits ? minCredits : `${minCredits} - ${maxCredits}`}
        </h2>
      </div>
      {courseGroups && Object.keys(courseGroups).length !== 0 ? Object.entries(courseGroups).map(([detailId, courseLectures]) => (
        <CourseGroup
          key={detailId}
          parentCourse={courseLectures[0].courseDetails}
          lectures={courseLectures}
          selectedLectures={selectedLectureIds}
          onLectureToggle={handleLectureToggle}
          setSelectedCourse={setSelectedCourse}
          onCourseRemove={onCourseRemove}
        />
      )) : (
        <p className="text-gray-500 text-sm">Search for a course by using the search bar, then add a course to show up here!</p>
      )}
    </div>
  );
};


export const calculateEndTime = (startTime, duration) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const durationHours = duration.includes('H') ? parseInt(duration.split('H')[0]) : 0;
  const durationMinutes = duration.includes('M') ?
    parseInt(duration.split('H')[1]?.replace('M', '') || duration.replace('M', '')) : 0;

  let totalMinutes = hours * 60 + minutes + (durationHours * 60) + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  return endHours * 100 + endMinutes;
};

export default ScheduleManager;