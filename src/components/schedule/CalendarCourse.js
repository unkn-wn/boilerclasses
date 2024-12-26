import React from 'react';
import { Tooltip } from '@chakra-ui/react';
import { graphColors } from '@/lib/utils';
import { stripCourseCode } from '@/pages/detail/[id]';
import { translateType } from '../calendar';
import { convertNumberToTime } from '@/lib/timeUtils';

const CalendarCourse = ({
  course,
  colorIndex,
  isHovered,
  onHover,
  onClick,
  width,
  style
}) => {
  const tooltipContent = (
    <div className="text-left p-2 text-xs font-light">
      <p className="font-bold">{course.name}: {course.courseDetails.title}</p>
      <p>{course.type}</p>
      <p>{course.startTime} - {convertNumberToTime(course.end)}</p>
      <p>{course.room}</p>
      <br />
      {course.instructors && (
        <p>Instructor(s): {course.instructors.join(', ')}</p>
      )}
      <p>Days: {course.day.join(', ')}</p>
    </div>
  );

  return (
    <Tooltip
      label={tooltipContent}
      placement="auto-end"
      hasArrow
      bg={`${graphColors[colorIndex % graphColors.length]}50`}
      color={`rgb(var(--text-color))`}
      border={`2px solid ${graphColors[colorIndex % graphColors.length]}`}
      rounded={5}
      className='z-50 backdrop-blur-md backdrop-brightness-50'
    >
      <div
        className={`relative text-white text-xs overflow-hidden text-center rounded-md border z-10 cursor-pointer transition-all duration-200 backdrop-blur-xl
          ${isHovered ? 'ring-2 ring-white' : ''}`}
        style={{
          borderColor: graphColors[colorIndex % graphColors.length],
          backgroundColor: graphColors[colorIndex % graphColors.length] + "50",
          width: `${width}%`,
          ...style
        }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onClick={onClick}
      >
        {`${translateType(course.type)} ${course.courseDetails.subjectCode}${stripCourseCode(course.courseDetails.courseCode)}`}
      </div>
    </Tooltip>
  );
};

export default CalendarCourse;