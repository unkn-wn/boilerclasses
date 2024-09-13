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


    function convertTo12HourFormat(time) {
        const [hour, minute] = time.split(':');

        const period = hour >= 12 ? 'PM' : 'AM';

        const hour12 = hour % 12 || 12;

        const time12 = `${hour12}:${minute} ${period}`;

        return time12;
    }


    // Get purdue.io data for course sections and lecture times
    const getCourseData = async (subjectCode, courseCode, title) => {

        const updatedLectures = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: []
        };

        let data;

        try {
            const semester = "202510";
            const url = "https://api.purdue.io/odata/Courses?$expand=Classes($filter=Term/Code eq '" + semester + "';$expand=Sections($expand=Meetings($expand=Instructors)))&$filter=Subject/Abbreviation eq '" + subjectCode + "' and Number eq '" + courseCode + "' and Title eq '" + title + "'";
            // console.log(url);
            const response = await fetch(url);
            setWait(false);
            data = await response.json();

            setLectures(updatedLectures);

            data = data.value[0];

        } catch (e) {
            setWait(false);
            return;
        }

        if (!data) {
            setWait(false);
            return;
        }

        for (const cls of data.Classes) {
            for (const section of cls.Sections) {
                for (const meeting of section.Meetings) {
                    try {
                        const { DaysOfWeek, StartDate, EndDate, Type } = meeting;
                        const startTimeRaw = meeting.StartTime;
                        const startTime = convertTo12HourFormat(startTimeRaw);
                        const duration = meeting.Duration.split("PT")[1];
                        const instructors = meeting.Instructors.map(instr => instr.Name);

                        const lecture = {
                            startDate: StartDate,
                            endDate: EndDate,
                            type: Type,
                            startTime,
                            startTimeRaw,
                            duration,
                            instructors
                        };

                        DaysOfWeek.split(",").forEach(day => {
                            updatedLectures[day.trim()].push(lecture);
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
        // console.log(updatedLectures);

        setLectures(updatedLectures);
    }

    useEffect(() => {
        getCourseData(subjectCode, courseCode, title);
    }, []);

    if (Object.values(lectures).every(lecture => lecture.length === 0)) {
        return (
            <>
                <div className="mb-2 ml-2 text-sm text-gray-500">Fall 2024 Schedule: </div>
                <div className='grid justify-center w-full rounded-xl bg-zinc-900 p-2 md:p-4'>
                    {wait ? <Spinner /> : <p className="text-gray-500">Schedule not available!</p>}
                </div>
            </>
        )
    }


    return (
        <>
            <div className="mb-2 ml-2 text-sm text-gray-500">Fall 2024 Schedule: </div>
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

const LectureTimeDisplay = (props) => {
    const { lecture } = props;

    const translateType = (type) => {
        switch (type) {
            case "Practice Study Observation":
                return "PSO";
            case "Laboratory":
                return "Lab";
            default:
                return type;
        }
    }

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