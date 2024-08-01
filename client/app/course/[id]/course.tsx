"use client"

import { IconArrowLeft } from "@tabler/icons-react";
import { Course, CourseId, creditStr, emptyInstructorGrade, formatTerm, Instructor, InstructorGrade, InstructorGrades, instructorsForTerm, latestTerm, mergeGrades, RMPInfo, Section, ServerInfo, Term, termIdx } from "../../../../shared/types";
import { abbr, Anchor, CatalogLinkButton, Chip, firstLast, gpaColor, LinkButton, Loading, selectProps } from "@/components/util";
import { Footer } from "@/components/footer";
import { AppCtx, AppWrapper, useAPI } from "@/components/wrapper";
import { useContext, useEffect, useMemo, useState } from "react";
import boilerexamsCourses from "../../boilerexamsCourses.json";
import boilerexams from "../../../public/boilerexams-icon.png";
import reddit from "../../../public/reddit-icon.png";
import Image from "next/image";
import { Tab, Tabs } from "@nextui-org/tabs";
import Select, { MultiValue, SingleValue } from "react-select";
import { Progress } from "@nextui-org/progress";
import React from "react";
import { ProfLink } from "@/components/proflink";
import Graph from "@/components/graph";
import { InstructorList } from "@/components/instructorlist";
import { AppTooltip, CourseContext } from "@/components/clientutil";
import { Calendar, calendarDays } from "@/components/calendar";
import { Prereqs } from "@/components/prereqs";
import { Restrictions } from "@/components/restrictions";
import { SimilarCourses } from "@/components/similar";
import { CourseChips, GPAIndicator } from "@/components/card";

function InstructorGradeView({xs,type}: {xs: Instructor[], type:"rmp"|"gpa"}) {
	const cc=useContext(CourseContext);

	let res: (RMPInfo|null)[]|null=null;
	if (type=="rmp") {
		const o=useAPI<(RMPInfo|null)[],string[]>("rmp", {data: xs.map(x=>x.name)});
		if (o==null) return <Loading/>

		res=o.res;
	}

	let out: [Instructor, number|null][] = xs.map((i,j) => {
		if (type=="gpa" && cc.course.instructor[i.name]!=undefined) {
			const g = mergeGrades(Object.values(cc.course.instructor[i.name]));
			if (g.gpa!=null) return [i,g.gpa];
		} else if (type=="rmp" && res!=null && res[j]!=null && res[j].numRatings>0) {
			return [i,res[j].avgRating];
		}

		return [i,null]
	});

	const els = out.toSorted((a,b)=>(b[1]??-1) - (a[1]??-1)).map(([i,x])=>{
		const lhs = <ProfLink x={i} className="font-semibold text-nowrap text-white"
			label={abbr(i.name, 25)} />;

		if (x==null) {
			return <React.Fragment key={i.name} >
				{lhs}
				<div className="col-span-2 flex-row flex items-center" >
					<span className="h-0.5 border-b border-dotted flex-grow mx-2" />
					<p className="col-span-2 my-auto ml-auto" >
						No {type=="rmp" ? "rating" : "grades"} available
					</p>
				</div>
			</React.Fragment>;
		}

		const c = gpaColor(type=="gpa" ? x : x-1);

		return <React.Fragment key={i.name} >
			{lhs}

			<div className="flex flex-row items-center" >
				<Progress value={x} minValue={type=="gpa" ? 0 : 1} maxValue={type=="gpa" ? 4 : 5} classNames={{
					indicator: `bg-${c}`
				}} />
			</div>

			<span className={`bg-${c} px-2 py-1 rounded-lg my-auto font-black font-display text-xl`} >
				{x.toFixed(1)}
			</span>
		</React.Fragment>;
	});

	return <div className="grid gap-2 grid-cols-[4fr_10fr_1fr] items-center" >
		{els}
	</div>;
}

function InstructorSemGPA({xs, all}: {xs: Instructor[], all: Instructor[]}) {
	const cc= useContext(CourseContext);
	const idx = termIdx(cc.term);
	const sems = [...new Set(...all.map(x => cc.course.instructor[x.name])
		.filter(x=>x!=undefined).map(x=>Object.keys(x) as Term[]))]
		.filter(x => termIdx(x)<=idx).slice(-5).toSorted((a,b) => termIdx(b)-termIdx(a));
	const vs = xs.map((x): [Instructor, InstructorGrades] => [
			x, cc.course.instructor[x.name] ?? {}
		]).map(([i,x]): [Instructor, [Term, number|null, number][], number] => [
			i, sems.map(sem => [sem, x[sem]?.gpa ?? null, x[sem]?.numSections ?? 0]),
				sems.reduce((a,v) => a+(x[v]?.gpa!=null ? 1 : 0), 0)
		]).toSorted((a,b) => b[2]-a[2]);

	if (sems.length==0) {
		return <p className='text-white text-xl font-bold'>No data available</p>;
	}
	
	return <div>
		{vs.map(([i, x]) => (
			<div key={i.name} className='flex flex-col mt-5'>
				<ProfLink className='text-white font-bold text-xl' x={i} />
				<div className='grid grid-flow-col auto-cols-fr justify-stretch'>
					{x.map(([sem, gpa, sections]) => (
						<div key={sem} className='flex flex-col mt-2'>
							<div className={`flex flex-col h-12 items-center justify-center py-5 ${
								gpa!=null ? `bg-${gpaColor(gpa)}` : ""
							}`} >
								<p className='text-white text-xl font-display font-black'>{gpa?.toFixed(1) ?? "?"}</p>
								<p className='text-zinc-200 text-xs'>{sections} section{sections==1?"":"s"}</p>
							</div>
							<Anchor onClick={() => cc.selTerm(sem)}
								className='text-zinc-400 text-sm justify-center'>{formatTerm(sem)}</Anchor>
						</div>
					))}
				</div>
			</div>
		))}
	</div>;
}

