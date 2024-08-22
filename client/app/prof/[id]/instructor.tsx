"use client"

import { AppCtx, AppWrapper, useInfo } from "@/components/wrapper";
import { CourseId, emptyInstructorGrade, InstructorGrade, InstructorId, latestTermofTerms, mergeGrades, Section, ServerInfo, Term, termIdx, toInstructorGrade, toSmallCourse } from "../../../../shared/types";
import { BackButton, BarsStat, NameSemGPA, searchState, SelectionContext, simp, tabProps, TermSelect, WrapStat } from "@/components/clientutil";
import { Anchor, capitalize, RedditButton, selectProps } from "@/components/util";
import { Tab, Tabs } from "@nextui-org/tabs";
import { useContext, useMemo, useState } from "react";
import { Meters } from "@/components/proflink";
import { default as Select, MultiValue } from "react-select";
import Graph from "@/components/graph";
import { CourseLink } from "@/components/card";
import { Calendar } from "@/components/calendar";
import { decodeQueryToSearchState, encodeSearchState, Search, SearchState } from "@/app/search";

export function Instructor({instructor}: {instructor: InstructorId}) {
	const i = instructor.instructor;
	const total = mergeGrades(i.grades.map(x=>toInstructorGrade(x.data)));

	const [courseSearch, setCourseSearch] = useState("");
	const [selCourse, setSelCourses] = useState<CourseId[]>([]);

	const statProps = {search:courseSearch, setSearch:setCourseSearch, searchName: "courses"};

	const allSecs: [CourseId,Term,Section][] = useMemo(()=>instructor.courses.flatMap(c=>
		Object.entries(c.course.sections)
			.flatMap(([term, secs]): [CourseId, Term, Section][] =>
				secs.filter(sec=>sec.instructors.find(j=>j.name==i.name)!==undefined).map(sec=>[
					c, term as Term, sec
				])
	)),[]);

	const defaultTerm = latestTermofTerms(allSecs.map(x=>x[1]))!;
	const [initSearch, setInitSearch] = searchState<{term: Term, search: Partial<SearchState>}>({
		term: defaultTerm, search: {instructors: [i.name]}
	}, (x) => {
		return {
			search: {...decodeQueryToSearchState(x), instructors: [i.name]},
			term: x.get("term") as Term ?? defaultTerm
		};
	}, (x) => {
		if (x==null) return;
		const p = encodeSearchState({...x.search, instructors: undefined});
		if (x.term!=defaultTerm) p.append("term", x.term);
		return p;
	});

	const [term, setTerm] = [initSearch.term, (t:Term)=>setInitSearch({...initSearch, term:t})];

	const [section, setSection] = useState<Section|null>(null);
	const idx = termIdx(term);

	const allTerms = useMemo(()=>[...new Set(allSecs.map(x=>x[1]))],[]);
	const termSecs = allSecs.filter(x=>x[1]==term);

	const termCourses = useMemo(() => 
		 instructor.courses.filter(c=>
			(Object.keys(c.course.sections) as Term[]).includes(term)), [term]);

	const courseGrades = useMemo(() => new Map(termCourses.map(c=> {
		const x = c.course.instructor[i.name];
		return [c.id,x==undefined ? emptyInstructorGrade : mergeGrades(Object.values(x))];
	})), [termCourses]);

	const searchCourses = useMemo(() => {
		const simpQ = simp(courseSearch);
		return termCourses.filter(c=>
			(Object.keys(c.course.sections) as Term[]).includes(term)
				&& simp(`${c.course.subject} ${c.course.course} ${c.course.name}`).includes(simpQ)
		);
	}, [termCourses, courseSearch]);

	const graphGrades: [string,InstructorGrade][] = useMemo(() =>
		selCourse.map((c)=>[`${c.course.subject} ${c.course.course}`, courseGrades.get(c.id)!])
	, [selCourse]);
	
	const semGPA = useMemo(() => 
		searchCourses.map((x): [CourseId, [Term,number|null,number][]]=>{
			const y = x.course.instructor[i.name];
			if (y==undefined) return [x,[]];
			return [
				x,
				Object.entries(y).filter(([term,g])=>termIdx(term as Term)<=idx)
						.map(([term,g]) => [term as Term, g.gpa, g.numSections])
			];
		}), [searchCourses, term]);

	const days = [...new Set(termSecs.flatMap(x=>x[2].times.map(y=>y.day)))];
	const smallCalendar = days.length<=3;

	const smallCourses = useMemo(()=>new Map(
		instructor.courses.map(x=>[x.id, toSmallCourse(x)])
	), [])
	const cal = <>
		<TermSelect term={term} setTerm={setTerm} terms={allTerms} name="Schedule" />
		<Calendar days={days} sections={termSecs.map(x=>[smallCourses.get(x[0].id)!,x[2]])} term={term} />
	</>;

	const main=<>
		<div className="flex lg:flex-row flex-col gap-4 items-stretch relative" >
			<div className="flex flex-col md:mr-3 justify-start items-start h-full basis-5/12 md:flex-shrink-0">
				<BackButton>
					{i.name}

					{i.nicknames.length>0 && <p className="text-medium text-gray-400 font-light" >
						aka <b className="text-white font-bold" >{i.nicknames.join("/")}</b>
					</p>}

					{i?.title && <h2 className="font-extrabold font-display text-xl mt-0" >{capitalize(i.title)}</h2>}
				</BackButton>
					
				{/* Other Links Buttons */}
				<Meters name={i.name} rmp={instructor.rmp ?? null} grade={total} className="w-full" gpaSub="(all sections)" />

				<div className="lg:text-base text-sm text-gray-200 mt-1 mb-3 break-words flex flex-col gap-1">
					{i?.dept && <p>
						<b className="font-extrabold" >Department:</b> {capitalize(i.dept)}
					</p>}

					{i?.email && <p>
						<b className="font-extrabold" >Email:</b> <Anchor href={`mailto:${i.email}`} >{i.email}</Anchor>
					</p>}

					{i?.office && <p>
						<b className="font-extrabold" >Office:</b> {i.office}
					</p>}

					{i?.site && <p className="text-lg mb-2" >
						<Anchor href={i.site} className="text-blue-200" >{i.site}</Anchor>
					</p>}

				</div>

				<RedditButton keywords={[i.name, ...i.nicknames]} />
			</div>

			<div className="flex flex-col flex-grow max-w-full gap-4" >
				<div className="flex flex-col" >
					<Tabs {...tabProps} >
						<Tab key="gpa" title="GPA" >
							<WrapStat title="GPA by course" {...statProps} >
								<BarsStat vs={searchCourses.map(x=>[x, courseGrades.get(x.id)!.gpa])}
									type="gpa"
									lhs={x=> <CourseLink type="course" course={smallCourses.get(x.id)!} /> } />
							</WrapStat>
						</Tab>
						<Tab key="gpaSemester" title="GPA Breakdown" {...statProps} >
							<WrapStat title="GPA by course" {...statProps} >
								<NameSemGPA vs={semGPA}
									lhs={x=> <div className="text-xl font-display font-extrabold" >
										<CourseLink type="course" course={smallCourses.get(x.id)!} />
									</div>} />
							</WrapStat>
						</Tab>
						<Tab key="grades" title="Grade distribution" >
							<p className="mb-2" >Select sections:</p>

							<Select isMulti options={termCourses} value={selCourse}
								getOptionLabel={(x: CourseId) => `${x.course.subject}${x.course.course}`}
								getOptionValue={x=>x.id.toString()}
								isOptionDisabled={(x:CourseId)=>courseGrades.get(x.id)!.gpa == null}
								onChange={(x: MultiValue<CourseId>)=>
									setSelCourses(x as CourseId[])
								}
								{...selectProps}
							/>

							<Graph title="Average grades by course" grades={graphGrades} />
						</Tab>
					</Tabs>
				</div>

				{smallCalendar && cal}
			</div>
		</div>

		{!smallCalendar && cal}
		
		<div className="flex flex-col" >
			<h2 className="font-extrabold font-display text-3xl mb-2" >All Courses</h2>
			<Search init={initSearch.search} setSearchState={(search)=>
					setInitSearch({...initSearch, search})
				}
				includeLogo={false} />
		</div>
	</>;

	const app = useContext(AppCtx);
	return <SelectionContext.Provider value={{
		selTerm(term) {
			if (allTerms.includes(term)) setTerm(term);
			else app.open({type: "error", name: "Term not available",
				msg: "We don't have data for this semester"})
		}, section, selSection(section) {setSection(section)}
	}} >
		{main}
	</SelectionContext.Provider>;
}

export function InstructorApp({info,instructor}: {info: ServerInfo, instructor: InstructorId}) {
	return <AppWrapper info={info} ><Instructor instructor={instructor} /></AppWrapper>
}