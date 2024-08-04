import { useContext, useState } from "react"
import { Anchor } from "./util"
import { formatTerm, CourseInstructor, SmallCourse, Term } from "../../shared/types";
import { ProfLink } from "./proflink";
import { twMerge } from "tailwind-merge";

export function InstructorList({term, short, className, whomst: instructors, course}: {
	term: Term, short?: boolean, className?: string,
	whomst: CourseInstructor[], course: SmallCourse
}) {
	if (instructors.length==0) return <></>;

	const [showMoreInstructors, setShowMoreInstructors] = useState(false);
	const curInstructors = showMoreInstructors ? instructors : instructors.slice(0,3);

	return <div className={twMerge("flex flex-wrap flex-row lg:text-sm text-sm mt-1 font-medium items-center gap-1", className)} >
		{!short && <span className="text-gray-400 font-bold text-xs mr-2">{formatTerm(term)} Instructors: </span>}

		{curInstructors.map((prof, i) => (
			<span key={i}>
				<ProfLink x={prof} course={course} term={term} />
				{i < curInstructors.length - 1 && ","}
			</span>
		))}

		{instructors.length>3 && (short ? <span> and {instructors.length-3} more</span> :
			<Anchor onClick={() => setShowMoreInstructors(!showMoreInstructors)}
				className="text-blue-300" >
				{curInstructors.length<instructors.length ? `...show ${instructors.length-3} more` : "Show less"}</Anchor>)}
	</div>;
}