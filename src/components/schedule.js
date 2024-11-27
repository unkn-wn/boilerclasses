import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { graphColors } from "@/lib/utils";
import { useToast } from '@chakra-ui/react';

import { stripCourseCode } from '@/pages/detail/[id]';

import { getCourseData, convertTo12HourFormat, translateType } from './calendar';
import ScheduleManager, { processLectureData } from './scheduleManager';
import { Tooltip } from '@chakra-ui/react';

/**
 * Converts military time to formatted 12-hour string
 */
export const convertNumberToTime = (timeNum) => {
  const hours = Math.floor(timeNum / 100);
  const minutes = timeNum % 100;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const ScheduleCalendar = ({ courses = [], setIsLoading, setSelectedCourse, onCourseRemove }) => {
  const toast = useToast();
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [allLectures, setAllLectures] = useState([]);
  const [displayedLectures, setDisplayedLectures] = useState([]);
  // Memoize course color mapping
  const courseColorMap = useMemo(() => new Map(), []);
  const [selectedLectureIds, setSelectedLectureIds] = useState(() => {
    // Load saved lectures from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedLectures');
      return new Set(saved ? JSON.parse(saved) : []);
    }
    return new Set();
  });

  // Add effect to save selected lectures whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLectures', JSON.stringify([...selectedLectureIds]));
    }
  }, [selectedLectureIds]);

  // Add this helper function at the beginning of the component
  const getCourseColorIndex = (detailId) => {
    if (!courseColorMap.has(detailId)) {
      courseColorMap.set(detailId, courseColorMap.size);
    }
    return courseColorMap.get(detailId);
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const times = [
    '', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
    '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'
  ];

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courses.length) {
        setIsLoading(false);
        setAllLectures([]); // Reset lectures when no courses
        setDisplayedLectures([]); // Reset displayed lectures
        setSelectedLectureIds(new Set());
        return;
      }

      setIsLoading(true);
      try {
        const coursePromises = courses.map(course =>
          getCourseData(course.subjectCode, course.courseCode, course.title)
        );

        const rawResults = await Promise.all(coursePromises);
        // Pass the full courses array to processLectureData
        const processedLectures = processLectureData(rawResults, courses);

        // Keep existing displayed lectures that are still valid
        const validLectureIds = new Set(processedLectures.map(lecture => lecture.id));
        const updatedSelectedIds = new Set(
          Array.from(selectedLectureIds).filter(id => validLectureIds.has(id))
        );

        // Find newly pinned courses and select their first lecture
        courses.forEach((course) => {
          if (course.initialPin) {
            // Find all lectures for this course
            const courseLectures = processedLectures.filter(
              lecture => lecture.courseDetails.detailId === course.detailId
            );

            // Find the first lecture-type meeting
            let firstLecture = courseLectures.find(lecture => lecture.type === "Lecture");
            // if not found, select first meeting
            if (!firstLecture) {
              courseLectures.sort((a, b) => a.start - b.start);
              firstLecture = courseLectures[0];
            }

            updatedSelectedIds.add(firstLecture.id);

            delete course.initialPin;
          }
        });

        setAllLectures(processedLectures);
        setSelectedLectureIds(updatedSelectedIds);
        setDisplayedLectures(processedLectures.filter(lecture => updatedSelectedIds.has(lecture.id)));
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast({
          render: () => (
            <div className="flex flex-col p-3 bg-red-600/50 rounded-md">
              <span className="font-bold text-white mb-1">
                Something went wrong, please let us know!
              </span>
              <a
                href="https://forms.gle/jtpLPbXm4X4RFoNh6"
                className="text-white underline hover:text-gray-200 text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                Report Issue
              </a>
            </div>
          ),
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
    // Add courses.length and a stringified version of the last course to dependencies
    // This ensures the effect runs when courses change or when a course is reselected
  }, [courses, courses.length, courses[courses.length - 1]?.tmp_inc]);

  // Optimize lecture selection handler
  const handleLectureSelectionChange = useCallback((selectedIds) => {
    const selectedSet = new Set(selectedIds);
    setSelectedLectureIds(selectedSet);
    setDisplayedLectures(allLectures.filter(lecture => selectedSet.has(lecture.id)));
  }, [allLectures]);

  /**
   * Finds all courses that overlap with a given course on a specific day
   */
  const getOverlappingCourses = (day, course) => {
    const coursesOnDay = displayedLectures.filter(c => c.day.includes(day));
    const overlappingGroup = new Set();

    const findOverlaps = (currentCourse) => {
      for (const otherCourse of coursesOnDay) {
        if (overlappingGroup.has(otherCourse)) continue;
        if (!(otherCourse.end <= currentCourse.start || otherCourse.start >= currentCourse.end)) {
          overlappingGroup.add(otherCourse);
          findOverlaps(otherCourse);
        }
      }
    };

    findOverlaps(course);
    return Array.from(overlappingGroup);
  };

  const calculateTimePosition = (militaryTime) => {
    const hours = Math.floor(militaryTime / 100);
    const minutes = militaryTime % 100;
    return hours + (minutes / 60);
  };


  const reselectCourseDetails = (overlappingCourse) => {
    for (const course of courses) {
      for (const crn of course.crn) {
        if (crn === parseInt(overlappingCourse.crn)) {
          setSelectedCourse(course);
          return;
        }
      }
    }
  };

  return (
    <div className='flex flex-col w-full lg:w-auto'>
      <div className="flex flex-col w-full h-full relative overflow-x-auto">
        {/* Header Row */}
        <div className="flex flex-row">
          <div className="w-16"></div>
          {days.map(day => (
            <div key={day} className="flex-1 text-center font-bold text-zinc-500">
              {day}
            </div>
          ))}
        </div>

        {/* Grid with Lectures */}
        <div className="pl-16 relative flex flex-row overflow-auto h-full">
          {/* Day Columns */}
          {days.map((day, dayIndex) => (
            <div key={day} className="flex-1 relative">
              {/* Time Grid Lines */}
              {times.map((time, timeIndex) => (
                <div
                  key={`${day}-${time}`}
                  className="h-8 border-b border-zinc-600"
                >
                  {dayIndex === 0 && ( // Only display time labels on the first column
                    <div className="absolute -left-16 w-16 text-right pr-2 -translate-y-4 text-zinc-500">
                      {time}
                    </div>
                  )}
                </div>
              ))}

              {/* Display Lectures for the Day */}
              <div className='flex flex-row'>
                {(() => {
                  // Track which courses we've already rendered
                  const renderedGroups = new Set();

                  return displayedLectures
                    .filter(course => course.day.includes(day))
                    .map((course, courseIndex) => {
                      // Skip if this course is part of an already rendered group
                      if (renderedGroups.has(course.id)) return null;

                      const overlaps = getOverlappingCourses(day, course);

                      // Sort overlaps by start time and get earliest
                      const sortedOverlaps = [...overlaps].sort((a, b) => a.start - b.start);

                      // Only proceed if this is the earliest course in its group
                      if (course.id === sortedOverlaps[0].id) {
                        // Mark all courses in this group as rendered
                        sortedOverlaps.forEach(c => renderedGroups.add(c.id));

                        return (
                          <div className="flex flex-row absolute top-0 left-0 w-full h-full" key={courseIndex}>
                            {sortedOverlaps.map((overlappingCourse, index) => {
                              const colorIndex = getCourseColorIndex(overlappingCourse.courseDetails.detailId);
                              // Calculate position based on THIS course's times, not the original course
                              const startPos = calculateTimePosition(overlappingCourse.start);
                              const endPos = calculateTimePosition(overlappingCourse.end);
                              const top = (startPos - 6) * 2; // Subtract 6 since our grid starts at 6 am technically
                              const height = (endPos - startPos) * 2;

                              const tooltipContent = (
                                <div className="text-left p-2 text-xs font-light">
                                  <p className="font-bold">{overlappingCourse.name}: {overlappingCourse.courseDetails.title}</p>
                                  <p>{overlappingCourse.type}</p>
                                  <p>{overlappingCourse.startTime} - {convertNumberToTime(overlappingCourse.end)}</p>
                                  <p>{overlappingCourse.room}</p>
                                  <br />
                                  {overlappingCourse.instructors && (
                                    <p>Instructor(s): {overlappingCourse.instructors.join(', ')}</p>
                                  )}
                                  <p>Days: {overlappingCourse.day.join(', ')}</p>
                                </div>
                              );

                              return (
                                <Tooltip
                                  key={overlappingCourse.id}
                                  label={tooltipContent}
                                  placement="auto-end"
                                  hasArrow
                                  bg={graphColors[colorIndex % graphColors.length] + "50"}
                                  color="white"
                                  border={`2px solid ${graphColors[colorIndex % graphColors.length]}`}
                                  rounded={5}
                                  className='z-50 backdrop-blur-md backdrop-brightness-50'
                                >
                                  <div
                                    className={`relative text-white text-xs overflow-hidden text-center rounded-md border z-10 cursor-pointer transition-all duration-200 backdrop-blur-[1px]
                                    ${hoveredCourse === overlappingCourse.courseDetails.detailId ? 'ring-2 ring-white' : ''}`}
                                    style={{
                                      borderColor: graphColors[colorIndex % graphColors.length],
                                      backgroundColor: graphColors[colorIndex % graphColors.length] + "50",
                                      top: `${top}rem`,
                                      height: `${height}rem`,
                                      left: '0',
                                      right: '0',
                                      width: `${100 / overlaps.length}%`,
                                      // marginLeft: `${(index * 100) / overlaps.length}%`
                                    }}
                                    onMouseEnter={() => setHoveredCourse(overlappingCourse.courseDetails.detailId)}
                                    onMouseLeave={() => setHoveredCourse(null)}
                                    onClick={() => reselectCourseDetails(overlappingCourse)}
                                  >
                                    {`${translateType(overlappingCourse.type)} ${overlappingCourse.courseDetails.subjectCode}${stripCourseCode(overlappingCourse.courseDetails.courseCode)}`}
                                  </div>
                                </Tooltip>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    });
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manager Section */}
      <div className="space-y-4 mt-4">
        <ScheduleManager
          lectures={allLectures}
          selectedLectureIds={selectedLectureIds}
          onLectureSelectionChange={handleLectureSelectionChange}
          setSelectedCourse={setSelectedCourse}
          onCourseRemove={onCourseRemove}
        />
      </div>
    </div>

  );
};

export default ScheduleCalendar;