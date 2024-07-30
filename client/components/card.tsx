import React, { useMemo } from 'react';
import Link from 'next/link'
import { Course, CourseId, creditStr, formatTerm, instructorStr, latestTerm, ServerInfo, Term } from "../../shared/types";
import { abbr, Anchor, Chip } from "./util";
import { SearchState } from "@/app/search";
import { InstructorList } from "./instructorlist";
import { CourseContext } from "./clientutil";

const Card = ({ course, id, saveSearch, ...info }: CourseId&ServerInfo&{saveSearch?: SearchState}) => {
  const hasDistance = useMemo(() =>
    Object.values(course.sections).flat()
  .find(s => s.scheduleType=="Distance Learning")!=undefined, [course]);

  const term = latestTerm(course);

  return (
    <CourseContext.Provider value={{
      course: course, info, 
      term, section: null,
      selSection: ()=>{},
      selTerm: ()=>{}
    }}>
      <Link href={`/course/${id}`}
        onClick={() => {
          if (saveSearch) {
            window.localStorage.setItem("lastSearch", JSON.stringify(saveSearch));
          }
        }}
        className="flex flex-col bg-zinc-800 gap-1 p-6 rounded-md shadow-md hover:scale-105 transition hover:transition cursor-pointer">
          <h2 className="text-xl font-display font-bold">{course.subject} {course.course}: {course.name}</h2>
          <p className="lg:text-sm text-sm text-gray-300 font-medium">
            {creditStr(course)}
          </p>

          <InstructorList short className="my-2" />

          <p className="text-sm text-gray-200 break-words grow">
            <span>{abbr(course.description)}</span>
          </p>

          <div className="flex flex-row flex-wrap">
            {hasDistance && <Chip className="border-purple-500 bg-purple-700">
              Distance Learning
            </Chip>}
            <Chip className="border-cyan-400 bg-sky-800" >{formatTerm(term)}</Chip>
          </div>
      </Link>
    </CourseContext.Provider>
  )
};

export default Card;
