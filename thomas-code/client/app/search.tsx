import { Button, ButtonPopover, Loading, LogoText, selectProps } from "@/components/util";
import icon from "../public/icon.png";
import Image from "next/image";
import { IconArrowUp, IconChevronUp, IconFilterFilled, IconInfoCircle, IconMoodLookDown } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Select from 'react-select';
import { formatTerm, ServerInfo, ServerSearch, Term, termIdx } from "../../shared/types";
import { Footer } from "@/components/footer";
import { Slider } from "@nextui-org/slider";
import attributeToGenEd from "./attributeToGenEd.json";
import { twMerge } from "tailwind-merge";
import { Checkbox, CheckboxGroup } from "@nextui-org/checkbox";
import { useAPI, useInfo } from "@/components/wrapper";
import { Card } from "@/components/card";
import { Collapse } from 'react-collapse';
import { Pagination } from "@nextui-org/pagination";

export type SearchState = {
	query: string,
	minCredits?: number, maxCredits?: number
	attributes: string[],
	minCourse?: number, maxCourse?: number,
	subjects: string[], terms: Term[],
	scheduleType: string[],
	minGPA?: number, maxGPA?: number,
	minMinute?: number, maxMinute?: number,
	page: number,
	instructors: string[]
};

const defaultSearchState: SearchState = {
	query: "", attributes: [], subjects: [], scheduleType: [], terms: [], page: 0, instructors: []
};

const spec: Partial<Record<keyof SearchState, "array"|"number"|"string">> = {
	query: "string", minCredits: "number", maxCredits: "number",
	attributes: "array", minCourse: "number", maxCourse: "number",
	subjects: "array", terms: "array", scheduleType: "array", page: "number",
	minGPA: "number", maxGPA: "number", minMinute: "number", maxMinute: "number"
};

function encodeToQuery(x: any) {
	const u = new URLSearchParams();
	for (const [k,v] of Object.entries(x)) {
		if (typeof v=="string" && v.length>0) u.append(k,v);
		else if (typeof v=="number") u.append(k,v.toString());
		else if (typeof v=="object")
			for (const el of v as any) u.append(k,el as string);
	}
	return u;
}

function decodeFromQuery<T>(x: URLSearchParams, spec: Partial<Record<keyof T, "array"|"number"|"string">>, base: T) {
	for (const k in spec) {
		const g = x.getAll(k);
		//@ts-ignore
		if (spec[k]=="array") base[k]=[...base[k], ...g];
		//@ts-ignore
		else if (spec[k]=="number" && g.length>0) base[k]=Number(g[0]);
		//@ts-ignore
		else if (g.length>0) base[k]=g[0];
	}
}

export function encodeSearchState(state: Partial<SearchState>) {
	return encodeToQuery({...state,
		page: state.page==undefined || state.page==0 ? undefined : state.page+1});
}

export function decodeQueryToSearchState(query: URLSearchParams) {
	const x = {...defaultSearchState};
	decodeFromQuery(query,spec,x);
	return x;
}

