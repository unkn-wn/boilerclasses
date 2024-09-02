"use client"

import { Course, CourseId, creditStr, emptyInstructorGrade, formatTerm, CourseInstructor, InstructorGrade, InstructorGrades, mergeInstructors, latestTerm, mergeGrades, RMPInfo, Section, ServerInfo, Term, termIdx, toSmallCourse, SmallCourse } from "../../../types";
import { abbr, Anchor, CatalogLinkButton, firstLast, LinkButton, Loading, RedditButton, selectProps } from "@/components/util";
import { Footer } from "@/components/footer";
import { AppCtx, AppWrapper, setAPI, useAPI, useInfo } from "@/components/wrapper";
import { useContext, useEffect, useMemo, useState } from "react";
import boilerexamsCourses from "../../boilerexamsCourses.json";
import boilerexams from "/public/boilerexams-icon.png";
import Image from "next/image";
import { Tab, Tabs } from "@nextui-org/tabs";
import Select, { MultiValue } from "react-select";
import { ProfLink } from "@/components/proflink";
import Graph from "@/components/graph";
import { InstructorList } from "@/components/instructorlist";
import { BackButton, BarsStat, NameSemGPA, searchState, SelectionContext, simp, tabProps, TermSelect, useMd, WrapStat } from "@/components/clientutil";
import { Calendar, calendarDays } from "@/components/calendar";
import { Prereqs } from "@/components/prereqs";
import { Restrictions } from "@/components/restrictions";
import { SimilarCourses } from "@/components/similar";
import { CourseChips, GPAIndicator } from "@/components/card";

const useSmall = (cid: CourseId) => useMemo(() => toSmallCourse(cid), [cid.id]);

function InstructorGradeView({ xs, type, cid, term }: { xs: CourseInstructor[], cid: CourseId, term: Term, type: "rmp" | "gpa" }) {
	let res: (RMPInfo | null)[] | null = null;
	const small = useSmall(cid);
	const isMd = useMd();
	if (type == "rmp") {
		const o = useAPI<(RMPInfo | null)[], string[]>("rmp", { data: xs.map(x => x.name) });
		if (o == null) return <Loading />

		res = o.res;
	}

	let out: [CourseInstructor, number | null][] = xs.map((i, j) => {
		if (type == "gpa" && cid.course.instructor[i.name] != undefined) {
			const g = mergeGrades(Object.values(cid.course.instructor[i.name]));
			if (g.gpa != null) return [i, g.gpa];
		} else if (type == "rmp" && res != null && res[j] != null && res[j].numRatings > 0) {
			return [i, res[j].avgRating];
		}

		return [i, null]
	});

	return <BarsStat lhs={i =>
		<ProfLink x={i} className="font-semibold text-nowrap text-white"
			course={small} term={term}
			label={abbr(i.name, isMd ? 35 : 20)} />
	} className="grid-cols-[4fr_10fr_1fr] "
		vs={out} type={type} />
}

function InstructorSemGPA({ xs, term, cid }: { xs: CourseInstructor[], term: Term, cid: CourseId }) {
	const idx = termIdx(term);

	const vs = xs.map((x): [CourseInstructor, InstructorGrades] => [
		x, cid.course.instructor[x.name] ?? {}
	]).map(([i, x]): [CourseInstructor, [Term, number | null, number][]] => [
		i, Object.entries(x).filter(([sem, v]) => termIdx(sem as Term) <= idx)
			.map(([sem, v]) => [sem as Term, v?.gpa ?? null, v?.numSections ?? 0]),
	]);

	const small = useSmall(cid);
	return <NameSemGPA vs={vs} lhs={i =>
		<ProfLink className='text-white font-bold text-xl' x={i} course={small} term={term} />
	} />;
}

