import { semesters } from "@/lib/utils"
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';
import OverallGpa from "./OverallGpa";

import React from 'react';
import Link from 'next/link'

import { useRouter } from 'next/router';


const Card = ({ course, searchTerm }) => {
  const router = useRouter();

  const instructors = new Set();
  const availableSemesters = [];

  semesters.forEach((sem) => {
    try {
      course.instructor[sem].forEach((prof) => instructors.add(prof));
      if (course.terms.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch { }
  });
  const uniqueInstructors = [...instructors];

  const handleLink = () => {
    router.push({
      pathname: `/`,
      query: { q: searchTerm }
    });
  }


  return (
    <>
      <Link
        href={{ pathname: `/detail/${course.detailId}` }}
        passHref
        className="flex flex-col bg-zinc-800 p-6 rounded-md shadow-md hover:scale-[1.02] transition hover:transition cursor-pointer">

        <div onClick={() => handleLink()}>
          <h2 className="lg:text-lg md:text-lg font-bold text-white">{course.subjectCode} {course.courseCode}: {course.title}</h2>
          <p className="lg:text-sm text-sm text-zinc-400 font-medium my-1">
            {course.credits[1] > 1
              ? `${course.credits[1]} Credits`
              : `${course.credits[1]} Credit`}
            {` | `}
            {uniqueInstructors[0]}
            {uniqueInstructors.length > 1 && ", "}
            {uniqueInstructors.length > 1 &&
              uniqueInstructors[1]
            }
          </p>

          <p className="text-sm text-zinc-300 mb-4 break-words grow">
            <span>{course.description.length > 300
              ? `${course.description.substring(0, 300)}...`
              : course.description}
            </span>
          </p>

          <div className="flex flex-row flex-wrap">
            <OverallGpa courseData={course} card />

            {course.sched.includes("Distance Learning") && <p className="text-sm px-2 py-1 mx-1 my-1 rounded-full border-solid border border-purple-500 bg-purple-300 whitespace-nowrap">
              Distance Learning
            </p>}
            {availableSemesters.map((sem, i) => (
              (i < 2) && <span
                className={`text-sm text-white px-2 py-1 mx-1 my-1 rounded-full whitespace-nowrap ${
                  sem === CURRENT_SEMESTER
                    ? 'bg-yellow-600 border-2 border-yellow-700'
                    : 'bg-sky-800 border-2 border-sky-700'
                }`}
                key={i}
              >
                {sem}
              </span>
            ))}
          </div>

        </div>
      </Link >
    </>
  )
};

export default Card;
