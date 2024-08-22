import { IconInfoTriangleFilled, IconSchool } from "@tabler/icons-react";
import { CourseLikePreReq, PreReq, PreReqs } from "../../shared/types";
import { CourseLink, CourseLinkPopup } from "./card";
import { AppTooltip, useMd } from "./clientutil";
import { Anchor } from "./util";
import React from "react";

function PrereqCourseLikeLink({prereq}: {prereq: CourseLikePreReq}) {
	let txt,extra=null,kind;
	let courseLinkProps: {subject: string, num: number}|null=null;

	switch (prereq.type) {
		case "attribute": txt=prereq.attribute; kind="courses with this attribute"; break;
		case "course":
			txt=`${prereq.subject} ${prereq.course}`;
			kind="this course";
			const num = Number.parseInt(prereq.course);
			if (isFinite(num)) courseLinkProps={subject: prereq.subject, num};
			break;
		case "courseRange": txt=`${prereq.subject} ${prereq.course}-${prereq.courseTo}`; kind="courses in this range"; break;
		case "subject": txt=`${prereq.subject}`; kind="this subject"; break;
	}

	let what=null;
	if (prereq.grade!=null) what=prereq.grade;
	else if (prereq.minGPA!=null) what=`${prereq.minGPA.toFixed(1)} GPA`;
	else if (prereq.minCredits!=null) what=`${prereq.minCredits} credit${prereq.minCredits==1 ? "" : "s"}`;

	const courseExtra = <div className="flex flex-col gap-2 items-start pl-0" >
		{[
			prereq.grade!=null && <><span className="font-extrabold font-display" >{prereq.grade}</span> or higher</>,
			prereq.minGPA!=null && <><span className="font-extrabold font-display" >{prereq.minGPA.toFixed(1)}</span> GPA</>,
			prereq.minCredits!=null && <><span className="font-extrabold font-display" >{prereq.minCredits}</span> credits in {kind}</>,
			<span className="font-extrabold" >{`Can${prereq.concurrent ? "":"'t"} be taken concurrently`}</span>
		].map((x,i) => {
			if (x==false) return <React.Fragment key={i} />
			return <div key={i} className="flex flex-row gap-2 items-center" >
				<IconInfoTriangleFilled className="text-xs" /> {x}
			</div>
		})}
	</div>;

	const mq = useMd();
	return <AppTooltip placement={mq ? "right" : "bottom"} content={
		courseLinkProps==null ? <div className="p-3" >
			<h2 className="text-2xl font-display font-extrabold mb-2" >{extra==null ? txt : extra}</h2>
			{courseExtra}
		</div> : <CourseLinkPopup type="lookup" {...courseLinkProps} extra={courseExtra} />
	} >
		<Anchor className="text-white" >
			{what!=null ? <>
				<span className="font-extrabold font-display" >{what}</span> in {txt}
			</> : txt}
		</Anchor>
	</AppTooltip>
}

function Prereq({prereq}: {prereq: PreReq}) {
	switch (prereq.type) {
		case "studentAttribute": return <span>
			Student attribute {prereq.attr}
		</span>;
		case "gpa": return <span>
			GPA of <span className="font-extrabold font-display" >{prereq.minimum.toFixed(1)}</span> or higher
		</span>;
		case "credits": return <span>
			At least <span className="font-extrabold font-display" >{prereq.minimum}</span> credits
		</span>;
		case "test": return <span>
			Score of <span className="font-extrabold font-display" >{prereq.minScore}</span> or higher on the {prereq.test}
		</span>;
		case "range": return <span>
			Between a {prereq.min} and {prereq.max} in {prereq.what}
		</span>;
		default:
			return <PrereqCourseLikeLink prereq={prereq} />
	}
}

export function Prereqs({prereqs, isChild}: {prereqs: PreReqs, isChild?: boolean}) {
	if (prereqs.type=="leaf") return <div className="flex flex-row gap-2 pr-2" >
		<IconSchool/>
		<Prereq prereq={prereqs.leaf} />
	</div>;

	if (prereqs.type=="and" && !isChild && !prereqs.vs.some(p=>p.type=="or")) {
		return <div className="flex flex-col gap-2" >
			{prereqs.vs.map((v,i) => <Prereqs isChild key={i} prereqs={v} />)}
		</div>
	}

	return <div className={`flex flex-col relative border ${prereqs.type=="and" ? "border-amber-500 bg-amber-800" : "border-sky-300 bg-sky-900"} py-4 pl-3 mt-4 rounded-l-xl ${
			isChild ? "border-r-0" : "rounded-r-xl" }`} >
		<div className={`absolute left-10 top-0 transform -translate-y-1/2 py-1 px-4 rounded-t-md ${prereqs.type=="and" ? "bg-amber-800" : "bg-sky-900"}`} >
		<div className={`absolute top-0 bottom-1/2 left-0 right-0 border-t border-l border-r rounded-t-md ${prereqs.type=="and" ? "border-amber-500" : "border-sky-300"}`} ></div>
				<span>{prereqs.type=="and" ? "All of" : "One of"}</span>
		</div>

		<div className="flex flex-col gap-2" >
			{prereqs.vs.map((v,i) => <Prereqs isChild key={i} prereqs={v} />)}
		</div>
	</div>
}