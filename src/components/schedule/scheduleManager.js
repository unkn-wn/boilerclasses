import React, { useState, useEffect } from 'react';
import { IoMdDownload } from "react-icons/io";
import HoverMenu from './HoverMenu';
import CourseGroup from './CourseGroup';
import { downloadICS } from '@/lib/ics';
import { openPDFInNewTab } from '@/lib/pdf';  // Update import
import { calculateEndTime, convertTo12HourFormat } from '@/lib/timeUtils';
import { normalizeInstructorName } from './utils/scheduleUtils';

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
          <h2 className="text-lg font-semibold text-primary">Course Sections</h2>
          {selectedLectures.length > 0 && (
            <HoverMenu
              items={[
                {
                  label: 'Export as ICS',
                  icon: <IoMdDownload />,
                  onClick: () => downloadICS(selectedLectures)
                },
                {
                  label: 'Export as PDF',
                  icon: <IoMdDownload />,
                  onClick: () => openPDFInNewTab(selectedLectures)
                }
              ]}
            >
              <button
                className="flex items-center gap-2 px-3 py-1 text-sm text-secondary bg-background-secondary hover:brightness-125 transition rounded"
              >
                <IoMdDownload />
                Export Schedule
              </button>
            </HoverMenu>
          )}
        </div>
        <h2 className="text-xs text-secondary self-end">
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
        <p className="text-tertiary text-sm">Search for a course by using the search bar, then add a course to show up here!</p>
      )}
    </div>
  );
};

export default ScheduleManager;