function CourseDetail({course, id, info}: {course: Course, id:string, info: ServerInfo}) {
	const latest = latestTerm(course)!;
	const [termO, setTerm] = useState<Term|null>(null);
	const term = termO ?? latest;

	useEffect(()=>{
		const searchTerm = new URL(window.location.href).searchParams.get("term");
		if (searchTerm!=null && Object.keys(info.terms).includes(searchTerm))
			setTerm(searchTerm as Term);
	}, []);

	useEffect(()=> {
		if (termO!=null)
			window.history.replaceState(null,"",termO==latest ? "?" : `?term=${termO}`);
	}, [termO]);

	const instructors = instructorsForTerm(course, term) ?? [];

	const [instructorSearch, setInstructorSearch] = useState("");
	const [selectedInstructors, setSelInstructors] = useState<Instructor[]>([]);

	const graphGrades: [Instructor,InstructorGrade][] = useMemo(() =>
		selectedInstructors.map(x =>
			[x,course.instructor[x.name]==undefined ? emptyInstructorGrade
				: mergeGrades(Object.values(course.instructor[x.name]))]
		), [selectedInstructors, term, course]);

	const wrapProfStats = (title: React.ReactNode, inner: React.ReactNode) => (<>
		<h2 className="text-2xl font-display font-extrabold mb-5" >{title}</h2>
		<input type="text" placeholder="Filter instructors..."
			value={instructorSearch} onChange={v => setInstructorSearch(v.target.value)}
			className="text-white text-md bg-neutral-950 w-full p-2 border-2 border-zinc-900 focus:outline-none focus:border-blue-500 transition duration-300 rounded-lg mb-5" >
		</input>
		<div className="max-h-[34rem] overflow-y-scroll" >
			{inner}
		</div>
	</>);

	const simp = (x: string) => x.toLowerCase().replace(/[^a-z]/g, "");
	const searchInstructors = useMemo(() => {
		const v = simp(instructorSearch);
		return instructors.filter(x => simp(x.name).includes(v));
	}, [instructors, instructorSearch]);

	const [section, setSection] = useState<Section|null>(null);
	const app = useContext(AppCtx);

	const days = calendarDays(course, term);
	const smallCalendar = days.length<=3;

	const catalog=`https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=${info.terms[term]!.id}&subj_code_in=${course.subject}&crse_numb_in=${course.course}`;

	return <CourseContext.Provider value={{
		course, id, term, section, info, selTerm(term) {
			if (term in course.sections) setTerm(term);
			else app.open({type: "error", name: "Term not available",
				msg: "We don't have data for this semester"})
		}, selSection:setSection
	}} ><div className={`flex flex-col h-dvh container mx-auto p-5 mt-5 gap-5`}>
		<div className="flex md:flex-row flex-col gap-4 items-stretch relative" >

			{/* Left half of panel */}
			<div className="flex flex-col md:mr-3 justify-start h-full basis-5/12 md:flex-shrink-0">
				<div className='flex flex-row gap-3 align-middle'>
					<Anchor
						className='lg:mt-1 md:mt-0.5 mr-1 h-fit hover:-translate-x-0.5 transition md:absolute md:-left-10'
						onClick={app.back} >

						<IconArrowLeft size={30} />
					</Anchor>
					<p className="md:text-3xl text-2xl font-bold mb-6 font-display">{course.subject} {course.course}: {course.name}</p>
				</div>

				<div className="flex flex-col gap-4 -mt-3 mb-1">
					<div className="flex flex-row flex-wrap mb-1 items-center">

						{/* Credits Display */}
						<p className="text-sm text-gray-400 font-bold">
							{creditStr(course)}
						</p>

						{/* Separator Display */}
						<span className="mx-2 h-6 w-0.5 bg-gray-400 rounded" />
						<CourseChips/>
					</div>
					
					<div className="flex flex-wrap flex-row items-center gap-3 text-sm" >
						Data from <Select
							options={Object.keys(course.sections)
								.map((x):[number,Term]=>[termIdx(x as Term),x as Term])
								.sort((a,b)=>b[0]-a[0])
								.map(([_,x]) => ({label: formatTerm(x), value: x}))}
							value={{label: formatTerm(term), value: term}}
							onChange={(x: SingleValue<{label: string, value: Term}>) => setTerm(x!.value)}
							{...selectProps}
						/>
						<span className="text-gray-400" >
							last updated {new Date(info.terms[term]!.lastUpdated).toLocaleDateString()}
						</span>
					</div>

					{term!=latest && <div className="border border-zinc-700 bg-zinc-900 p-2 rounded-md" >
						<h2 className="font-bold font-display text-lg" >Note:</h2>
						<p>Most course data, except for sections and instructors, is from {formatTerm(latest)}. Fall back to the catalog for exact data from an older term.</p>
					</div>}

					<InstructorList/>
				</div>

				{/* Other Links Buttons */}
				<div className="flex flex-row flex-wrap my-2 gap-2 items-center">
					<GPAIndicator/>

					<LinkButton href={`https://www.reddit.com/r/Purdue/search/?q=${course.subject}${course.course.toString().replace(/00$/, '')} OR "${course.subject} ${course.course.toString().replace(/00$/, '')}" OR ${
							instructors.map(x => `"${firstLast(x.name)}"`).join(" OR ")
						}`} target="_blank" rel="noopener noreferrer" className="bg-orange-600 hover:bg-orange-700 transition-background duration-300 ease-out"
						icon={<Image src={reddit} alt="Reddit" className="w-full h-full" />}>

						Reddit
					</LinkButton>

					<CatalogLinkButton href={catalog} />

					{boilerexamsCourses.includes(`${course.subject}${course.course}`) &&
						<LinkButton href={`https://www.boilerexams.com/courses/${course.subject}${course.course.toString()}/topics`}
							className="bg-yellow-500 hover:bg-yellow-600 transition-all duration-300 ease-out"
							icon={<Image src={boilerexams} alt="Boilerexams" className="filter w-full h-full" />} >

							Boilerexams
						</LinkButton>
					}
				</div>


				{/* Description */}
				<p className="lg:text-base text-sm text-gray-200 mt-1 mb-3 break-words">{course.description}</p>
				<h1 className="lg:text-sm text-xs text-gray-400 mt-1 mb-3 break-words">Course {course.subject} {course.course} from Purdue University - West Lafayette.</h1>

				{/* Prerequisites */}
				{course.prereqs=="failed" ? <p className="text-sm text-red-700 my-3" >Failed to parse prerequisites. Please use the <Anchor href={catalog} >catalog</Anchor>.</p>
					: (course.prereqs!="none" && <>
						<h2 className="text-2xl font-display font-extrabold mb-4" >Prerequisites</h2>
						<div className="max-h-[30rem] overflow-y-scroll mb-4" >
							<Prereqs prereqs={course.prereqs} />
						</div></>)}

				<Restrictions restrictions={course.restrictions} />
			</div>
			<div className="flex flex-col flex-grow max-w-full gap-4" >
				<div className="flex flex-col" >
					<Tabs aria-label="Display" size="lg" variant="light" classNames={{
						tab: "px-4 py-1.5 border text-white rounded-xl border-zinc-900 hover:border-zinc-700 data-[selected=true]:border-blue-500 outline-none",
						cursor: "dark:bg-zinc-900",
						tabContent: "text-gray-300 hover:text-gray-50 group-data-[selected=true]:text-gray-50"
					}} >
						<Tab key="gpa" title="GPA" >
							{wrapProfStats("GPA by professor", <InstructorGradeView xs={searchInstructors} type="gpa" />)}
						</Tab>
						<Tab key="gpaSemester" title="GPA Breakdown" >
							{wrapProfStats("GPA by semester", <InstructorSemGPA xs={searchInstructors} all={instructors} />)}
						</Tab>
						<Tab key="rmp" title="Rating" >
							{wrapProfStats("RateMyProfessor ratings", <InstructorGradeView xs={searchInstructors} type="rmp" />)}
						</Tab>
						<Tab key="grades" title="Grade distribution" >
							<p className="mb-2" >Select instructors:</p>
							<Select isMulti options={instructors}
								value={selectedInstructors} getOptionLabel={x => x.name} getOptionValue={x=>x.name}
								onChange={(x: MultiValue<Instructor>)=>setSelInstructors(x as Instructor[])}
								isOptionDisabled={(x: Instructor) =>
									course.instructor[x.name]==undefined
								}
								{...selectProps}
							/>

							<Graph grades={graphGrades} />
						</Tab>
					</Tabs>
				</div>

				{smallCalendar && <Calendar />}
			</div>
		</div>

		{!smallCalendar && <Calendar />}
		<SimilarCourses/>

		<div className='mt-auto'>
			<Footer />
		</div>
	</div></CourseContext.Provider>;
}

export function CourseDetailApp(props: CourseId&{info: ServerInfo}) {
	return <AppWrapper><CourseDetail {...props} /></AppWrapper>
}