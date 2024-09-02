import { useContext, useEffect, useMemo, useState } from 'react';
import { Course, CourseId, CourseInstructor, creditStr, formatTerm, InstructorGrade, latestTerm, latestTermofTerms, mergeGrades, ServerInfo, SmallCourse, Term, toSmallCourse } from "../types";
import { abbr, Anchor, Chip, gpaColor, Loading } from "./util";
import { InstructorList } from "./instructorlist";
import { AppLink, AppTooltip, useMd } from "./clientutil";
import { useAPI, useInfo } from "./wrapper";
import { TooltipPlacement } from "@nextui-org/tooltip";
import { twMerge } from "tailwind-merge";
import attributeToGenEd from "../app/attributeToGenEd.json";

//ideally maybe have term inherited from search semester filter.............?????
//causes hydration errors due to nested links (card and professors, gpa, etc)
export function Card({ course, frameless, termFilter, className, extra }: { frameless?: boolean, termFilter?: Term[], className?: string, course: SmallCourse, extra?: React.ReactNode }) {
  const terms = Object.keys(course.termInstructors) as Term[];
  const term = latestTermofTerms(terms, termFilter) ?? latestTermofTerms(terms)!;
  const url = `/course/${course.id}?term=${term}`;

  const body = <>
    <div className="lg:text-sm text-sm text-gray-300 font-medium flex flex-row flex-wrap items-center gap-1">
      {creditStr(course)} {<GPAIndicator grades={course.grades} smol />}
    </div>

    {extra}

    <InstructorList short className="my-2" whomst={course.termInstructors[term]} term={term} course={course} />

    <p className="text-sm text-gray-200 break-words grow">
      <span>{abbr(course.description)}</span>
    </p>

    <div className="flex flex-row flex-wrap">
      <CourseChips course={course} />
    </div>
  </>;

  if (frameless) return (
    <div className="flex flex-col gap-1">
      <Anchor href={url} className="text-white hover:bg-inherit" >
        <h2 className="text-2xl font-display font-bold">
          {course.subject} {course.course}: {course.name}
        </h2>
      </Anchor>
      {body}
    </div>
  );
  else return (
    <AppLink href={url}
      className={twMerge("flex flex-col bg-zinc-800 gap-1 p-6 rounded-md shadow-md hover:scale-105 transition hover:transition cursor-pointer", className)} >
      <h2 className="text-xl font-display font-bold">{course.subject} {course.course}: {course.name}</h2>
      {course.varTitle &&
        <h3 className="text-lg font-display font-bold">{course.varTitle}</h3>}
      {body}
    </AppLink>
  );
};

type LookupOrCourse = { type: "lookup", subject: string, num: number } | { type: "course", course: SmallCourse };

function useLookupOrCourse(props: LookupOrCourse): [SmallCourse | "notFound" | null, string, number] {
  let cid: "notFound" | SmallCourse | null = null;
  let subject: string, num: number;
  //cant change type! different hooks
  if (props.type == "lookup") {
    subject = props.subject, num = props.num;
    while (num < 1e4) num *= 10;

    const res = useAPI<CourseId[], { subject: string, course: number }>("lookup", {
      data: { subject: subject, course: num }
    });

    if (res != null) cid = res.res.length == 0 ? "notFound" : toSmallCourse(res.res[0]);
  } else {
    cid = props.course, subject = cid.subject, num = cid.course;
  }

  return [cid, subject, num];
}

export function CourseLinkPopup({ extra, ...props }: LookupOrCourse & { extra?: React.ReactNode }) {
  const [cid, subject, num] = useLookupOrCourse(props); //may be mounted separately from courselink, so needs to fetch (cached) separately

  return <div className="pt-2 pb-1 px-2" >{cid == null ? <Loading label={`Loading ${subject}${num}`} />
    : (cid == "notFound" ? <div className="p-2" >
      {extra ? <>
        <h2 className="text-2xl font-display font-extrabold mb-2" >{subject} {num}</h2>
        {extra}
        <p className="mt-2" >We don't have any more information on this course</p>
      </> : <>
        <h2 className="text-2xl font-display font-extrabold" >Course not found</h2>
        <p>Maybe it's been erased from the structure of the universe, or it just isn't on our servers...</p>
      </>}
    </div>
      : <Card frameless extra={extra} course={cid} />)
  }</div>;
}

export function CourseLink({ ...props }: LookupOrCourse) {
  const [cid, subject, num] = useLookupOrCourse(props);

  return <AppTooltip placement={useMd() ? "right" : "bottom"} content={<CourseLinkPopup {...props} />} >
    <Anchor className={cid == "notFound" || cid == null ? "no-underline" : "text-white"} >
      {subject} {num}
    </Anchor>
  </AppTooltip>
}

export function CourseChips({ course }: { course: SmallCourse }) {
  const geneds = course.attributes.map(x => attributeToGenEd[x as keyof typeof attributeToGenEd])
    .filter(x => x != undefined);

  return <>
    {course.scheduleTypes.map((s) => (
      <Chip className="bg-purple-600 border-purple-800" key={s}> {s} </Chip>
    ))}

    <Chip className="bg-sky-600 border-sky-800" >
      {formatTerm(latestTermofTerms(Object.keys(course.termInstructors) as Term[])!)}
    </Chip>

    {geneds.map((gened) => (
      <Chip className="bg-[#64919b] border-[#415f65]" key={gened} >
        {gened}
      </Chip>
    ))}
  </>;
}

export function GPAIndicator({ grades, smol, tip }: { grades: InstructorGrade, smol?: boolean, tip?: string }) {
  return <AppTooltip content={tip ?? (grades.gpaSections == 0 ? "No data" : `Averaged over ${grades.gpaSections} section${grades.gpaSections == 1 ? "" : "s"} (all time)`)} >
    <div className={`text-white flex flex-row cursor-pointer font-display ${smol ? "font-bold gap-1" : "font-extrabold gap-2"} items-center m-1 p-1 rounded-md px-3 ${grades.gpa == null ? "bg-zinc-800" : ""}`}
      style={{ backgroundColor: gpaColor(grades.gpa) }} >
      <span className={smol ? "text-xs font-light" : "font-normal"} >GPA</span>
      <h2 className={smol ? "text-sm" : "text-2xl"} >{grades.gpa?.toFixed(2) ?? "?"}</h2>
    </div>
  </AppTooltip>;
}