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

// Component
const Calendar = (props) => {

    const { subjectCode, courseCode, title } = props;
    const [lectures, setLectures] = useState({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: []
    });
    const [wait, setWait] = useState(true);


    useEffect(() => {
        const fetchCourseData = async () => {
            const lectureData = await getCourseData(subjectCode, courseCode, title);
            setLectures(lectureData);
        }

        fetchCourseData();
        setWait(false);
    }, [subjectCode, courseCode, title]);

    if (Object.values(lectures).every(lecture => lecture.length === 0)) {
        return (
            <>
                <div className="mb-2 ml-2 text-sm text-gray-500">Spring 2025 Schedule: </div>
                <div className='grid justify-center w-full rounded-xl bg-zinc-900 p-2 md:p-4'>
                    {wait ? <Spinner /> : <p className="text-gray-500">Schedule not available!</p>}
                </div>
            </>
        )
    }


    return (
        <>
            <div className="mb-2 ml-2 text-sm text-gray-500">Spring 2025 Schedule: </div>
            {/* Calendar View for Lecture Times */}
            <div className='grid grid-cols-1 md:grid-cols-5 w-full rounded-xl bg-zinc-900 p-2 md:p-4'>
                <div className='md:border-r-2 md:pr-4 border-gray-500'>
                    <p className='relative text-right text-gray-500'>M</p>
                    <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden max-h-40 md:max-h-80 lg:h-full">
                        {lectures.Monday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
                <div className='border-t-2 mt-4 md:border-t-0 md:mt-0 md:border-r-2 md:pr-4 border-gray-500 md:ml-4'>
                    <p className='relative text-right text-gray-500'>T</p>
                    <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden max-h-40 md:max-h-80 lg:h-full">
                        {lectures.Tuesday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
                <div className='border-t-2 mt-4 md:border-t-0 md:mt-0 md:border-r-2 md:pr-4 border-gray-500 md:ml-4'>
                    <p className='relative text-right text-gray-500'>W</p>
                    <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden max-h-40 md:max-h-80 lg:h-full">
                        {lectures.Wednesday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
                <div className='border-t-2 mt-4 md:border-t-0 md:mt-0 md:border-r-2 md:pr-4 border-gray-500 md:ml-4'>
                    <p className='relative text-right text-gray-500'>T</p>
                    <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden max-h-40 md:max-h-80 lg:h-full">
                        {lectures.Thursday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
                <div className='border-t-2 mt-4 md:border-t-0 md:mt-0 md:ml-4 border-gray-500'>
                    <p className='relative text-right text-gray-500'>F</p>
                    <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden max-h-40 md:max-h-80 lg:h-full">
                        {lectures.Friday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}


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

const LectureTimeDisplay = (props) => {
    const { lecture } = props;

    return (
        <Popover placement="auto" trigger="hover">
            <PopoverTrigger>
                {/* If lecture, color background lighter */}
                <span className={`w-full py-1 px-2 rounded-md hover:bg-zinc-600 transition-all ${lecture.type === 'Lecture' ? 'bg-zinc-700' : 'bg-zinc-800'}`}>
                    <p className="text-white">
                        {translateType(lecture.type) + " - " + lecture.startTime}
                    </p>
                    <p className="text-zinc-400 text-sm">
                        {lecture.instructors[0]}
                    </p>
                </span>
            </PopoverTrigger>
            <PopoverContent backgroundColor='black' borderColor='gray.500' boxShadow="0 0 10px 0 rgba(0, 0, 0, 0.5)" minW={{ base: "90%", lg: "max-content" }}>
                <PopoverArrow />
                <PopoverHeader fontWeight='semibold'>{lecture.type}</PopoverHeader>
                <PopoverBody>
                    <p>Start Time: {lecture.startTime}</p>
                    <p>Duration: {lecture.duration}</p>
                    <p>Instructors: {lecture.instructors.join(", ")}</p>
                    <p>{lecture.startDate} to {lecture.endDate}</p>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    )
}


export default Calendar;


// helper functions ///////////////////////////////////////

// lectures grouped by days
export const getCourseData = async (subjectCode, courseCode, title) => {
    const updatedLectures = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        None: []
    };

    let data;

    try {
        const semester = "202520";
        const url = "https://api.purdue.io/odata/Courses?$expand=Classes($filter=Term/Code eq '" + semester + "';$expand=Sections($expand=Meetings($expand=Instructors)))&$filter=Subject/Abbreviation eq '" + subjectCode + "' and Number eq '" + courseCode + "' and Title eq '" + title + "'";
        // console.log(url);

        const response = await fetch(url);
        data = await response.json();

        data = data.value[0];
    } catch (e) {
        console.error('Error fetching course data:', e);
        return updatedLectures;
    }

    if (!data) {
        console.log('No lecture data found for ' + subjectCode + ' ' + courseCode);
        return updatedLectures;
    }

    for (const cls of data.Classes) {
        for (const section of cls.Sections) {
            for (const meeting of section.Meetings) {
                try {
                    const { DaysOfWeek, StartDate, EndDate, Type, Id, RoomId } = meeting;
                    const startTimeRaw = meeting.StartTime || "00:00";
                    const startTime = convertTo12HourFormat(startTimeRaw);
                    const duration = meeting.Duration.split("PT")[1];
                    const instructors = meeting.Instructors.map(instr => instr.Name);

                    const lecture = {
                        id: `${subjectCode}-${courseCode}-${Type}-${StartDate}-${startTimeRaw}-${Id}-${RoomId}`,
                        startDate: StartDate,
                        endDate: EndDate,
                        type: Type,
                        startTime,
                        startTimeRaw,
                        duration,
                        instructors,
                        room: RoomId
                    };

                    DaysOfWeek.split(",").forEach(day => {
                        const dayLectures = updatedLectures[day.trim()];
                        const lectureExists = dayLectures.some(existingLecture => existingLecture.id === lecture.id);

                        if (!lectureExists) {
                            dayLectures.push(lecture);
                        }
                    });
                } catch (e) {
                    continue;
                }
            }
        }
    }

    for (const day in updatedLectures) {
        updatedLectures[day].sort((a, b) => {
            const aTime = a.startTimeRaw.split(':');
            const bTime = b.startTimeRaw.split(':');
            const aDate = new Date(1970, 0, 1, aTime[0], aTime[1], 0);
            const bDate = new Date(1970, 0, 1, bTime[0], bTime[1], 0);
            return aDate - bDate;
        });
    }

    return updatedLectures;
};

// New function to group lectures by time slots
export const groupLecturesByTimeSlot = (dayGroupedLectures) => {
    const timeSlotMap = new Map();

    // Process each day's lectures
    Object.entries(dayGroupedLectures).forEach(([day, lectures]) => {
        lectures.forEach(lecture => {
            const start = convertTimeToNumber(lecture.startTimeRaw);
            const end = calculateEndTime(lecture.startTimeRaw, lecture.duration);

            const key = `${lecture.id}-${lecture.type}-${start}-${end}-${lecture.instructors.join(',')}`;

            if (!timeSlotMap.has(key)) {
                timeSlotMap.set(key, {
                    id: lecture.id,
                    type: lecture.type,
                    start,
                    end,
                    startTime: lecture.startTime,
                    startTimeRaw: lecture.startTimeRaw,
                    duration: lecture.duration,
                    instructors: lecture.instructors,
                    startDate: lecture.startDate,
                    endDate: lecture.endDate,
                    days: [day]
                });
            } else {
                // Only add the day if the IDs match
                const existing = timeSlotMap.get(key);
                if (!existing.days.includes(day) && existing.id === lecture.id) {
                    existing.days.push(day);
                }
            }
        });
    });

    // Convert to array and sort by start time
    const arr = Array.from(timeSlotMap.values())
        .sort((a, b) => a.start - b.start);

    console.log(arr);
    return arr;
};

// Helper function to convert time string to number (e.g., "9:30" -> 930)
export const convertTimeToNumber = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    return parseInt(hours) * 100 + parseInt(minutes);
};

// Helper function to convert number to time string (e.g., 930 -> "9:30"), AM/PM format
export const convertNumberToTime = (timeNum) => {
    const hours = Math.floor(timeNum / 100);
    const minutes = timeNum % 100;
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper function to calculate end time from start time and duration
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

// Helper function to convert 24-hour format to 12-hour format
export const convertTo12HourFormat = (time) => {
    const [hour, minute] = time.split(':');
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${period}`;
};