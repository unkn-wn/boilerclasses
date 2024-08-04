import { Course, formatTerm, CourseInstructor, mergeGrades, RMPInfo, Term, InstructorId, InstructorGrade } from "../../shared/types";
import { Anchor, capitalize, Chip, firstLast, gpaColor } from "./util";
import { useAPI } from "./wrapper";
import { CircularProgress, CircularProgressProps } from "@nextui-org/progress";
import { twMerge } from "tailwind-merge";
import { useContext } from "react";
import { AppTooltip, CourseContext, SelectionContext, useMd } from "./clientutil";
import { SectionLink } from "./sectionlink";

export const CircProg = ({c,...props}: CircularProgressProps&{c: string}) => <CircularProgress
	classNames={{
		base: "mx-auto",
		svg: "w-24 h-24",
		indicator: `stroke-${c}`,
		track: `stroke-${c}/10`,
		value: `text-2xl font-semibold text-${c}`
	}}
	strokeWidth={3} size="lg" showValueLabel={true}
	aria-label="professor statistic" {...props}
/>;

export const Meter = ({v,type}: {v:number|null, type: "gpa"|"rmp"}) => {
	if (v==null) {
		return <>
			<div className="relative w-full" >
				<div className='absolute right-0 left-0 top-0 bottom-0 p-2 backdrop-blur-sm text-center z-10'>
					<p className='text-zinc-200 text-lg font-bold text-center mt-2'>No data</p>
				</div>

				<CircProg c="white" valueLabel="?" value={0} />
			</div>
		</>;
	} else {
		return <CircProg c={gpaColor(type=="gpa" ? v : v-1)}
			valueLabel={v.toFixed(1)} value={v}
			minValue={type=="gpa" ? 0 : 1} maxValue={type=="gpa" ? 4 : 5} />;
	}
};

export function Meters({children, name, rmp, grade, className, gpaSub}: {name: string, children?: React.ReactNode, rmp: RMPInfo|null, grade: InstructorGrade|null, className?: string, gpaSub: string}) {
	const rmpUrl = rmp?.rmpUrl ?? `https://www.ratemyprofessors.com/search/professors/783?q=${firstLast(name)}`;
	const nrating = rmp?.numRatings;

	return <div className={twMerge("flex flex-row gap-2 items-stretch justify-center", className)} >
		<div className="relative flex flex-col w-full flex-1 p-4 rounded-xl gap-2 hover:scale-[1.05] transition-all items-center justify-evenly" >
			<Meter v={nrating==0 ? null : (rmp?.avgRating ?? null)} type="rmp" />
			<div className="flex flex-col items-center" >
				<Anchor className="text-lg font-display font-bold text-center text-white" href={rmpUrl} >
					RateMyProfessor
				</Anchor>
				{rmp && <span className="text-sm text-gray-400" >
					{nrating} rating{nrating!=1&&"s"}
				</span>}
			</div>
		</div>

		<div className="relative flex flex-col w-full flex-1 p-4 rounded-xl gap-2 hover:scale-[1.05] transition-all items-center justify-evenly" >
			<Meter v={grade?.gpa ?? null} type="gpa" />
			<div className="flex flex-col items-center" >
				<h3 className="text-lg font-display font-bold text-center" >
					Average GPA<br/>{gpaSub}
				</h3>
				{grade?.numSections && <span className="text-sm text-gray-400" >
					{grade.numSections} section{grade.numSections!=1&&"s"}
				</span>}
			</div>
		</div>

		{children}
	</div>;
}

function ProfData({x}: {x: CourseInstructor}) {
	const data = useAPI<InstructorId|null, string>("profbyname", {data: x.name, handleErr(e) {
		if (e.error=="notFound") return null;
	}})?.res ?? null;

	const cc = useContext(CourseContext);
	const selCtx = useContext(SelectionContext);

	const ts = Object.entries(cc.course.sections).filter(([k,v]) => v.find(s=>
		s.instructors.includes(x))!=undefined).map(([k,v]) => k as Term);
	const secs = cc.course.sections[cc.term].filter(v => v.instructors.includes(x));

	const g = cc.course.instructor[x.name]!=undefined
		? mergeGrades(Object.values(cc.course.instructor[x.name])) : null;

	const i = data?.instructor;

	return <div className="pt-3 flex flex-col items-center" >
		{data==null ?
			<p className="text-2xl font-display font-extrabold text-center" >
				{x.name}
			</p>
			: <Anchor href={`/prof/${data.id}`} className="text-2xl font-display font-extrabold text-center text-white" >
				{x.name}
			</Anchor>}
		{x.primary && <p className="text-sm text-gray-400 font-bold">Primary instructor</p>}

		<span className="my-2" ></span>
		<div className="flex flex-col w-full item-center text-center" >
			{i?.title && <p className="font-bold" >{capitalize(i.title)}</p>}
			
			{i?.dept && <p className="text-xs mb-2" >
				<b className="font-extrabold" >Department:</b> {capitalize(i.dept)}
			</p>}

			<Meters name={x.name} rmp={data?.rmp ?? null} grade={g} gpaSub="(this course)" />
		</div>

		<div className="w-full flex-row flex items-center p-3 gap-3" >
			<div className="flex flex-row" >
				Sections: {secs.map(s => <SectionLink section={s} className="ml-1" key={s.crn} >
					<Anchor>{s.section}</Anchor>
				</SectionLink>)}.
			</div>
			<div className="flex flex-row flex-wrap">
				{ts.map(t => <Chip className="border-cyan-400 bg-sky-800 cursor-pointer" key={t}
					onClick={()=>selCtx.selTerm(t)} >{formatTerm(t)}</Chip>)}
			</div>
		</div>
	</div>;
}

export function ProfLink({x, label, className}: {x: CourseInstructor, label?: string, className?: string}) {
	return <AppTooltip placement={useMd() ? "left" : "bottom"} content={<ProfData x={x} />} >
		<div className={twMerge("inline-block", className)} >
			<Anchor className={className} >{label ?? x.name}</Anchor>
		</div>
	</AppTooltip>;
}