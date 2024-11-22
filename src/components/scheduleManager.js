import React, { useState } from 'react';
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
  Button
} from '@chakra-ui/react';
import { IoMdOpen, IoIosArrowForward } from "react-icons/io";

import { convertTo12HourFormat, translateType } from './calendar';

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

          coursesArray.push({
            id: meeting.Id,
            name: courseName,
            classId: classData.Id,  // Add classId
            type: meeting.Type,
            start,
            end,
            day: days.includes("Non") ? ["None"] : days, // if no days, set to None
            instructors: meeting.Instructors.map(i => i.Name),
            startTime: startTime === '00:00' ? "No Meeting Time" : convertTo12HourFormat(startTime), // if no time, set to No Meeting Time
            room: `${meeting.Room.Building.ShortCode}` === 'TBA' ? 'TBA' : `${meeting.Room.Building.ShortCode} ${meeting.Room.Number}`, // if "TBA", set to TBA
            duration,
            crn: section.Crn,
            courseDetails: course, // Add the full course object
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

const groupLecturesByTime = (lectures) => {
  const grouped = lectures.reduce((acc, lecture) => {
    const timeKey = lecture.startTime;
    if (!acc[timeKey]) {
      acc[timeKey] = [];
    }
    acc[timeKey].push(lecture);
    return acc;
  }, {});

  // Convert to array, sort by time only, and convert back to object
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

const CourseGroup = ({ parentCourse, lectures, selectedLectures, onLectureToggle, setSelectedCourse }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const selectedCourseLectures = lectures.filter(lecture => selectedLectures.has(lecture.id));
  const hasSelectedLectures = selectedCourseLectures.length > 0;

  const reselectCourseDetails = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">

      <div className="flex-grow bg-zinc-900 p-2">
        <div className="flex flex-row gap-2 mb-2 justify-between">
          <div className="flex flex-col font-semibold text-white text-xl self-center mx-2 break-words overflow-hidden">
            {parentCourse.subjectCode} {parentCourse.courseCode}
            <p className='text-sm'>{parentCourse.title}</p>
          </div>
          <div className='flex flex-row gap-2'>
            <Button
              variant=""
              onClick={handleModalOpen}  // Changed from onOpen to handleModalOpen
              className={`${hasSelectedLectures ? 'bg-blue-900' : 'bg-zinc-800'}
            text-white hover:brightness-125 h-full`}
              leftIcon={<IoMdOpen />}
            >View Sections</Button>
            <Button
              variant=""
              onClick={reselectCourseDetails}
              className="bg-zinc-800 text-white hover:brightness-125"
              rightIcon={<IoIosArrowForward />}
            >Show Course</Button>
          </div>
        </div>
        {hasSelectedLectures ? (
          <div className="flex flex-col gap-2">
            {selectedCourseLectures.map(lecture => (
              <div
                key={lecture.id}
                className="flex justify-between items-center p-2 rounded-md bg-zinc-800"
              >
                <div className="text-sm text-white">
                  <div>{`${lecture.type} ${lecture.instructors.length === 0 ? '' : '-'} ${lecture.instructors}`}</div>
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
                >
                  Remove
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
        <ModalContent containerProps={{ justifyContent: 'flex-end', paddingRight: '4rem' }}>
          <ModalHeader className='bg-zinc-900 text-white'>{parentCourse.subjectCode}{parentCourse.courseCode}: {parentCourse.title}</ModalHeader>
          <ModalCloseButton className='text-white' />
          <ModalBody pb={6} className='bg-zinc-900 text-white'>
            <Stack spacing={4}>
              {sortedClassSections.map(([classId, typeGroups], sectionIndex) => (
                <div key={classId} className="border-b border-zinc-700 pb-2 mb-2">
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
                              <div className="flex flex-row flex-wrap gap-4">
                                {lectures
                                  .sort(sortByFirstDay)
                                  .map((lecture) => (
                                  <div className='flex-grow flex-1' key={lecture.id}>
                                    <Checkbox
                                      isChecked={selectedLectures.has(lecture.id)}
                                      onChange={() => onLectureToggle(lecture.id, lecture.classId)}
                                      colorScheme="blue"
                                    >
                                      <span className="text-sm">
                                        <div className="font-medium text-white">
                                          {lecture.day.join(', ')}
                                        </div>
                                        <div className="text-xs text-zinc-300">
                                          {lecture.instructors.length > 0
                                            ? lecture.instructors.join(', ')
                                            : 'Instructors Not Listed'
                                          }
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
      </Modal>
    </div>
  );
};

// Update ScheduleManager component to handle class-based selection
const ScheduleManager = ({ lectures, selectedLectureIds, onLectureSelectionChange, setSelectedCourse }) => {
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

  return (
    <div className="space-y-2 py-4 pl-4">
      <h2 className="text-lg font-semibold text-white mb-4">Course Sections</h2>
      {courseGroups && Object.keys(courseGroups).length !== 0 ? Object.entries(courseGroups).map(([detailId, courseLectures]) => (
        <CourseGroup
          key={detailId}
          parentCourse={courseLectures[0].courseDetails}
          lectures={courseLectures}
          selectedLectures={selectedLectureIds}
          onLectureToggle={handleLectureToggle}
          setSelectedCourse={setSelectedCourse}
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