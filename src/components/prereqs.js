/*
 * This component is responsible for rendering the prerequisites of a course.
 */

// import { useEffect, useState } from "react";
import { subjects } from "../lib/utils";


const Prereqs = (props) => {

  const course = props.course;
  const router = props.router;


  // Parse prerequisites into a readable format
  // Function created by @Sarthak
  const parsePrereqs = (prereq, i) => {

    if (prereq.split(' ').length == 2) {
      const detailId = prereq.split(' ')[0]
      const concurrent = prereq.split(' ')[1]
      const subjectCodeMatch = detailId.match(/[A-Z]+/);
      if (!subjectCodeMatch) {
        return null;
      }
      const subjectCode = subjectCodeMatch[0];

      const subject = subjects.find((s) => s == subjectCode);
      const courseNumberMatch = detailId.match(/\d+/);
      if (!courseNumberMatch) {
        return null;
      }
      const courseNumber = courseNumberMatch[0];
      return (
        <span className='' key={i}>
          <a href={`/detail/${detailId}`}
            target="_blank" rel="noopener noreferrer"
            className='underline decoration-dotted hover:text-blue-400 transition-all duration-300 ease-out text-blue-600'>
            {subjectCode}  {courseNumber}
          </a>
          {concurrent == "True" ? " [may be taken concurrently]" : ""}
        </span>
      )
    } else if (prereq.split(' ').length == 3) {
      const concurrent = prereq.split(' ')[1]
      return `${prereq.split(' ')[0]} ${prereq.split(' ')[1]}${concurrent == "True" ? " [may be taken concurrently]" : ""}`
    } else {
      return `${"()".includes(prereq) ? "" : " "}${prereq}${"()".includes(prereq) ? "" : " "}`;
    }

  }



  // render prerequisites into page
  try {
    return (
      (course.prereqs && course.prereqs[0].split(' ')[0] != router.query.id) && <p className="lg:text-sm text-xs text-gray-400 mb-4 font-medium">
        <span className="text-gray-400 lg:text-sm text-xs">Prerequisites: </span>
        {course.prereqs.map((prereq, i) => parsePrereqs(prereq, i))}
      </p>
    );
  } catch (error) {
    console.error(course.prereqs);
    return <></>;
  }


}

export default Prereqs;