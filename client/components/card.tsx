import { useContext, useEffect, useMemo, useState } from 'react';
import { Course, CourseId, CourseInstructor, creditStr, formatTerm, latestTerm, latestTermofTerms, mergeGrades, ServerInfo, SmallCourse, Term } from "../../shared/types";
import { abbr, Anchor, Chip, gpaColor, Loading } from "./util";
import { InstructorList } from "./instructorlist";
import { AppLink, AppTooltip, CourseContext, useMd } from "./clientutil";
import { useAPI } from "./wrapper";
import { TooltipPlacement } from "@nextui-org/tooltip";
import { twMerge } from "tailwind-merge";
import attributeToGenEd from "../app/attributeToGenEd.json";

//ideally maybe have term inherited from search semester filter.............?????
export function Card({ course, frameless, termFilter, className, info }: {frameless?: boolean, termFilter?: Term[], className?: string, info: ServerInfo, course: SmallCourse}) {
  const term = latestTermofTerms(course.terms, termFilter) ?? latestTermofTerms(course.terms)!;
  const url = `/course/${course.id}?term=${term}`;

  const [needFullCourse, setNeedFullCourse] = useState(false);
  const fullCourse = useAPI<Course, number>("course", {data: course.id, defer: !needFullCourse});

  const body = <CourseContext.Provider value={{
      small: course, info, term, useCourse() {
        useEffect(()=>setNeedFullCourse(true),[]);
        return fullCourse?.res ?? null;
      },
    }}>
      <p className="lg:text-sm text-sm text-gray-300 font-medium">
        {creditStr(course)} {<GPAIndicator smol />}
      </p>

      <InstructorList short className="my-2" />

      <p className="text-sm text-gray-200 break-words grow">
        <span>{abbr(course.description)}</span>
      </p>

      <div className="flex flex-row flex-wrap">
        <CourseChips/>
      </div>
    </CourseContext.Provider>;

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
        {body}
    </AppLink>
  );
};

export function CourseLink({...props}:
  ({type:"fetch",subject: string, num: number}|{type:"ctx"})) {
  const cc = useContext(CourseContext);

  let cid: "notFound"|CourseId|null=null;
  let subject:string, num:number;
  if (props.type=="fetch") {
    subject=props.subject, num=props.num;
    while (num<1e4) num*=10;

    const res = useAPI<CourseId[], {subject: string, course: number}>("lookup", {
      data: { subject: subject, course: num }
    });

    if (res!=null) cid=res.res.length==0 ? "notFound" : res.res[0];
  } else {
    cid=cc;
    subject=cid.course.subject,num=cid.course.course;
  }

  return <AppTooltip placement={useMd() ? "right" : "bottom"} content={
    <div className="pt-2 pb-1 px-2" >{cid==null ? <Loading />
      : (cid=="notFound" ? <div>
        <h2 className="text-2xl font-display font-extrabold" >Course not found</h2>
        <p>Maybe it's been erased from the structure of the universe, or it just isn't on our servers...</p>
      </div>
        : <Card frameless {...cid} {...cc.info} />)
    }</div>
  } >
    <Anchor className={cid!=null && cid=="notFound" ? "no-underline" : "text-white"} >
      {subject} {num}
    </Anchor>
  </AppTooltip>
}

export function CourseChips() {
  const cc = useContext(CourseContext);
	const scheduleTypes = [...new Set(Object.values(cc.course.sections).flat().map(x => x.scheduleType))];
	const geneds = cc.course.attributes.map(x => attributeToGenEd[x as keyof typeof attributeToGenEd])
		.filter(x=>x!=undefined);

  return <>
    {scheduleTypes.map((s) => (
      <Chip className="bg-purple-600 border-purple-800" key={s}> {s} </Chip>
    ))}

    <Chip className="bg-sky-600 border-sky-800" >
      {formatTerm(latestTerm(cc.course)!)}
    </Chip>

    {geneds.map((gened) => (
      <Chip className="bg-[#64919b] border-[#415f65]" key={gened} >
        {gened}
      </Chip>
    ))}
  </>;
}

export function GPAIndicator({smol}:{smol?:boolean}) {
  const cc = useContext(CourseContext);

	const totalGrades = useMemo(() =>
		mergeGrades(Object.values(cc.course.instructor).flatMap(x=>Object.values(x))), [cc.course])

  return <AppTooltip content={totalGrades.gpaSections==0 ? "No data" : `averaged over ${totalGrades.gpaSections} section${totalGrades.gpaSections==1?"":"s"}`} >
    <div className={`text-white flex flex-row cursor-pointer font-display ${smol ? "font-bold gap-1" : "font-extrabold gap-2"} items-center m-1 p-1 rounded-md px-3 bg-${totalGrades.gpa==null ? "zinc-800" : gpaColor(totalGrades.gpa)}`} >
      <span className={smol ? "text-xs font-light" : "font-normal"} >GPA</span>
      <h2 className={smol ? "text-sm" : "text-2xl"} >{totalGrades.gpa?.toFixed(2) ?? "?"}</h2>
    </div>
  </AppTooltip>;
}