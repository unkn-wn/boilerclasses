import { useEffect, useState } from "react";

import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    PopoverCloseButton,
    PopoverAnchor,
    Spinner,
} from '@chakra-ui/react'

import { convertNumberToTime } from './schedule';
import { calculateEndTime } from './scheduleManager';

// Component
const Calendar = (props) => {
    const { subjectCode, courseCode, title } = props;
    const [courseData, setCourseData] = useState(null);
    const [wait, setWait] = useState(true);
    const [hoveredCrn, setHoveredCrn] = useState(null);  // Add this line

    useEffect(() => {
        const fetchCourseData = async () => {
            const data = await getCourseData(subjectCode, courseCode, title);
            setCourseData(data);
        }

        fetchCourseData();
        setWait(false);
    }, [subjectCode, courseCode, title]);

    if (!courseData?.Classes?.[0]?.Sections) {
        return (
            <>
                <div className="mb-2 ml-2 text-sm text-gray-500">Spring 2025 Schedule: </div>
                <div className='grid justify-center w-full rounded-xl bg-zinc-900 p-2 md:p-4'>
                    {wait ? <Spinner /> : <p className="text-gray-500">Schedule not available!</p>}
                </div>
            </>
        )
    }

    // Helper function to get meetings for a specific day
    const getMeetingsForDay = (day) => {
        const meetings = [];
        courseData.Classes.forEach(course => {
            course.Sections.forEach(section => {
                section.Meetings.forEach(meeting => {
                    if (meeting.DaysOfWeek.includes(day)) {
                        const startTime = meeting.StartTime.split('.')[0];
                        const duration = meeting.Duration.replace('PT', '');
                        const end = calculateEndTime(startTime, duration);
                        const endTime = convertNumberToTime(end);

                        meetings.push({
                            ...meeting,
                            sectionType: section.Type,
                            crn: section.Crn,
                            room: `${meeting.Room.Building.ShortCode} ${meeting.Room.Number}`,
                            startTime: convertTo12HourFormat(meeting.StartTime.split('.')[0]),
                            endTime,
                            days: meeting.DaysOfWeek,
                            detailId: props.detailId  // Add this line
                        });
                    }
                });
            });
        });

        return meetings.sort((a, b) => {
            const aTime = a.StartTime.split(':');
            const bTime = b.StartTime.split(':');
            return (parseInt(aTime[0]) * 60 + parseInt(aTime[1])) -
                (parseInt(bTime[0]) * 60 + parseInt(bTime[1]));
        });
    };


    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
        <>
            <div className="mb-2 ml-2 text-sm text-gray-500">Spring 2025 Schedule: </div>
            {/* Calendar View for Lecture Times */}
            <div className='grid grid-cols-1 md:grid-cols-5 w-full rounded-xl bg-zinc-900 p-2 md:p-4'>
                {days.map((day, index) => (
                    <div key={day} className={`${index !== 0 ? 'border-t-2 mt-4 md:border-t-0 md:mt-0 md:ml-4' : ''
                        } ${index !== days.length - 1 ? 'md:border-r-2 md:pr-4' : ''
                        } border-gray-500`}>
                        <p className='relative text-right text-gray-500'>{day.charAt(0)}</p>
                        <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden max-h-40 md:max-h-80 lg:h-full">
                            {getMeetingsForDay(day).map((meeting, i) => (
                                <MeetingDisplay
                                    meeting={meeting}
                                    key={i}
                                    isHighlighted={hoveredCrn === meeting.crn}
                                    onHover={setHoveredCrn}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

const MeetingDisplay = ({ meeting, isHighlighted, onHover }) => (
    <Popover placement="auto" trigger="hover">
        <PopoverTrigger>
            <span
                className={`w-full py-1 px-2 rounded-md transition-all ${isHighlighted
                    ? 'bg-yellow-500/50'
                    : meeting.Type === 'Lecture' ? 'bg-zinc-700' : 'bg-zinc-800'
                    }`}
                onMouseEnter={() => onHover(meeting.crn)}
                onMouseLeave={() => onHover(null)}
            >
                <p className="text-white">
                    {translateType(meeting.Type)} - {meeting.startTime}
                </p>
                <p className="text-zinc-400 text-sm">
                    {meeting.Instructors[0]?.Name}
                </p>
            </span>
        </PopoverTrigger>
        <PopoverContent backgroundColor='black' borderColor='gray.500' boxShadow="0 0 10px 0 rgba(0, 0, 0, 0.5)" minW={{ base: "90%", lg: "max-content" }}>
            <PopoverArrow />
            <PopoverHeader fontWeight='semibold'>{meeting.Type} - CRN: {meeting.crn}</PopoverHeader>
            <PopoverBody className="text-sm">
                <p>{meeting.startTime} - {meeting.endTime}</p>
                <p>{meeting.room}</p>
                <br />
                <p><strong>Instructors</strong>: {meeting.Instructors.map(i => i.Name).join(", ") || 'TBA'}</p>
                <p><strong>Days</strong>: {meeting.days}</p>
                <p>{meeting.StartDate} to {meeting.EndDate}</p>
            </PopoverBody>
        </PopoverContent>
    </Popover>
);

export const getCourseData = async (subjectCode, courseCode, title) => {
    try {
        const semester = "202520";
        const url = "https://api.purdue.io/odata/Courses?$expand=Classes($filter=Term/Code eq '" +
            semester + "';$expand=Sections($expand=Meetings($expand=Instructors,Room($expand=Building))))" +
            "&$filter=Subject/Abbreviation eq '" + subjectCode +
            "' and Number eq '" + courseCode +
            "' and Title eq '" + encodeURIComponent(title) + "'";
        // console.log(url);

        const response = await fetch(url);
        const data = await response.json();
        return data.value[0];
    } catch (e) {
        console.error('Error fetching course data:', e);
        return null;
    }
};

// Helper function for type translation
export const translateType = (type) => {
    switch (type) {
        case "Practice Study Observation":
            return "PSO";
        case "Laboratory":
            return "Lab";
        default:
            return type;
    }
}

// Helper function to convert 24-hour format to 12-hour format
export const convertTo12HourFormat = (time) => {
    const [hour, minute] = time.split(':');
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${period}`;
};

export default Calendar;