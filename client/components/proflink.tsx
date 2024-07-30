import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/popover";
import { Course, formatTerm, Instructor, mergeGrades, RMPInfo, Term } from "../../shared/types";
import { Anchor, Chip, firstLast, gpaColor } from "./util";
import { IconParkingCircleFilled } from "@tabler/icons-react";
import { useAPI } from "./wrapper";
import { CircularProgress, CircularProgressProps } from "@nextui-org/progress";
import { ClassNameValue, twMerge } from "tailwind-merge";
import { useContext } from "react";
import { CourseContext } from "./clientutil";
import { SectionLink } from "./sectionlink";

const CircProg = ({c,...props}: CircularProgressProps&{c: string}) => <CircularProgress
	classNames={{
		svg: "w-24 h-24",
		indicator: `stroke-${c}`,
		track: `stroke-${c}/10`,
		value: `text-2xl font-semibold text-${c}`
	}}
	strokeWidth={3} size="lg" showValueLabel={true}
	aria-label="professor statistic" {...props}
/>;

function ProfMeters({x, course}: {x: Instructor, course: Course}) {
	const rmp = useAPI<[RMPInfo], [string]>("rmp", [x.name]);
	const g = course.instructor[x.name]!=undefined
		? mergeGrades(Object.values(course.instructor[x.name])) : null;

	const meter = (v: number|null, type: "gpa"|"rmp") => {
		let inner;
		if (v==null) {
			inner = <>
				<div className="relative" >
					<div className='absolute right-0 left-0 top-0 bottom-0 p-2 backdrop-blur-sm text-center z-10'>
						<p className='text-zinc-200 text-md font-bold text-center mt-2'>No data for {x.name}</p>
					</div>

					<CircProg c="white" valueLabel="?" value={0} />
				</div>
			</>;
		} else {
			inner = <CircProg c={gpaColor(type=="gpa" ? v : v-1)}
				valueLabel={v.toFixed(1)} value={v}
				minValue={type=="gpa" ? 0 : 1} maxValue={type=="gpa" ? 4 : 5} />;
		}

		return <div className="relative flex flex-col h-full w-full mx-auto p-4 rounded-xl gap-2 hover:scale-[1.05] transition-all items-center" >
			{inner}
			
			<h3 className="text-lg font-display font-bold text-center" >
				{type=="rmp" ? "RateMyProfessors rating" : "Average GPA"}
			</h3>
		</div>;
	};

	const rmpUrl = rmp?.res?.[0]?.rmpUrl;
	const nrating = rmp?.res?.[0]?.numRatings;

	return <div className="flex flex-row md:gap-4 gap-2">
		<a href={
			rmpUrl ?? `https://www.ratemyprofessors.com/search/professors/783?q=${firstLast(x.name)}`
		} target="_blank" >
			{meter(nrating==0 ? null : (rmp?.res?.[0]?.avgRating ?? null), "rmp")}
		</a>
		{meter(g?.gpa ?? null, "gpa")}
	</div>;
}

export function ProfLink({x, label, className}: {x: Instructor, label?: string, className?: string}) {
	const cc = useContext(CourseContext);
	const ts = Object.entries(cc.course.sections).filter(([k,v]) => v.find(s=>
		s.instructors.includes(x))!=undefined).map(([k,v]) => k as Term);
	const secs = cc.course.sections[cc.term].filter(v => v.instructors.includes(x));

	return <Popover placement="bottom" showArrow >
		<PopoverTrigger>
			<div className={twMerge("inline-block", className)} >
				<Anchor className={className} >{label ?? x.name}</Anchor>
			</div>
		</PopoverTrigger>
		<PopoverContent className='bg-zinc-900 border-gray-800 p-2' >
			<h2 className="text-2xl font-display font-extrabold" >{x.name}</h2>
			{x.primary && <p className="text-sm text-gray-400 font-bold">Primary instructor</p>}

			<ProfMeters x={x} course={cc.course} />

			<div className="w-full flex-row flex items-center p-3 gap-3" >
				<p>Sections: {secs.map(s => <SectionLink section={s} >
						<Anchor>{s.section}</Anchor>
					</SectionLink>)}.</p>
				<div className="flex flex-row flex-wrap">
					{ts.map(t => <Chip className="border-cyan-400 bg-sky-800 cursor-pointer"
						onClick={()=>cc.selTerm(t)} >{formatTerm(t)}</Chip>)}
				</div>
			</div>
		</PopoverContent>
	</Popover>;
}