function CourseDetail(cid: CourseId) {
	const latest = latestTerm(cid.course)!;
	const [term, setTerm] = searchState<Term>(latest, (p) => p.get("term") as Term | null,
		(x) => x == latest ? null : new URLSearchParams([["term", x]]))

	const course = cid.course;

	const [instructorSearch, setInstructorSearch] = useState("");

	const small = useSmall(cid);
	const instructors = small.termInstructors[term] ?? [];

	const searchInstructors = useMemo(() => {
		const v = simp(instructorSearch);
		return instructors.filter(x => simp(x.name).includes(v));
	}, [term, instructorSearch]);

	const firstInstructor = instructors.find(x => course.instructor[x.name] !== undefined);
	const [selectedInstructors, setSelInstructors] = useState<CourseInstructor[]>(
		firstInstructor == undefined ? [] : [firstInstructor]
	);

	const graphGrades: [string, InstructorGrade][] = useMemo(() =>
		selectedInstructors.map(x =>
			[x.name, course.instructor[x.name] == undefined ? emptyInstructorGrade
				: mergeGrades(Object.values(course.instructor[x.name]))]
		), [selectedInstructors, term, course]);

	const [section, setSection] = useState<Section | null>(null);
	const app = useContext(AppCtx);

	const days = calendarDays(course, term);
	const smallCalendar = days.length <= 3;
	const calSections = course.sections[term].map((x): [SmallCourse, Section] => [small, x]);

	const catalog = `https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=${useInfo().terms[term]!.id}&subj_code_in=${course.subject}&crse_numb_in=${course.course}`;

	const statProps = { search: instructorSearch, setSearch: setInstructorSearch, searchName: "instructors" };

	const gradesForTerm = useMemo(() =>
		mergeGrades(Object.values(course.instructor).map(x => x[term] ?? emptyInstructorGrade)), [term]);

	return <SelectionContext.Provider value={{
		selTerm(term) {
			if (term in course.sections) setTerm(term);
			else app.open({
				type: "error", name: "Term not available",
				msg: "We don't have data for this semester"
			})
		}, selSection: setSection, section
	}} ><>
			<div className="flex lg:flex-row flex-col gap-4 items-stretch relative" >

				{/* Left half of panel */}
				<div className="flex flex-col md:mr-3 justify-start h-full basis-5/12 md:flex-shrink-0">
					<BackButton>{course.subject} {course.course}: {course.name}</BackButton>

					<div className="flex flex-col gap-4 -mt-3 mb-1">
						<div className="flex flex-row flex-wrap mb-1 items-center">

							{/* Credits Display */}
							<p className="text-sm text-gray-400 font-bold">
								{creditStr(course)}
							</p>

							{/* Separator Display */}
							<span className="mx-2 h-6 w-0.5 bg-gray-400 rounded" />
							<CourseChips course={small} />
						</div>

						<TermSelect term={term} setTerm={setTerm} terms={Object.keys(course.sections) as Term[]} name="Data" />

						{term != latest && <div className="border border-zinc-700 bg-zinc-900 p-2 rounded-md" >
							<h2 className="font-bold font-display text-lg" >Note:</h2>
							<p>Most course data, except for sections and instructors, is from {formatTerm(latest)}. Fall back to the catalog for exact data from an older term.</p>
						</div>}

						<InstructorList course={small} term={term} whomst={instructors} />
					</div>

					{/* Other Links Buttons */}
					<div className="flex flex-row flex-wrap my-2 gap-1 items-center">
						{gradesForTerm.gpa != null ?
							<GPAIndicator grades={gradesForTerm} tip={`Averaged over ${gradesForTerm.gpaSections} section${gradesForTerm.gpaSections == 1 ? "" : "s"} from ${formatTerm(term)}`} />
							: <GPAIndicator grades={small.grades} />
						}

						<RedditButton keywords={[
							`${course.subject}${course.course.toString().replace(/00$/, '')}`,
							...instructors.map(x => `"${firstLast(x.name)}"`)
						]} />

						<CatalogLinkButton href={catalog} />

						{boilerexamsCourses.includes(`${course.subject}${course.course}`) &&
							<LinkButton href={`https://www.boilerexams.com/courses/${course.subject}${course.course.toString()}/topics`}
								className="bg-yellow-500 hover:bg-yellow-600 transition-all duration-300 ease-out"
								icon={<Image src={boilerexams} alt="Boilerexams" className="filter w-auto h-full" />} >

								Boilerexams
							</LinkButton>
						}
					</div>


					{/* Description */}
					<p className="lg:text-base text-sm text-gray-200 mt-1 mb-3 break-words">{course.description}</p>
					<h1 className="lg:text-sm text-xs text-gray-400 mt-1 mb-3 break-words">Course {course.subject} {course.course} from Purdue University - West Lafayette.</h1>

					{/* Prerequisites */}
					{course.prereqs == "failed" ? <p className="text-sm text-red-700 my-3" >Failed to parse prerequisites. Please use the <Anchor href={catalog} >catalog</Anchor>.</p>
						: (course.prereqs != "none" && <>
							<h2 className="text-2xl font-display font-extrabold mb-4" >Prerequisites</h2>
							<div className="max-h-[30rem] overflow-y-scroll mb-4" >
								<Prereqs prereqs={course.prereqs} />
							</div></>)}

					<Restrictions restrictions={course.restrictions} />
				</div>
				<div className="flex flex-col flex-grow max-w-full gap-4" >
					<div className="flex flex-col" >
						<Tabs {...tabProps} >
							<Tab key="gpa" title="GPA" >
								<WrapStat title="GPA by professor" {...statProps} >
									<InstructorGradeView xs={searchInstructors} type="gpa" cid={cid} term={term} />
								</WrapStat>
							</Tab>
							<Tab key="gpaSemester" title="GPA Breakdown" >
								<WrapStat title="GPA by semester" {...statProps} >
									<InstructorSemGPA xs={searchInstructors} cid={cid} term={term} />
								</WrapStat>
							</Tab>
							<Tab key="rmp" title="Rating" >
								<WrapStat title="RateMyProfessor ratings" {...statProps} >
									<InstructorGradeView xs={searchInstructors} type="rmp" cid={cid} term={term} />
								</WrapStat>
							</Tab>
							<Tab key="grades" title="Grade distribution" >
								<p className="mb-2" >Select instructors:</p>
								<Select isMulti options={instructors}
									value={selectedInstructors} getOptionLabel={x => x.name} getOptionValue={x => x.name}
									onChange={(x: MultiValue<CourseInstructor>) => setSelInstructors(x as CourseInstructor[])}
									isOptionDisabled={(x: CourseInstructor) => course.instructor[x.name] == undefined}
									{...selectProps}
								/>

								<Graph title="Average grades by instructor" grades={graphGrades} />
							</Tab>
						</Tabs>
					</div>

					{smallCalendar && <Calendar sections={calSections} days={days} term={term} />}
				</div>
			</div>

			{!smallCalendar && <Calendar sections={calSections} days={days} term={term} />}

			<SimilarCourses id={cid.id} />

			<div className='mt-auto'>
				<Footer />
			</div>
		</></SelectionContext.Provider>;
}

export function CourseDetailApp(props: CourseId & { info: ServerInfo }) {
	useEffect(() => {
		setAPI<Course, number>("course", { data: props.id, result: props.course })
	});

	return <AppWrapper info={props.info} ><CourseDetail {...props} /></AppWrapper>
}