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

import { convertTo12HourFormat } from './calendar';

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
            day: days,
            instructors: meeting.Instructors.map(i => i.Name),
            startTime: convertTo12HourFormat(startTime),
            room: `${meeting.Room.Building.ShortCode} ${meeting.Room.Number}`,
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

const CourseGroup = ({ courseName, lectures, selectedLectures, onLectureToggle, setSelectedCourse }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const selectedCourseLectures = lectures.filter(lecture => selectedLectures.has(lecture.id));
  const hasSelectedLectures = selectedCourseLectures.length > 0;

  const reselectCourseDetails = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let courseDetails = lectures[0]?.courseDetails;
    if (courseDetails.tmp_inc) {
      courseDetails.tmp_inc++;
    } else {
      courseDetails.tmp_inc = 1;
    }
    console.log(courseDetails);
    setSelectedCourse(lectures[0]?.courseDetails);
  };

  // Add this section to process class sections before modal rendering
  const classSections = lectures.reduce((acc, lecture) => {
    if (!acc[lecture.classId]) {
      acc[lecture.classId] = {};
    }
    const timeKey = lecture.startTime;
    if (!acc[lecture.classId][timeKey]) {
      acc[lecture.classId][timeKey] = [];
    }
    acc[lecture.classId][timeKey].push(lecture);
    return acc;
  }, {});

  // Sort class sections by their earliest time
  const sortedClassSections = Object.entries(classSections)
    .sort(([, timesA], [, timesB]) => {
      const firstTimeA = Object.keys(timesA).sort((a, b) => sortByTime(a, b))[0];
      const firstTimeB = Object.keys(timesB).sort((a, b) => sortByTime(a, b))[0];
      return sortByTime(firstTimeA, firstTimeB);
    });

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">

      <div className="flex-grow bg-zinc-900 p-2">
        <div className="flex flex-row gap-2 mb-2">
          <div className="font-semibold text-white text-xl self-center mx-2">{courseName}</div>
          <Button
            variant=""
            onClick={onOpen}
            className={`${hasSelectedLectures ? 'bg-blue-900' : 'bg-zinc-800'}
            text-white hover:brightness-125 h-full`}
            leftIcon={<IoMdOpen />}
          >View Sections</Button>
          <Button
            variant=""
            onClick={reselectCourseDetails}
            className="bg-zinc-800 text-white hover:brightness-125"
            rightIcon={<IoIosArrowForward />}
          >Open Course</Button>
        </div>
        {hasSelectedLectures ? (
          <div className="flex flex-col gap-2">
            {selectedCourseLectures.map(lecture => (
              <div
                key={lecture.id}
                className="flex justify-between items-center p-2 rounded-md bg-zinc-800"
              >
                <div className="text-sm text-white">
                  <div>{`${lecture.type} - ${lecture.room}`}</div>
                  <div className="text-xs text-gray-400">
                    {`${lecture.day.join(', ')} • ${lecture.startTime}`}
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
          <ModalHeader className='bg-zinc-900 text-white'>{courseName} Sections</ModalHeader>
          <ModalCloseButton className='text-white' />
          <ModalBody pb={6} className='bg-zinc-900 text-white'>
            <Stack spacing={4}>
              {sortedClassSections.map(([classId, timeGroups], sectionIndex) => (
                <div key={classId} className="border-b border-zinc-700 pb-2 mb-2">
                  <div className="text-sm font-bold mb-2 text-blue-400">Class Section {sectionIndex + 1}</div>
                  {Object.entries(timeGroups)
                    .sort(([timeA], [timeB]) => sortByTime(timeA, timeB))
                    .map(([timeKey, lectures]) => (
                      <div key={timeKey} className="mb-2">
                        <div className="text-sm font-semibold mb-2">{timeKey}</div>
                        <div className="flex flex-row flex-wrap gap-2">
                          {lectures.map((lecture) => (
                            <div className='flex-grow mx-2 flex-1'>
                              <Checkbox
                                key={lecture.id}
                                isChecked={selectedLectures.has(lecture.id)}
                                onChange={() => onLectureToggle(lecture.id, lecture.classId)}
                                colorScheme="blue"
                              >
                                <span className="text-sm">
                                  {`${lecture.type} - ${lecture.room}`}
                                  <div className="text-xs text-gray-400">
                                    {`${lecture.day.join(', ')} • ${lecture.instructors.join(', ')}`}
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
        .filter(lecture => lecture.name === clickedLecture.name)
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

  // Group lectures by course name
  const courseGroups = lectures.reduce((acc, lecture) => {
    if (!acc[lecture.name]) {
      acc[lecture.name] = [];
    }
    acc[lecture.name].push(lecture);
    return acc;
  }, {});

  return (
    <div className="space-y-2 py-4 pl-4">
      <h2 className="text-lg font-semibold text-white mb-4">Course Sections</h2>
      {courseGroups && Object.keys(courseGroups).length !== 0 ? Object.entries(courseGroups).map(([courseName, courseLectures]) => (
        <CourseGroup
          key={courseName}
          courseName={courseName}
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