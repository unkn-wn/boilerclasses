
import { jsPDF } from 'jspdf';
import { convertNumberToTime } from './timeUtils';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

export const downloadPDF = (selectedLectures) => {
  const doc = new jsPDF();

  // Set title
  doc.setFontSize(20);
  doc.text('Course Schedule', 20, 20);

  // Set content font
  doc.setFontSize(12);
  let yPos = 40;

  // Group lectures by course
  const courseGroups = selectedLectures.reduce((acc, lecture) => {
    const courseKey = `${lecture.courseDetails.subjectCode} ${lecture.courseDetails.courseCode}`;
    if (!acc[courseKey]) {
      acc[courseKey] = {
        title: lecture.courseDetails.title,
        sections: []
      };
    }
    acc[courseKey].sections.push({
      type: lecture.type,
      days: lecture.day.join(', '),
      time: `${lecture.startTime} - ${convertNumberToTime(lecture.end)}`,
      room: lecture.room,
      instructors: lecture.instructors.join(', ')
    });
    return acc;
  }, {});

  // Write each course and its sections
  Object.entries(courseGroups).forEach(([courseCode, course]) => {
    // Add page if content might overflow
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Write course header
    doc.setFont(undefined, 'bold');
    doc.text(`${courseCode}: ${course.title}`, 20, yPos);
    yPos += 10;

    // Write sections
    doc.setFont(undefined, 'normal');
    course.sections.forEach(section => {
      doc.text(`${section.type}:`, 30, yPos);
      doc.text(`${section.days} | ${section.time}`, 70, yPos);
      yPos += 6;
      doc.text(`Room: ${section.room}`, 30, yPos);
      yPos += 6;
      if (section.instructors) {
        doc.text(`Instructor(s): ${section.instructors}`, 30, yPos);
        yPos += 10;
      }
    });
    yPos += 5;
  });

  // Save the PDF
  doc.save(CURRENT_SEMESTER + '_BoilerClasses.pdf');
};