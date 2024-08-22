import { useContext } from "react";
import { Course, Day, Section, SmallCourse, Term, validDays } from "../../shared/types";
import { AppTooltip, SelectionContext, useMd } from "./clientutil";
import { InstructorList } from "./instructorlist";
import { CatalogLinkButton } from "./util";
import { CourseLink } from "./card";
import { useInfo } from "./wrapper";

export function SectionLink({term, course, children, section, className}: {
	term: Term, course: SmallCourse, children: React.ReactNode, section: Section, className?: string
}) {
	const selCtx=useContext(SelectionContext);
	const byTimes = new Map<string,Day[]>();

	for (const x of section.times)
		byTimes.set(x.time, [...(byTimes.get(x.time) ?? []), x.day]);

	let perm=null;
	if (section.permissionOfDept) perm="department";
	if (section.permissionOfInstructor)
		perm=perm==null ? "instructor" : `${perm} and instructor`;
	
	const mq = useMd();
	return <AppTooltip placement={mq ? "right" : "top"}
		onChange={x => {
			if (x) selCtx.selSection(section);
			else if (section==selCtx.section) selCtx.selSection(null);
		}}
		content={
			<div className="flex flex-col p-2 items-start max-w-60" >
				<h3 className="font-display font-bold text-lg" >
					<CourseLink type="course" course={course} />
				</h3>
				{section.name && <h3 className="font-bold text-xl" >
					{section.name}
				</h3>} 
				<h3 className={`font-display font-bold ${section.name==undefined ? "text-xl" : "text-lg"}`} >
					Section {section.section}
				</h3>
				<p className="text-gray-300 text-sm mb-3" >CRN {section.crn}</p>

				{[...byTimes.entries()].map(([k,v]) =>
					<p key={k} >
						<b>{v.map(x=>validDays.indexOf(x)).sort().map(i=>validDays[i]).join("")}</b>, {k}
					</p>
				)}

				<div className="flex flex-col gap-3 mt-3 items-start" >
					<InstructorList whomst={section.instructors} course={course} term={term} />
					<p>{section.dateRange.map(x => new Date(x).toLocaleDateString()).join(" to ")}</p>

					<p>
						<span className="text-gray-400 font-bold text-xs mr-2">Enrollment:</span>
						{section.seats.used}/{section.seats.left+section.seats.used}
					</p>

					{(section.waitlist.left>0 || section.waitlist.used>0) && <p>
						<span className="text-gray-400 font-bold text-xs mr-2">Waitlist:</span>
						{section.waitlist.used}/{section.waitlist.left+section.waitlist.used}
					</p>}

					{perm!=null && <p className="font-bold text-gray-200 text-sm" >
						Permission of {perm} required
					</p>}

					<CatalogLinkButton href={`https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_detail_sched?term_in=${useInfo().terms[term]!.id}&crn_in=${section.crn}`} />
				</div>
			</div>
		} className={className} >
			{children}
		</AppTooltip>;
}