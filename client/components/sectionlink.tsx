import { Popover, PopoverContent, PopoverTrigger } from "@nextui-org/popover";
import { Tooltip } from "@nextui-org/tooltip";
import { PointerEvent, useContext, useEffect, useState } from "react";
import { Day, Section, validDays } from "../../shared/types";
import { AppTooltip, CourseContext, useMd, useMediaQuery } from "./clientutil";
import { InstructorList } from "./instructorlist";
import { twMerge } from "tailwind-merge";
import { CatalogLinkButton, LinkButton } from "./util";

export function SectionLink({children, section, className}: {children: React.ReactNode, section: Section, className?: string}) {
	const cc=useContext(CourseContext);
	const byTimes = new Map<string,Day[]>();

	for (const x of section.times)
		byTimes.set(x.time, [...(byTimes.get(x.time) ?? []), x.day]);
	
	const mq = useMd();
	return <AppTooltip placement={mq ? "right" : "top"}
		onChange={x => {
			if (x) cc.selSection(section);
			else if (section==cc.section) cc.selSection(null);
		}}
		content={
			<div className="flex flex-col p-2 max-w-52 items-start" >
				<h3 className="font-display font-bold text-lg" >Section {section.section}</h3>
				<p className="text-gray-300 text-sm mb-3" >CRN {section.crn}</p>

				{[...byTimes.entries().map(([k,v]) =>
					<p key={k} >
						<b>{v.map(x=>validDays.indexOf(x)).sort().map(i=>validDays[i]).join("")}</b>, {k}
					</p>
				)]}

				<div className="flex flex-col gap-3 mt-3 items-start" >
					<InstructorList whomst={section.instructors} />
					<p>{section.dateRange.map(x => new Date(x).toLocaleDateString()).join(" to ")}</p>

					<p>
						<span className="text-gray-400 font-bold text-xs mr-2">Enrollment:</span>
						{section.seats.used}/{section.seats.left+section.seats.used}
					</p>

					{(section.waitlist.left>0 || section.waitlist.used>0) && <p>
						<span className="text-gray-400 font-bold text-xs mr-2">Waitlist:</span>
						{section.waitlist.used}/{section.waitlist.left+section.waitlist.used}
					</p>}

					<CatalogLinkButton href={`https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_detail_sched?term_in=${cc.info.terms[cc.term]!.id}&crn_in=${section.crn}`} />
				</div>
			</div>
		} className={className} >
			{children}
		</AppTooltip>;
}