export function Search({init, autoFocus, clearSearch, setSearchState, includeLogo}: {init: Partial<SearchState>, autoFocus?:boolean, clearSearch?: ()=>void, setSearchState: (s:SearchState)=>void, includeLogo?: boolean}) {
	const searchState = {...defaultSearchState, ...init};
	const info = useInfo();

	const sortedTerms = useMemo(()=>
		Object.keys(info.terms).map(k=>({k: k as Term, idx: termIdx(k as Term)}))
			.sort((a,b) => b.idx-a.idx), []);

	const selectControlProps = (k: "attributes"|"subjects"|"terms", options: {value: string, label: string}[]) => {
		const obj = Object.fromEntries(options.map(x => [x.value,x.label]));
		return {
			...selectProps,
			options, isMulti: true as any,
			value: searchState[k].map(x => ({value: x, label: obj[x]})),
			onChange: (ks: any)=>
				setSearchState({...searchState, [k]: (ks as typeof options).map(x => x.value)})
		}
	};

	const renderRange = (a?: number, b?: number) =>
		a!=undefined ? (b!=undefined ? `${a} - ${b}` : `${a}+`) : (b!=undefined ? `up to ${b}` : undefined);
	const renderTime = (x: number) => {
		const h = Math.floor(x/60), m=Math.round(x)%60;
		const h2 = (h+11)%12 +1, m2=m<10 ? `0${m}` : m;
		return `${h2}:${m2} ${h>=12 ? "p" : "a"}m`;
	};
	const renderTimeRange = (a?: number, b?: number) =>
		a!=undefined ? (b!=undefined ? `${renderTime(a)} - ${renderTime(b)}` : `after ${renderTime(a)}`)
			: (b!=undefined ? `before ${renderTime(b)}` : undefined);

	const api = useAPI<ServerSearch,SearchState>("search", {data: searchState, method: "POST"});

	const cond = api!=null && api.res.npage<=searchState.page;
	useEffect(() => {
		if (cond) setSearchState({...searchState, page: api.res.npage-1});
	}, [cond]);

	const params = Object.values({...searchState, page: undefined});
	useEffect(()=>setSearchState({...searchState, page: 0}), params);

	useEffect(() => {
		if (cond) setSearchState({...searchState, page: api.res.npage-1});
	}, [cond]);

	let activeFilters=[];
	if (searchState.minCourse!=undefined || searchState.maxCourse!=undefined) activeFilters.push("level");
	if (searchState.minCredits!=undefined || searchState.maxCredits!=undefined) activeFilters.push("credits");
	if (searchState.minGPA!=undefined || searchState.maxGPA!=undefined) activeFilters.push("GPA");
	if (searchState.minMinute!=undefined || searchState.maxMinute!=undefined) activeFilters.push("time");
	if (searchState.scheduleType.length>0) activeFilters.push("schedule");
	if (searchState.attributes.length>0) activeFilters.push("attributes");
	if (searchState.terms.length>0) activeFilters.push("semester");
	if (searchState.subjects.length>0) activeFilters.push("subject");

	const [filtersCollapsed, setFiltersCollapsed] = useState(true);

	const [scrollToTop, setScrollToTop] = useState(false);
	const searchBarRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const onScroll = () => {
			if (searchBarRef.current!==null)
				setScrollToTop(window.scrollY>searchBarRef.current.offsetTop+400);
		};

		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
  }, []);

	return <>
		{scrollToTop && <button className="fixed bg-zinc-900 z-50 w-12 h-12 rounded-full right-12 bottom-20 shadow-black shadow-sm hover:-tranzinc-y-0.5 transition"
			onClick={() => searchBarRef.current?.scrollIntoView({ behavior: "smooth" })}>
			<IconArrowUp color="white" className="mx-auto my-auto" />
		</button>}

		{includeLogo && <div ref={includeLogo ? searchBarRef : undefined} className='flex flex-row mb-2 md:mb-4 lg:mb-8 cursor-pointer' onClick={clearSearch} >
			<Image src={icon} alt="icon" className='my-auto w-10 h-10 ml-2 mr-2 lg:ml-0 md:w-16 md:h-16' />
			<LogoText className="text-2xl md:text-5xl" />
		</div>}

		{/* Search Bar */}
		<div className="mb-3" ref={includeLogo ? undefined : searchBarRef} >
			<input
				autoFocus={autoFocus} id="search" type="text"
				placeholder="Search for courses..."
				value={searchState.query}
				onChange={(e) => setSearchState({...searchState, query: e.target.value})}
				className="text-white text-xl bg-neutral-950 w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
			/>
		</div>
		<div className="flex flex-row mb-8 gap-5 items-center">
			<div className='flex flex-col gap-2 w-full items-stretch md:flex-nowrap flex-wrap'>
				<Collapse isOpened={!filtersCollapsed} >
					<div className="flex flex-col gap-2 w-full items-stretch" >
						<Select placeholder="Subject..." components={{Option: (props) =>
								<div className={twMerge(props.getClassNames("option", props), "flex flex-row items-stretch justify-start py-0")}
									key={props.data.value} onClick={() => props.selectOption(props.data)} >
									<span className="basis-14 shrink-0 py-2" >{props.data.value}</span>
									<div className="w-px mx-4 bg-zinc-500 flex-shrink-0" />
									<span className="py-2" >{props.data.label}</span>
								</div>
							}}
							getOptionLabel={x => `${x.value} - ${x.label}`}
							{...selectControlProps("subjects", info.subjects.map(x => ({label: x.name, value: x.abbr})))}
						/>
						<Select placeholder="Semester..."
							{...selectControlProps("terms", sortedTerms.map(x => ({
								label: formatTerm(x.k), value: x.k
							})))}
							/>
						<Select placeholder="Gen Ed..."
							{...selectControlProps("attributes", Object.entries(attributeToGenEd).map(([k,v]) => ({
								label: v, value: k
							})))}
						/>
						{searchState.attributes.length>0 && <p className="flex flex-row my-2 gap-2 p-3 bg-red-900 rounded-md" >
							<IconInfoCircle/>
							Not all geneds may appear since they are based on catalog attributes which seem to be incomplete. Consider consulting your college's site for an accurate list.
						</p>}
					</div>
				</Collapse>
				
				<div className="flex flex-col md:flex-row justify-between items-end w-full gap-2 flex-wrap" >
					{!filtersCollapsed ? <div className="flex flex-row items-stretch gap-2 flex-1 md:flex-none flex-wrap" >
						<ButtonPopover title="Credits" desc={renderRange(searchState.minCredits, searchState.maxCredits)} >
							<Slider label="Credit range"
								step={1} minValue={1} maxValue={18}
								showSteps showTooltip defaultValue={
									[searchState.minCredits ?? 1, searchState.maxCredits ?? 18]
								}
								onChange={(([a,b]: [number,number]) => 
									setSearchState({...searchState,
										minCredits: a==1 ? undefined : a, maxCredits: b==18 ? undefined : b})
								) as any}
								getValue={(x)=>{
									const [a,b] = x as [number,number];
									return `${a} - ${b} credits`;
								}}
								className="min-w-56"
							/>
						</ButtonPopover>

						<ButtonPopover title="Level" desc={renderRange(searchState.minCourse, searchState.maxCourse)} >
							<Slider label="Course range"
								step={100} minValue={100} maxValue={900}
								showSteps showTooltip defaultValue={
									[searchState.minCourse ?? 100, searchState.maxCourse ?? 900]
								}
								onChange={(([a,b]: [number,number]) => 
									setSearchState({...searchState,
										minCourse: a==100 ? undefined : a, maxCourse: b==900 ? undefined : b})
								) as any}
								getValue={(x)=>{
									const [a,b] = x as [number,number];
									return `${a} - ${b}`;
								}}
								className="min-w-56"
							/>
						</ButtonPopover>

						<ButtonPopover title="Time" desc={renderTimeRange(searchState.minMinute, searchState.maxMinute)} >
							<p className="mb-3" >Latest semester section time</p>
							<Slider
								step={15} minValue={5*60} maxValue={24*60}
								marks={[...new Array(5)].map((x,i)=> {
									const v = 60*((24-5)*i/4+5);
									return { label: renderTime(v), value: v};
								})}
								onChange={(([a,b]: [number,number]) => 
									setSearchState({...searchState,
										minMinute: a==5*60 ? undefined : a, maxMinute: b==24*60 ? undefined : b})
								) as any}
								defaultValue={[searchState.minMinute ?? 5*60, searchState.maxMinute ?? 24*60]}
								getValue={(x)=>{
									const [a,b] = x as [number,number];
									return `${renderTime(a)} - ${renderTime(b)}`;
								}}
								className="min-w-80 text-nowrap px-1"
							/>
						</ButtonPopover>

						<ButtonPopover title="GPA" desc={renderRange(searchState.minGPA, searchState.maxGPA)} >
							<Slider label="Average GPA"
								step={0.05} minValue={1} maxValue={4}
								showTooltip onChange={(([a,b]: [number,number]) => 
									setSearchState({...searchState,
										minGPA: a==1 ? undefined : a, maxGPA: b==4 ? undefined : b})
								) as any}
								defaultValue={[searchState.minGPA ?? 1, searchState.maxGPA ?? 4]}
								getValue={(x)=>{
									const [a,b] = x as [number,number];
									return `${a.toFixed(2)} - ${b.toFixed(2)}`;
								}}
								className="min-w-56 mb-3"
							/>
							<p>Averaged over all sections in dataset.</p>
						</ButtonPopover>

						<ButtonPopover title="Schedule" desc={
							searchState.scheduleType.length>0
							? `${searchState.scheduleType.length} of ${info.scheduleTypes.length} types` : undefined
						} >
							<CheckboxGroup
								label="Choose schedules"
								value={searchState.scheduleType}
								onChange={x => setSearchState({...searchState, scheduleType: x})}
							>
								<div className="flex flex-row w-full gap-3" >
									<Button onClick={() => setSearchState({...searchState, scheduleType:
										info.scheduleTypes
									})} className="flex-1 bg-zinc-800" >All</Button>
									<Button onClick={() => setSearchState({...searchState, scheduleType: [] })}
										className="flex-1 bg-zinc-800"  >None</Button>
								</div>
								{info.scheduleTypes.map(x =>
									<Checkbox value={x} key={x} checked={searchState.scheduleType.includes(x)} >{x}</Checkbox>)}
							</CheckboxGroup>
						</ButtonPopover>
					</div> : <Button icon={<IconFilterFilled/>} onClick={() => setFiltersCollapsed(false)} className="w-full md:w-auto" >
						{activeFilters.length>0 ? `Filtering by ${activeFilters.join(", ")}` : "Filters"}
					</Button>}
					{api!=null && <p>
						{api.res.numHits} results in {api.res.ms.toFixed(2)} ms (page {api.req!.page+1} of {api.res.npage})
					</p>}
				</div>

				<Collapse isOpened={!filtersCollapsed} >
					<div className="flex flex-col w-full items-center" >
						<button onClick={()=>setFiltersCollapsed(true)} className="flex flex-col items-center cursor-pointer hover:-translate-y-1 transition" >
							<IconChevronUp/>
							Hide filters
						</button>
					</div>
				</Collapse>
			</div>
		</div>

		{api==null || api.req!.page!=searchState.page
			? <Loading/> : (api.res.results.length>0 ? //:)
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
						{api.res.results.map(x => <Card key={`${x.course.id}\n${x.course.varTitle}`}
							termFilter={searchState.terms.length==0 ? undefined : searchState.terms}
							course={x.course} />)}
					</div>
					<div className="w-full flex flex-col items-center" >
						<Pagination total={api.res.npage} initialPage={api.req!.page+1} onChange={
							(page) => setSearchState({...searchState, page: page-1})
						} ></Pagination>
					</div>
				</>
				:
				<div className='flex flex-col h-full w-full items-center justify-center align-center gap-2 mt-5 mb-11'>
					<IconMoodLookDown size={50} color='#DAAA00' />
					<div className='text-white'>No results found!</div>
					{activeFilters.length>0 && <div className='text-white -tranzinc-y-3'>Maybe try changing the filters?</div>}
				</div>)}

		<div className='mt-auto'>
			<Footer />
		</div>
	</>;
}