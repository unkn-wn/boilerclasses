import React, { useContext, useMemo } from 'react';
import Link from 'next/link'
import { Course, CourseId, creditStr, formatTerm, instructorStr, latestTerm, ServerInfo, Term } from "../../shared/types";
import { abbr, Anchor, Chip, Loading } from "./util";
import { SearchState } from "@/app/search";
import { InstructorList } from "./instructorlist";
import { AppTooltip, CourseContext } from "./clientutil";
import { useAPI } from "./wrapper";
import { TooltipPlacement } from "@nextui-org/tooltip";

//ideally maybe have term inherited from search semester filter.............?????
export function Card({ course, id, saveSearch, frameless, termFilter, ...info }: CourseId&ServerInfo&{saveSearch?: SearchState, frameless?: boolean, termFilter?: Term[]}) {
  const hasDistance = useMemo(() =>
    Object.values(course.sections).flat()
  .find(s => s.scheduleType=="Distance Learning")!=undefined, [course]);

  const term = latestTerm(course, termFilter);

  const body = <CourseContext.Provider value={{
      course: course, info, 
      term, section: null,
      selSection: ()=>{},
      selTerm: ()=>{}
    }}>
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
    </CourseContext.Provider>;

  if (frameless) return (
    <div className="flex flex-col gap-1">
      <Anchor href={`/course/${id}`} className="text-white hover:bg-inherit" >
        <h2 className="text-2xl font-display font-bold">
          {course.subject} {course.course}: {course.name}
        </h2>
      </Anchor>
      {body}
    </div>
  );
  else return (
    <Link href={`/course/${id}`}
      onClick={() => {
        if (saveSearch) {
          window.localStorage.setItem("lastSearch", JSON.stringify(saveSearch));
        }
      }}
      className="flex flex-col bg-zinc-800 gap-1 p-6 rounded-md shadow-md hover:scale-105 transition hover:transition cursor-pointer">
        <h2 className="text-xl font-display font-bold">{course.subject} {course.course}: {course.name}</h2>
        {body}
    </Link>
  );
};

export function CourseLink({subject,num,placement}: {subject: string, num: number,placement?:TooltipPlacement}) {
  const cc = useContext(CourseContext);

  while (num<1e4) num*=10;
  const course = useAPI<CourseId|null, string>("course", {
    data: `${subject}${num}`, handleErr(e) {
      if (e.error=="notFound") return null;
    }
  });

  return <AppTooltip placement={placement} content={
    <div className="pt-4" >{course==null ? <Loading />
      : (course.res==null ? <div>
        <h2 className="text-2xl font-display font-extrabold" >Course not found</h2>
        <p>Maybe it's been erased from the structure of the universe, or it just isn't on our servers...</p>
      </div>
        : <Card frameless {...course.res} {...cc.info} />)
    }</div>
  } >
    <Anchor className={course!=null && course.res==null ? "no-underline" : "text-white"} >{subject} {num}</Anchor>
  </AppTooltip>
}
