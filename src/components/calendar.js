import React from 'react';
import { useDetailContext } from '@/components/detail/context/DetailContext';
import { useEffect, useState, useMemo, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Popover, PopoverTrigger, PopoverContent, PopoverHeader,
    PopoverBody, PopoverArrow, Spinner, Tooltip
} from '@chakra-ui/react';
import { FiClock, FiMapPin, FiUser, FiCalendar, FiShare, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { convertNumberToTime, convertTo12HourFormat, calculateEndTime } from '@/lib/timeUtils';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

// Get the color for different meeting types - more subtle approach
const getMeetingTypeIndicator = (type) => {
    switch(type) {
        case "Lecture":
            return "border-l-4 border-blue-500";
        case "Laboratory":
        case "Lab":
            return "border-l-4 border-purple-500";
        case "Practice Study Observation":
        case "PSO":
            return "border-l-4 border-green-500";
        case "Recitation":
            return "border-l-4 border-yellow-500";
        default:
            return "border-l-4 border-gray-500";
    }
};

// Memoized Meeting component with enhanced visual design
const MeetingDisplay = memo(({ meeting, isHighlighted, onHover }) => {
    const meetingTypeIndicator = getMeetingTypeIndicator(meeting.Type);
    const isLecture = meeting.Type === "Lecture";

    // Function to copy meeting details to clipboard
    const shareMeeting = (e) => {
        e.stopPropagation();
        const details = `${meeting.Type}: ${meeting.startTime}-${meeting.endTime} at ${meeting.room}\nInstructor: ${meeting.Instructors[0]?.Name || 'TBA'}`;
        navigator.clipboard.writeText(details);
    };

    return (
        <Popover placement="auto" trigger="hover">
            <PopoverTrigger>
                <div
                    className={`w-full cursor-pointer rounded-md bg-background-secondary transition-all
                        ${isHighlighted ? 'bg-yellow-500/20 shadow-lg' : 'shadow-sm'}
                        ${meetingTypeIndicator}`}
                    onMouseEnter={() => onHover(meeting.crn)}
                    onMouseLeave={() => onHover(null)}
                >
                    <div className="py-2 px-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`font-medium text-sm ${isLecture ? 'text-primary' : 'text-secondary'}`}>
                                {translateType(meeting.Type)}
                            </span>
                            <span className="text-tertiary text-xs">
                                {meeting.startTime}
                            </span>
                        </div>
                        <p className="text-tertiary text-xs truncate mt-0.5">
                            {meeting.Instructors[0]?.Name || 'TBA'}
                        </p>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent
                backgroundColor={`rgb(var(--background-color))`}
                borderColor='gray.500'
                boxShadow="0 0 10px 0 rgba(0, 0, 0, 0.5)"
                minW={{ base: "90%", lg: "max-content" }}
            >
                <PopoverArrow />
                <PopoverHeader className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${getTypeColor(meeting.Type)}`}></span>
                        <span className="font-semibold">{meeting.Type}</span>
                    </div>
                    <div className="text-sm text-tertiary">CRN: {meeting.crn}</div>
                </PopoverHeader>
                <PopoverBody className="divide-y divide-background-secondary">
                    {/* Time and Location Section */}
                    <div className="pb-2">
                        <div className="flex items-start gap-3 mb-2">
                            <FiClock className="text-blue-500 mt-1 flex-shrink-0" />
                            <div>
                                <div className="font-medium">{meeting.startTime} - {meeting.endTime}</div>
                                <div className="text-sm text-tertiary">{meeting.StartDate} to {meeting.EndDate}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FiMapPin className="text-red-500 mt-1 flex-shrink-0" />
                            <div>
                                <div className="font-medium">{meeting.room}</div>
                                <a href={`https://www.google.com/maps/search/${encodeURIComponent(`${meeting.room.split(' ')[0]} Purdue`)}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="text-sm text-blue-500 hover:underline">
                                    View on map
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Instructor Section */}
                    <div className="py-2">
                        <div className="flex items-start gap-3">
                            <FiUser className="text-green-500 mt-1 flex-shrink-0" />
                            <div>
                                <div className="font-medium">Instructor</div>
                                <div>{meeting.Instructors.map(i => i.Name).join(", ") || 'TBA'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Days & Actions Section */}
                    <div className="pt-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <FiCalendar className="text-purple-500" />
                            <span className="font-medium">{meeting.days}</span>
                        </div>

                        <Tooltip label="Copy details" placement="top">
                            <button
                                onClick={shareMeeting}
                                className="p-1.5 rounded-full hover:bg-background-secondary text-tertiary hover:text-secondary transition-colors"
                                aria-label="Share meeting details"
                            >
                                <FiShare />
                            </button>
                        </Tooltip>
                    </div>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
});

MeetingDisplay.displayName = 'MeetingDisplay';

// Helper function to get color for popover indicator dot
const getTypeColor = (type) => {
    switch(type) {
        case "Lecture": return "bg-blue-500";
        case "Laboratory":
        case "Lab": return "bg-purple-500";
        case "Practice Study Observation":
        case "PSO": return "bg-green-500";
        case "Recitation": return "bg-yellow-500";
        default: return "bg-gray-500";
    }
};

// Weekday header component - extracted for clarity
const WeekdayHeader = ({ day }) => {
    const isToday = useMemo(() => {
        const today = new Date().getDay();
        // Convert day string to day number (0 = Sunday, 1 = Monday, etc.)
        const dayMap = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };
        return today === dayMap[day];
    }, [day]);

    return (
        <div className={`flex justify-between items-center pb-1 mb-1
            ${isToday ? 'border-b-2 border-yellow-500' : 'border-b border-gray-500'}`}>
            <span className="font-medium">
                {day === "Thursday" ? "Thurs" : day.substring(0, 3)}
            </span>
            {isToday && (
                <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-medium">
                    Today
                </span>
            )}
        </div>
    );
};

