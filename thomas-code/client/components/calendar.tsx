import { useContext } from "react";
import { SelectionContext } from "./clientutil";
import { Course, CourseId, Day, Section, ServerInfo, SmallCourse, Term, validDays } from "../../shared/types";
import { SectionLink } from "./sectionlink";
import { abbr } from "./util";
import React from "react";

function minutesInDay(t: string) {
	const re = /(\d+):(\d+) (am|pm)/;
	const m = t.match(re);
	if (m==null) throw "invalid time";

	return 60*(Number.parseInt(m[1])%12)+Number.parseInt(m[2])+(m[3]=="pm" ? 12*60 : 0);
}

export function calendarDays(course: Course, term: Term) {
	const secs = course.sections[term];
	const days = [...new Set(secs.flatMap(x => x.times).map(x=>x.day))];
	return days;
}

export function Calendar({days, sections: secs, term}: {days: Day[], sections: [SmallCourse, Section][], term: Term}) {
	const selCtx = useContext(SelectionContext);

	const sortedDays = days
		.map(x=>validDays.indexOf(x))
		.sort().map(x=>validDays[x]);
 
	return <div className='flex flex-col md:flex-row flex-nowrap gap-2 rounded-xl bg-zinc-900 p-2 md:p-4'>
		{sortedDays.length==0 ?
			<h2 className="font-display font-bold text-xl mx-auto" key="none" >
				Empty course schedule
			</h2>
		: sortedDays.map(d => {
			const inD = secs.flatMap(x=>x[1].times.filter(y=>y.day==d && y.time!="TBA")
				.map((t):[number, string, string, SmallCourse, Section]=> {
					const r = t.time.split(" - ");
					if (r.length!=2) throw "invalid time range";
					return [minutesInDay(r[0]), r[0], r[1], ...x];
				})).sort((a,b) => a[0]-b[0]);

			return <div key={d} className='last:border-r-0 md:border-r-2 border-gray-500 flex-1 pr-2'>
					<p className='relative text-right text-gray-500'>{d}</p>
					<div className="overflow-y-auto overflow-x-hidden max-h-40 md:max-h-80 lg:h-full">
						{ inD.map(([_,start,end,c,sec], i) => {
							const hi = sec.crn==selCtx.section?.crn;

							let name = sec.instructors.find(x=>x.primary)?.name;
							const content = [sec.section, start];

							if (name!=undefined) {
								name = abbr(name, 20);
								content.push(sec.scheduleType.slice(0,3));
							}

							return <SectionLink key={i} term={term} section={sec} course={c}
								className={`w-full ${hi ? "bg-amber-600" : "bg-zinc-700 hover:bg-zinc-600"} py-1 px-2 rounded-md transition-all mt-1 first:mt-0 cursor-pointer`} >

								<p className="font-bold font-display" >{name ?? sec.scheduleType}</p>
								{sec.name && <p className="font-bold font-display text-sm" >{sec.name}</p>}
								<div className={`text-xs flex flex-row items-stretch gap-1 ${hi ? "text-white" : "text-gray-400"}`} >
									{content.map((x,i) => <React.Fragment key={i} >
										<span>{x}</span>
										{i<content.length-1 && <div className={`mx-1 w-px my-0.5 ${hi ? "bg-white" : "bg-gray-400"}`} ></div>}
									</React.Fragment>)}
								</div>
							</SectionLink>
						}) }
					</div>
			</div>;
		})}
	</div>;
}