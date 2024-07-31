import { useContext, useMemo } from 'react';
import { CourseId, creditStr, formatTerm, latestTerm, ServerInfo, Term } from "../../shared/types";
import { abbr, Anchor, Chip, Loading } from "./util";
import { InstructorList } from "./instructorlist";
import { AppLink, AppTooltip, CourseContext } from "./clientutil";
import { useAPI } from "./wrapper";
import { TooltipPlacement } from "@nextui-org/tooltip";

//ideally maybe have term inherited from search semester filter.............?????
export function Card({ course, id, frameless, termFilter, ...info }: CourseId&ServerInfo&{frameless?: boolean, termFilter?: Term[]}) {
  const hasDistance = useMemo(() =>
    Object.values(course.sections).flat()
  .find(s => s.scheduleType=="Distance Learning")!=undefined, [course]);

  const term = latestTerm(course, termFilter) ?? latestTerm(course)!;

  const body = <CourseContext.Provider value={{
      course: course, info, 
      term, section: null, id,
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
    <AppLink href={`/course/${id}`}
      className="flex flex-col bg-zinc-800 gap-1 p-6 rounded-md shadow-md hover:scale-105 transition hover:transition cursor-pointer">
        <h2 className="text-xl font-display font-bold">{course.subject} {course.course}: {course.name}</h2>
        {body}
    </AppLink>
  );
};

export function CourseLink({placement,...props}:
  ({type:"fetch",subject: string, num: number}|{type:"ctx"})&{placement?:TooltipPlacement}) {
  const cc = useContext(CourseContext);

  let cid: "notFound"|CourseId|null=null;
  let subject:string, num:number;
  if (props.type=="fetch") {
    while (props.num<1e4) props.num*=10;
    const res = useAPI<CourseId|"notFound", string>("course", {
      data: `${props.subject}${props.num}`, handleErr(e) {
        if (e.error=="notFound") return "notFound";
      }
    });
    
    subject=props.subject, num=props.num;
    if (res!=null) cid=res.res;
  } else {
    cid=cc;
    subject=cid.course.subject,num=cid.course.course;
  }

  return <AppTooltip placement={placement} content={
    <div className="pt-4" >{cid==null ? <Loading />
      : (cid=="notFound" ? <div>
        <h2 className="text-2xl font-display font-extrabold" >Course not found</h2>
        <p>Maybe it's been erased from the structure of the universe, or it just isn't on our servers...</p>
      </div>
        : <Card frameless {...cid} {...cc.info} />)
    }</div>
  } >
    <Anchor className={cid!=null && cid=="notFound" ? "no-underline" : "text-white"} >{subject} {num}</Anchor>
  </AppTooltip>
}
