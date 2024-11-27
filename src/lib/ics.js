import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

const formatICSDate = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const parseDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getNextDayOccurrence = (dayAbbr, afterDate) => {
  const days = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5 };
  const targetDay = days[dayAbbr];
  
  let nextOccurrence = new Date(afterDate);
  while (nextOccurrence.getDay() !== targetDay) {
    nextOccurrence.setDate(nextOccurrence.getDate() + 1);
  }
  return nextOccurrence;
};

export const generateICS = (lectures) => {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BoilerClasses//Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  lectures.forEach(lecture => {
    const semesterStart = parseDate(lecture.startDate);
    const semesterEnd = parseDate(lecture.endDate);

    lecture.day.forEach(day => {
      if (day === 'None') return;

      const startDate = getNextDayOccurrence(day, semesterStart);
      const [startHour, startMinute] = lecture.startTime.match(/(\d+):(\d+)/).slice(1);
      startDate.setHours(
        lecture.startTime.includes('PM') && startHour !== '12' 
          ? parseInt(startHour) + 12 
          : parseInt(startHour)
      );
      startDate.setMinutes(parseInt(startMinute));

      const endDate = new Date(startDate);
      const durationMatch = lecture.duration.match(/(?:(\d+)H)?(?:(\d+)M)?/);
      const hours = parseInt(durationMatch[1] || 0);
      const minutes = parseInt(durationMatch[2] || 0);
      endDate.setHours(endDate.getHours() + hours);
      endDate.setMinutes(endDate.getMinutes() + minutes);

      icsContent = icsContent.concat([
        'BEGIN:VEVENT',
        `UID:${lecture.id}-${day}@boilerclasses.com`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${formatICSDate(semesterEnd)}`,
        `SUMMARY:${lecture.name} - ${lecture.type}`,
        `LOCATION:${lecture.room}`,
        `DESCRIPTION:${lecture.type}\\nInstructor(s): ${lecture.instructors.join(', ')}`,
        'END:VEVENT'
      ]);
    });
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
};

export const downloadICS = (lectures) => {
  const icsContent = generateICS(lectures);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${CURRENT_SEMESTER}_BoilerClasses.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 