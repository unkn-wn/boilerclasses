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
  } from '@chakra-ui/react'


const Calendar = (props) => {

    const { subjectCode, courseCode } = props;

    const [monday, setMonday] = useState([]);
    const [tuesday, setTuesday] = useState([]);
    const [wednesday, setWednesday] = useState([]);
    const [thursday, setThursday] = useState([]);
    const [friday, setFriday] = useState([]);


    function convertTo12HourFormat(time) {
        const [hour, minute] = time.split(':');

        const period = hour >= 12 ? 'PM' : 'AM';

        const hour12 = hour % 12 || 12;

        const time12 = `${hour12}:${minute} ${period}`;

        return time12;
    }


    // Get purdue.io data for course sections and lecture times
    const getCourseData = async (subjectCode, courseCode) => {

        try {
            const semester = "202420";
            const url = "https://api.purdue.io/odata/Courses?$expand=Classes($filter=Term/Code eq '" + semester + "';$expand=Sections($expand=Meetings($expand=Instructors)))&$filter=Subject/Abbreviation eq '" + subjectCode + "' and Number eq '" + courseCode + "'";
            const response = await fetch(url);
            let data = await response.json();

            setMonday([]);

            data =  data.value[0];

            for (const cls of data.Classes) {
                for (const section of cls.Sections) {
                    const startDate = section.StartDate;
                    const endDate = section.EndDate;
                    const type = section.Type;

                    for (const meeting of section.Meetings) {
                        const days = meeting.DaysOfWeek;
                        const startTime = convertTo12HourFormat(meeting.StartTime);
                        const duration = meeting.Duration.split("PT")[1];

                        let instructors = [];
                        for (const instr of meeting.Instructors) {
                            instructors.push(instr.Name);
                        }

                        const obj = {
                            "startDate": startDate,
                            "endDate": endDate,
                            "type": type,
                            "startTime": startTime,
                            "startTimeRaw": meeting.StartTime,
                            "duration": duration,
                            "days": days,
                            "instructors": instructors
                        }

                        if (days.includes("Monday")) {
                            setMonday(prev => [...prev, obj].sort((a, b) => {
                                return new Date('1970/01/01 ' + a.startTimeRaw) - new Date('1970/01/01 ' + b.startTimeRaw);
                            }));
                        }

                        if (days.includes("Tuesday")) {
                            setTuesday(prev => [...prev, obj].sort((a, b) => {
                                return new Date('1970/01/01 ' + a.startTimeRaw) - new Date('1970/01/01 ' + b.startTimeRaw);
                            }));
                        }

                        if (days.includes("Wednesday")) {
                            setWednesday(prev => [...prev, obj].sort((a, b) => {
                                return new Date('1970/01/01 ' + a.startTimeRaw) - new Date('1970/01/01 ' + b.startTimeRaw);
                            }));
                        }

                        if (days.includes("Thursday")) {
                            setThursday(prev => [...prev, obj].sort((a, b) => {
                                return new Date('1970/01/01 ' + a.startTimeRaw) - new Date('1970/01/01 ' + b.startTimeRaw);
                            }));
                        }

                        if (days.includes("Friday")) {
                            setFriday(prev => [...prev, obj].sort((a, b) => {
                                return new Date('1970/01/01 ' + a.startTimeRaw) - new Date('1970/01/01 ' + b.startTimeRaw);
                            }));
                        }


                    }
                }
            }

        } catch {
            return;
        }
    }

    useEffect(() => {
        getCourseData(subjectCode, courseCode);
    }, []);


    return (
        <>
            {/* Calendar View for Lecture Times */}
            <div className='grid grid-cols-5 w-full rounded-xl bg-gray-800 p-4'>
                <div className='border-r-2 pr-4 border-gray-500'>
                    <p className='relative text-right text-gray-500'>M</p>
                    <div className="flex flex-col gap-1">
                        {monday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
                <div className='border-r-2 pr-4 border-gray-500 ml-4'>
                    <p className='relative text-right text-gray-500'>T</p>
                    <div className="flex flex-col gap-1">
                        {tuesday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
                <div className='border-r-2 pr-4 border-gray-500 ml-4'>
                    <p className='relative text-right text-gray-500'>W</p>
                    <div className="flex flex-col gap-1">
                        {wednesday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
                <div className='border-r-2 pr-4 border-gray-500 ml-4'>
                    <p className='relative text-right text-gray-500'>T</p>
                    <div className="flex flex-col gap-1">
                        {thursday.map((lecture, i) => {
                            return (
                                <LectureTimeDisplay lecture={lecture} key={i} />
                            )
                        })}
                    </div>
                </div>
                <div className='ml-4'>
                    <p className='relative text-right text-gray-500'>F</p>
                    <div className="flex flex-col gap-1">
                        {friday.map((lecture, i) => {
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

    return (
        <Popover placement="auto" trigger="hover">
            <PopoverTrigger>
                <span className="w-full bg-gray-700 py-1 px-2 rounded-md hover:scale-105 transition-all">{lecture.type + " - " + lecture.startTime}</span>
            </PopoverTrigger>
            <PopoverContent backgroundColor='black' borderColor='gray.500' boxShadow="0 0 10px 0 rgba(0, 0, 0, 0.5)" width='fit-content'>
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