import { useContext } from "react";
import { CourseContext } from "./clientutil";
import { Section, validDays } from "../../shared/types";
import { SectionLink } from "./sectionlink";

function minutesInDay(t: string) {
	const re = /(\d+):(\d+) (am|pm)/;
	const m = t.match(re);
	if (m==null) throw "invalid time";

	return 60*(Number.parseInt(m[1])%12)+Number.parseInt(m[2])+(m[3]=="pm" ? 12*60 : 0);
}

export function Calendar() {
	const cc = useContext(CourseContext);
	const secs = cc.course.sections[cc.term];
	const days = new Set(secs.flatMap(x => x.times).map(x=>x.day));
	const sortedDays = [...days].map(x=>validDays.indexOf(x))
		.sort().map(x=>validDays[x]);

	return <div className='flex flex-col md:flex-row flex-nowrap gap-2 w-full rounded-xl bg-zinc-900 p-2 md:p-4'>
		{sortedDays.map(d => {
			const inD = secs.flatMap(x=>x.times.filter(y=>y.day==d && y.time!="TBA")
				.map((t):[number, string, string, Section]=> {
					const r = t.time.split(" - ");
					if (r.length!=2) throw "invalid time range";
					return [minutesInDay(r[0]), r[0], r[1], x];
				})).sort((a,b) => a[0]-b[0]);

			return <div className='last:border-r-0 md:border-r-2 border-gray-500 flex-1 pr-2'>
					<p className='relative text-right text-gray-500'>{d}</p>
					<div className="overflow-y-auto overflow-x-hidden max-h-40 md:max-h-80 lg:h-full">
						{ inD.map(([_,start,end,sec]) =>
							<SectionLink key={sec.crn} section={sec} className={`w-full ${cc.section==sec ? "bg-amber-600" : "bg-zinc-700 hover:bg-zinc-600"} py-1 px-2 rounded-md transition-all mt-1 first:mt-0 cursor-pointer`} >
								<p className="font-bold font-display" >{sec.scheduleType}</p>
								<p className="text-xs text-gray-400" >{sec.section} - {start}</p>
							</SectionLink>
						) }
					</div>
			</div>;
		})}
	</div>;
}