// Mobile day carousel component
const MobileDayCarousel = ({ processedDays, hoveredCrn, setHoveredCrn }) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const [activeDayIndex, setActiveDayIndex] = useState(() => {
        // Set today as active day, or Monday if weekend
        const today = new Date().getDay();
        return today >= 1 && today <= 5 ? today - 1 : 0;
    });

    // Get today's day number (0-indexed where Monday is 0)
    const todayIndex = useMemo(() => {
        const today = new Date().getDay();
        return today >= 1 && today <= 5 ? today - 1 : -1;
    }, []);

    const nextDay = () => {
        setActiveDayIndex((prev) => (prev === 4 ? 0 : prev + 1));
    };

    const prevDay = () => {
        setActiveDayIndex((prev) => (prev === 0 ? 4 : prev - 1));
    };

    const activeDay = days[activeDayIndex];
    const meetings = processedDays[activeDay];

    return (
        <div className="md:hidden">
            {/* Day selector */}
            <div className="flex justify-between items-center mb-3">
                <button
                    onClick={prevDay}
                    className="p-2 rounded-full hover:bg-background-secondary"
                    aria-label="Previous day"
                >
                    <FiChevronLeft />
                </button>

                <div className="flex items-center gap-2">
                    <h3 className="font-bold">{activeDay}</h3>
                    {todayIndex === activeDayIndex && (
                        <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-medium">
                            Today
                        </span>
                    )}
                </div>

                <button
                    onClick={nextDay}
                    className="p-2 rounded-full hover:bg-background-secondary"
                    aria-label="Next day"
                >
                    <FiChevronRight />
                </button>
            </div>

            {/* Day indicator dots */}
            <div className="flex justify-center gap-1 mb-3">
                {days.map((day, idx) => (
                    <button
                        key={day}
                        onClick={() => setActiveDayIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                            idx === activeDayIndex
                                ? 'bg-blue-500 w-4'
                                : idx === todayIndex
                                    ? 'bg-yellow-500/70'
                                    : 'bg-background-tertiary'
                        }`}
                        aria-label={day}
                    />
                ))}
            </div>

            {/* Meetings for selected day */}
            <div className="">
                <div className="flex flex-col gap-3">
                    {meetings && meetings.length > 0 ? (
                        meetings.map((meeting, i) => (
                            <MeetingDisplay
                                meeting={meeting}
                                key={meeting.crn + "-" + i}
                                isHighlighted={hoveredCrn === meeting.crn}
                                onHover={setHoveredCrn}
                            />
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-20 text-tertiary text-sm bg-background/50 rounded-md">
                            No meetings on {activeDay}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Lazy-loaded Calendar component using Intersection Observer
const LazyCalendar = () => {
    const [isVisible, setIsVisible] = useState(false);
    const calendarRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 } // Trigger when 10% is visible
        );

        if (calendarRef.current) {
            observer.observe(calendarRef.current);
        }

        return () => {
            if (calendarRef.current) {
                observer.disconnect();
            }
        };
    }, []);

    return (
        <div ref={calendarRef} className="w-full rounded-xl bg-background p-2 md:p-4 mt-4 shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{CURRENT_SEMESTER} Schedule: </h3>

                {/* Simplified legend for meeting types */}
                <div className="hidden md:flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 border-l-4 border-blue-500 bg-background-tertiary/75"></span>
                        <span className="text-tertiary">Lecture</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 border-l-4 border-purple-500 bg-background-secondary"></span>
                        <span className="text-tertiary">Lab</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 border-l-4 border-green-500 bg-background-secondary"></span>
                        <span className="text-tertiary">PSO</span>
                    </div>
                </div>
            </div>

            {isVisible ? <CalendarContent /> : <div className="h-40 flex items-center justify-center">
                <Spinner size="md" color={`rgb(var(--text-color))`} />
            </div>}
        </div>
    );
};

// Main calendar content component - only rendered when visible
const CalendarContent = () => {
    const { courseData } = useDetailContext();
    const { subjectCode, courseCode, title, detailId } = courseData;

    const [calendarData, setCalendarData] = useState(null);
    const [wait, setWait] = useState(true);
    const [hoveredCrn, setHoveredCrn] = useState(null);

    // Prevent re-fetching on re-renders by using a ref
    const dataFetchedRef = useRef(false);

    useEffect(() => {
        // Only fetch once
        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;

        const fetchCourseData = async () => {
            try {
                const data = await getCourseData(subjectCode, courseCode, title);
                setCalendarData(data);
            } catch (error) {
                console.error("Error fetching calendar data:", error);
            } finally {
                setWait(false);
            }
        };

        fetchCourseData();
    }, [subjectCode, courseCode, title]);

    // Process meeting data once when calendar data changes
    const processedDays = useMemo(() => {
        if (!calendarData?.Classes?.[0]?.Sections) return null;

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const processedDays = {};

        days.forEach(day => {
            processedDays[day] = getMeetingsForDay(day, calendarData, detailId);
        });

        return processedDays;
    }, [calendarData, detailId]);

    if (!processedDays) {
        return (
            <>
                <div className='grid justify-center w-full rounded-xl bg-background p-2 md:p-4'>
                    {wait ? <Spinner /> : <p className="text-tertiary">Schedule not available!</p>}
                </div>
            </>
        );
    }

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    return (
        <>
            {/* Mobile swipeable calendar */}
            <MobileDayCarousel
                processedDays={processedDays}
                hoveredCrn={hoveredCrn}
                setHoveredCrn={setHoveredCrn}
            />

            {/* Desktop calendar grid */}
            <div className='hidden md:grid grid-cols-5 gap-4'>
                {days.map((day) => {
                    const meetings = processedDays[day];
                    return (
                        <div key={day} className="bg-background-secondary/20 rounded-lg p-2">
                            <WeekdayHeader day={day} />

                            <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden h-full max-h-80">
                                {/* Only render meetings if they exist */}
                                {meetings && meetings.length > 0 ? (
                                    meetings.map((meeting, i) => (
                                        <MeetingDisplay
                                            meeting={meeting}
                                            key={meeting.crn + "-" + i}
                                            isHighlighted={hoveredCrn === meeting.crn}
                                            onHover={setHoveredCrn}
                                        />
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-20 text-tertiary text-sm bg-background/50 rounded-md">
                                        No meetings
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

// Helper function to get meetings for a specific day
// Moved outside component to prevent recreation on each render
const getMeetingsForDay = (day, calendarData, detailId) => {
    if (!calendarData?.Classes) return [];

    const meetings = [];
    calendarData.Classes.forEach(course => {
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
                        detailId,
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

// Main exported component - now using lazy loading
const Calendar = () => {
    return <LazyCalendar />;
};

// API function moved outside of component to avoid recreation
export const getCourseData = async (subjectCode, courseCode, title) => {
    try {
        // BANDAID FIX #1: Hardcode STAT 416 and STAT 519
        if (subjectCode === 'STAT') {
            if (courseCode === 41600 || courseCode === 51900) {
                subjectCode = 'MA';
            }
        }

        // HARD CODED SEMESTER
        const semester = "202520";
        const url = "https://api.purdue.io/odata/Courses?$expand=Classes($filter=Term/Code eq '" +
            semester + "';$expand=Sections($expand=Meetings($expand=Instructors,Room($expand=Building))))" +
            "&$filter=Subject/Abbreviation eq '" + subjectCode +
            "' and Number eq '" + courseCode +
            "' and contains(Title, '" + encodeURIComponent(title) + "')";

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();

        // BANDAID FIX #2: Filter out courses with the same title
        if (data.value.length > 1) {
            console.warn('Multiple courses found with the same title:', data.value);
            data.value = data.value.filter(course => course.Title === title);
        }

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
        case "Recitation":
            return "Recitation";
        default:
            return type;
    }
}

export default Calendar;