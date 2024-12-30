import React, {useState, useEffect} from 'react';
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

  const getCSSVariable = (variable) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  };
  const [color, setColor] = useState(`rgb(${getCSSVariable(graphColors[colorIndex % graphColors.length].replace('rgb(var(', '').replace('))', ''))})`);


  useEffect(() => {
    const updateColors = () => {
      setColor(`rgb(${getCSSVariable(graphColors[colorIndex % graphColors.length].replace('rgb(var(', '').replace('))', ''))})`);
    };

    // Initial update
    updateColors();

    // Listen for theme changes
    window.addEventListener('themeChange', updateColors);

    return () => {
      window.removeEventListener('themeChange', updateColors);
    };
  }, [colorIndex]);

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
      bg={`${color.replace('rgb', 'rgba').replace(')', ', 0.5)')}`}
      color='white'
      border={`2px solid ${color}`}
      rounded={5}
      className='z-50 backdrop-blur-md backdrop-brightness-50'
    >
      <div
        className={`relative text-primary text-xs overflow-hidden text-center rounded-md border z-10 cursor-pointer transition-all duration-200 backdrop-blur-xl
          ${isHovered ? 'ring-2 ring-primary' : ''}`}
        style={{
          color: `rgb(var(--text-color))`,
          borderColor: `${color}`,
          backgroundColor: `${color.replace('rgb', 'rgba').replace(')', ', 0.5)')}`,
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