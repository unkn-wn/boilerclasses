import { useContext, useState } from "react"
import { Anchor } from "./util"
import { formatTerm, Instructor, instructorsForTerm } from "../../shared/types";
import { ProfLink } from "./proflink";
import { CourseContext } from "./clientutil";
import { twMerge } from "tailwind-merge";

export function InstructorList({short, className, whomst}: {short?: boolean, className?: string, whomst?: Instructor[]}) {
	const cc = useContext(CourseContext);
	const instructors = whomst ?? (instructorsForTerm(cc.course, cc.term) ?? []);
	const [showMoreInstructors, setShowMoreInstructors] = useState(false);
	const curInstructors = showMoreInstructors ? instructors : instructors.slice(0,3);

	return <div className={twMerge("flex flex-wrap flex-row lg:text-sm text-sm mt-1 font-medium items-center gap-1", className)} >
		{!short && <span className="text-gray-400 font-bold text-xs mr-2">{formatTerm(cc.term)} Instructors: </span>}

		{curInstructors.map((prof, i) => (
			<span key={i}>
				<ProfLink x={prof} />
				{i < curInstructors.length - 1 && ","}
			</span>
		))}

		{instructors.length>3 && (short ? <span> and {instructors.length-3} more</span> :
			<Anchor onClick={() => setShowMoreInstructors(!showMoreInstructors)}
				className="text-blue-300" >
				{curInstructors.length<instructors.length ? `...show ${instructors.length-3} more` : "Show less"}</Anchor>)}
	</div>;
}