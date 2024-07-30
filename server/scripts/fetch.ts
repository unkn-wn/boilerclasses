import { abort, exit } from "node:process";
import { isDeepStrictEqual, parseArgs } from 'node:util';
import { Day, PreReqs, Restriction, termPre, validDays,Section,Course,PreReq,levels, Level, Grade, grades, CourseLikePreReq, Seats, normalizeName, gradeGPA, RMPInfo, Data, Term, InstructorGrade, toInstructorGrade, mergeGrades  } from "../../shared/types";
import assert from "node:assert";
import * as cheerio from "cheerio";
import { Cheerio } from "cheerio";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { ProxyAgent } from "undici";
import { getGrades, Grades } from "./grades";

const userAgent = "boilerclasses scraper (node.js)";

type Expr<T, Op extends string> =
	{type: "leaf", leaf: T}
	| {type: "op", op: Op, a: Expr<T,Op>, b: Expr<T,Op>};

type PreReqExpr = Expr<PreReq, "and"|"or">;

type ExprOptions<T,Op extends string> = {
	operators: Op[],
	precedence: number[],
	left: string,
	right: string
} & ({ type: "atom", parseAtom: (s: string) => [T,string] }
	| { type: "ex", parseEx: (s: string) => [Expr<T,Op>|null,string] });

function parseExpr<T,Op extends string,>(s: string, {operators,precedence,left,right,...opt}: ExprOptions<T,Op>): [Expr<T,Op>|null,string] {
	let stack: (({type: "op", op: Op, a: Expr<T,Op>}|{type: "single"})&{prec: number})[] = [{
		type: "single", prec: 0
	}];

	while (true) {
		s=s.trimStart();
		if (s.length==0) {
			if (stack.length==1) return [null,s];
			throw "expected expr";
		}

		if (s[0]=="(") {
			s=s.slice(1);
			stack.push({type: "single", prec: 0});
			continue;
		}

		let cv: Expr<T,Op>|null;
		if (opt.type=="atom") {
			let [v,ns] = opt.parseAtom(s);
			s=ns, cv = {type: "leaf", leaf: v};
		} else {
			let [v,ns] = opt.parseEx(s);
			s=ns, cv=v;
		}

		while (stack.length>0) {
			let p = stack[stack.length-1];

			s=s.trimStart();
			let nxt: number|"right"|null = null;
			if (s.startsWith(right)) {
				nxt="right";
				s=s.slice(right.length);
			} else for (let i=0; i<operators.length; i++) {
				if (precedence[i]>=p.prec && s.startsWith(operators[i])) {
					nxt=i;
					s=s.slice(operators[i].length);
					break;
				}
			}

			if (nxt=="right") {
				while (true) {
					const b = stack.pop()!;
					if (b.type=="op")
						cv=cv==null ? b.a : {type: "op", op: b.op, a: b.a, b: cv};
					else break;
				}
			} else if (nxt==null) {
				const b = stack.pop()!;
				if (b.type!="op") {
					if (stack.length==0) return [cv,s];
					throw "unexpected token";
				}
				cv=cv==null ? b.a : {type: "op", op: b.op, a: b.a, b: cv};
			} else {
				if (cv!==null)
					stack.push({type: "op", op: operators[nxt], a: cv, prec: precedence[nxt]});
				break;
			}
		}

		if (stack.length==0) throw "unexpected right paren";
	}
};

function reduceExpr<T,Op extends string,X>(
	c: Expr<T,Op>,
	map: (x: T) => X,
	reduce: (a: X, b: X, op: Op) => X): X {

	if (c.type==="leaf") return map(c.leaf);
	else return reduce(reduceExpr(c.a,map,reduce), reduceExpr(c.b,map,reduce), c.op);
};

function parsePreReqs(txt: string, concurrent: boolean=false) {
	const parseAtom = (s: string): [PreReq, string] => {
		const m2 = s.match(/^(ALEKS Math Assessment|SAT Mathematics|ACT Math|SATR Math|FL Placement - \w+)\s+(\d+)/);
		if (m2!=null) return [{
			type: "test",
			test: m2[1],
			minScore: m2[2]
		}, s.slice(m2[0].length)];

		const m = s.match(/^(?:(Undergraduate|Graduate|Professional)\s+level\s+)?(\w+) (\w{5})(?:\s+Minimum Grade of ([\w-+]+))?(\s+\[may be taken concurrently\])?/);
		if (m==null || (m[4]!=undefined && !grades.includes(m[4]))) throw "expected prerequisite";

		return [{
			type: "course",
			subject: m[2],
			level: m[1]==undefined ? null : m[1] as Level,
			course: m[3],
			grade: m[4]==undefined ? null : m[4] as Grade,
			concurrent: concurrent || m[5]!==undefined,
			minCredits: null, minGPA: null
		}, s.slice(m[0].length)];
	};

	return parseExpr(txt, {
		operators: ["and", "or"], 
		precedence: [2,1],
		left: "(", right: ")",
		type: "atom",
		parseAtom
	})[0];
}

//very broad! will match anything kinda, be careful
function parseCourseTest(s: string): [CourseLikePreReq, string]|null {
	const courseTestRe = /^(?:Course Attribute:\s+(?<attribute>\w+)|(?<subject>\w+)\s+(?:(?<course>\w{5})(?:\s+to\s+(?<courseTo>\w{5}))?)?)\s+(?:Required Credits:\s+(?<credits>[\d\.]+)\s+)?(?:Minimum Grade of\s+(?<grade>[\w+-]+)\s+)?/;

	let match=s.match(/^Course or Test:\s+/);
	if (match!=null) s=s.slice(match[0].length);

	match = s.match(courseTestRe)
	if (match==null || match.groups==undefined || !match.some((x,i) => x!==undefined && i!=2 && i!=0))
		return null;

	const {grade, course, courseTo, credits, subject, attribute} = match.groups;
	if (grade!==undefined && !grades.includes(grade)) throw "invalid grade";

	const base = {
		minCredits: credits==undefined ? null : Number.parseInt(credits),
		grade: grade==undefined ? null : grade as Grade,
		concurrent: false, minGPA: null
	};

	let ret: CourseLikePreReq;
	if (courseTo!=undefined) ret={
		...base, type: "courseRange",
		subject,course,courseTo
	};
	else if (attribute!=undefined) ret={
		...base, type: "attribute", attribute
	};
	else if (course!=undefined) ret={
		...base, type: "course",
		subject, course, level: null
	};
	else ret={
		...base, type: "subject", subject
	};

	return [ret, s.slice(match[0].length)];
}

function parseGenReq(s: string): [PreReqExpr|null,string] {
	const ruleRe = /^Rule: (.+):.+\n\s*(\))?(?:and|or)*\s*([\s\S]*?)End of rule \1\.?/;
	const studentAttrRe = /Student Attribute:\s+(\w+)/
	const gpaRe = /^([\d\.]+) gpa\./
	const rangeRe = /^(\w+)\s+(\d+)(?:\s+to\s+(\d+))?/

	const m = (re: RegExp): RegExpMatchArray|null => {
		const match=s.match(re);
		if (match!=null) s=s.slice(match[0].length).trimStart();
		return match;
	};

	let match: RegExpMatchArray|null=null;
	let ret: PreReqExpr|null, isRule=false;

	const ctest = parseCourseTest(s);
	if (ctest!=null) {
		ret={type: "leaf", leaf: ctest[0]};
		s=ctest[1];
	} else if (match=m(ruleRe)) {
		isRule=true;

		let cv: PreReqExpr|null = null;
		while (match[3].length>0) {
			const [nv,ns] = parseGenReqs(match[3]);
			match[3]=ns;
			// clauses in rules are ORed
			cv = cv==null ? nv : (nv==null ? cv : {type: "op", op: "or", a: cv, b: nv});
			match[3].trimStart();
		}

		ret=cv;
		if (match[2]!==undefined) s=`${match[2]} ${s}`;
	} else if (match=m(studentAttrRe)) {
		ret={type: "leaf", leaf: {type: "studentAttribute", attr: match[1]}};
	} else if (match=m(gpaRe)) {
		const r = parseCourseTest(s);
		const gpa = Number.parseFloat(match[1]);
		if (r!=null) {
			s=r[1];
			ret = {type: "leaf", leaf: {...r[0], minGPA: gpa}};
		} else if (match=m(/^00100\s+to\s+59\d{3}/)) {
			ret = {type: "leaf", leaf: {type: "gpa", minimum: gpa}};
		} else {
			throw "gpa expects all courses or one course/test selector";
		}
	} else if (match=m(rangeRe)) {
		ret = {type: "leaf", leaf: {
			type: "range", what: match[1],
			min: Number.parseInt(match[2]),
			max: Number.parseInt(match[3])
		}};
	} else {
		throw "expected general requirement";
	}

	if (!isRule) {
		match=m(/^May (not )?be taken concurrently\./);
		if (match==null) throw "expected may / may not be taken concurrently.";
		if (ret!=null && ret.type=="leaf" && (ret.leaf as any).concurrent!==undefined) {
			(ret.leaf as any).concurrent = match[1]==undefined;
		}
	}

	return [ret, s];
}

function parseGenReqs(s: string): [PreReqExpr|null,string] {
	return parseExpr(s, {
		operators: ["and", "or"], 
		precedence: [2,1],
		left: "(", right: ")",
		type: "ex",
		parseEx: parseGenReq
	});
}

function flattenPreReqs(x: PreReqExpr): PreReqs {
	if (x.type=="leaf") return x;
	const a = flattenPreReqs(x.a), b = flattenPreReqs(x.b);
	return {
		type: x.op,
		vs: [...(a.type==x.op ? a.vs : [a]), ...(b.type==x.op ? b.vs : [b])]
	};
}

const {values, positionals} = parseArgs({
	options: {
		term: { type: "string", short: "t" },
		output: { type: "string", short: "o" },
		input: { type: "string", short: "i" },
		allRMP: { type: "boolean", short: "a", default: false }, //update RMP info for all professors, even those who don't appear in term's catalog
		schoolName: { type: "string", default: "Purdue University - West Lafayette" },
		proxies: { type: "string", short: "p" },
		grades: { type: "string", short: "g", default: "https://github.com/eduxstad/boiler-grades/raw/main/grades.xlsx" },
		campus: { type: "string", short: "p", default: "PWL" }
	}
});

if (values.term==undefined) {
	console.error("term not provided");
	abort();
} else if (values.output==undefined) {
	console.error("no output file");
	abort();
}

const data: Data = values.input==undefined ? {
	courses: [], rmp: {}, terms: {},
	subjects: [], attributes: [], scheduleTypes: []
} as Data : JSON.parse(await readFile(values.input, "utf-8"));

let dispatchers: (ProxyAgent|undefined)[] = [undefined];
let waiters: (()=>void)[] = [];

function shuffle<T>(arr: T[]) {
	for (let i=1; i<arr.length; i++) {
		const j = Math.floor(Math.random()*(i+1));
		const x = arr[j];
		arr[j]=arr[i];
		arr[i]=x;
	}
}

if (values.proxies!==undefined) {
	const prox: any[] = JSON.parse(await readFile(values.proxies, "utf-8"));
	for (const p of prox) dispatchers.push(new ProxyAgent(p));
	shuffle(dispatchers);
}

let termTy:string|undefined, termYear:number|undefined;
for (const ty of termPre) {
	if (values.term.startsWith(ty))
		termTy=ty, termYear=Number.parseInt(values.term.slice(ty.length));
}

assert(termTy!==undefined && termYear!==undefined, "invalid term");
const t = `${termTy}${termYear}` as Term;

const dispatcherWait = 1000, dispatcherErrorWait = 30_000;

async function fetchDispatcher<T>(transform: (r: Response) => Promise<T>, ...args: Parameters<typeof fetch>): Promise<T> {
	let err: any;
	for (let retryI=0; retryI<5; retryI++) {
		while (dispatchers.length==0) {
			await new Promise<void>((res,rej) => waiters.push(res));
		}

		const d = dispatchers.pop();
		let wait = dispatcherWait;

		try {
			const hdrs = new Headers({...args[1]?.headers});
			hdrs.append("User-Agent", userAgent);

			const resp = await fetch(args[0], {
				...args[1],
				//@ts-ignore
				dispatcher: d,
				headers: hdrs
			});

			if (resp.status!=200) throw resp.statusText;
			return await transform(resp)
		} catch (e) {
			err=e;
			wait = dispatcherErrorWait;
			continue;
		} finally {
			setTimeout(() => {
				dispatchers.push(d);
				const w = waiters.shift();
				if (w!==undefined) w();
			}, wait);
		}
	}

	throw new Error(`ran out of retries during fetch:\n${err}`);
}

async function loadAndCheckRatelimit(x: Response): Promise<cheerio.CheerioAPI> {
	const c = cheerio.load(await x.text());
	if (c("body").text().trim()=="We are sorry, but the site has received too many requests. Please try again later.")
		throw "ratelimited";
	return c;
}

async function getHTML(url: string, qparams: Record<string,string>={}) {
	const u = new URL(url);
	for (const [k,v] of Object.entries(qparams))
		u.searchParams.append(k,v);
	return await fetchDispatcher(loadAndCheckRatelimit, u);
}

async function RMPGraphQL(query: string, variables: Record<string,any>) {
	return await fetchDispatcher(x => x.json(), "https://www.ratemyprofessors.com/graphql", {
		method: "POST",
		body: JSON.stringify({ query, variables }),
		headers: {
			"Content-Type": "application/json",
			//stolen from https://github.com/Michigan-Tech-Courses/rate-my-professors/blob/master/src/constants.ts lmao
			"Authorization": "Basic dGVzdDp0ZXN0" //hehe its magic!
		}
	});
}

async function postHTML(url: string, form: [string,string][]=[]) {
	const d = new URLSearchParams();
	for (const [k,v] of form) d.append(k,v);
	return await fetchDispatcher(loadAndCheckRatelimit, url, {
		body: d, method: "POST",
		headers:{
      'Content-Type': 'application/x-www-form-urlencoded'
    }
	});
}

declare global { 
	interface String {
		trimStartsWith(v: string): string|null;
		trimIfStarts(v: string): string;
	}
}

String.prototype.trimStartsWith = function(v: string) {
	if (this.startsWith(v)) return this.slice(v.length);
	else return null;
}

String.prototype.trimIfStarts = function(v: string) {
	if (this.startsWith(v)) return this.slice(v.length);
	else return this as string;
}

function tableToObject(c: cheerio.CheerioAPI, tb: Cheerio<cheerio.Element>) {
	tb = tb.children();
	const hdr = tb.first().children().toArray().map(e => c(e).text().trim());
	const rest = tb.slice(1).toArray()
		.map(e => c(e).children().toArray().map(f => c(f).text().trim()));
	return rest.map((row) => Object.fromEntries(hdr.map((h,i) => [h,row[i]])));
}

const ords = ["first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"];

const terms = await getHTML("https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_dyn_sched");
const termList = terms("select[name=\"p_term\"]").children()
	.toArray().map(e => [terms(e).text().trim(), e.attribs.value]);
const termFormatted = `${termTy[0].toUpperCase()}${termTy.slice(1)} ${termYear}`;
const termId = termList.find(([k,v]) => k==termFormatted)?.at(1);
assert(termId!==undefined, "term not found");

console.log("fetching subjects");
const courseSearch = await postHTML("https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_cat_term_date", [
	["call_proc_in", "bwckctlg.p_disp_dyn_ctlg"],
	["cat_term_in", termId]
]);

const subjects = courseSearch("select[name=\"sel_subj\"] > option").toArray()
	.map(x => ({
		abbr: x.attribs.value,
		name: courseSearch(x).text().trim().trimIfStarts(`${x.attribs.value}-`)
	}));

// code duplication 🚨
const courseAttributes = courseSearch("select[name=\"sel_attr\"] > option").toArray()
	.map(x => ({
		id: x.attribs.value, name: courseSearch(x).text().trim()
	})).filter(x => x.id!="%");

const scheduleTypes = courseSearch("select[name=\"sel_schd\"] > option").toArray()
	.filter(x => x.attribs.value!="%").map(x => courseSearch(x).text().trim());

//subject -> course code
type CourseInfo = {
	name: string, sections: Section[],
	grades: Map<string, Grades[]>,
	prevCourse: Course|null
};

const courseNames = new Map<string, Map<number, CourseInfo>>();
const allSections: (
		Omit<Section,"seats"|"waitlist"|"permissionOfInstructor"|"permissionOfDept">
			&{course: number, subject: string}
	)[] = [];
const allInstructors = new Set<string>();

console.log(`getting courses for ${subjects.length} subjects`);

function logArray<T, R>(x: T[], y: (x:T) => Promise<R>, name: (x:T,i:number)=>string): Promise<PromiseSettledResult<Awaited<R>>[]> {
	let num=0;
	return Promise.allSettled(x.map((p,i) => y(p).finally(() => {
		if ((++num)%100 == 0) {
			console.log(`${num}/${x.length}`);
		}
	}).catch((reason) => {
		console.log(`object ${name(p,i)} failed: ${reason}`);
		throw reason;
	})));
}

await logArray(subjects, async sub => {
	const allCourses = await postHTML("https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_get_crse_unsec", [
		["term_in", termId],
		["sel_day", "dummy"],
		["sel_schd", "dummy"],
		["sel_insm", "dummy"],
		["sel_camp", "dummy"],
		["sel_levl", "dummy"],
		["sel_sess", "dummy"],
		["sel_instr", "dummy"],
		["sel_ptrm", "dummy"],
		["sel_attr", "dummy"],
		["sel_crse", ""],
		["sel_title", ""],
		["sel_schd", "%"],
		["sel_insm", "%"],
		["sel_from_cred", ""],
		["sel_to_cred", ""],
		["sel_camp", values.campus!],
		["sel_ptrm", "%"],
		["sel_instr", "%"],
		["sel_sess", "%"],
		["sel_attr", "%"],
		["begin_hh", "0"],
		["begin_mi", "0"],
		["begin_ap", "a"],
		["end_hh", "0"],
		["end_mi", "0"],
		["end_ap", "a"],
		["sel_subj", "dummy"],
		["sel_subj", sub.abbr]
	]);

	const rows = allCourses(".pagebodydiv > table[width=\"100%\"].datadisplaytable > tbody > tr").toArray();

	const names = rows.filter((x,i) => i%2==0)
		.map(e => allCourses(e).find("a").first().text()).map((x => {
			const arr = x.split(" - ");
			const [subject, course] = arr[arr.length-2].split(" ");
			return {
				name: arr.slice(0,arr.length-3).join(" - "),
				subject, course: Number.parseInt(course),
				section: arr[arr.length-1],
				crn: Number.parseInt(arr[arr.length-3])
			}
		}));

	const more = rows.filter((x,i) => i%2==1).map(el =>
		allCourses(el).find("table.datadisplaytable > tbody").last()
	).map((tb) => {
		const objs = tableToObject(allCourses, tb);

		const times: Section["times"] = [];
		let dateRange: (number|null)[] = [null,null];
		let scheduleType:string|null=null;
		let instructors: Map<string,boolean> = new Map();
		for (const o of objs) {
			const dr = o["Date Range"].split(" - ")
			if (dr.length==0 || o.Where=="TBA") continue;

			let start=Date.parse(`${dr[0]} Z`), end = Date.parse(`${dr[1]} Z`);
			if (dateRange[0]==null || start<dateRange[0]) dateRange[0]=start;
			if (dateRange[1]==null || end>dateRange[1]) dateRange[1]=end;

			for (const d of o.Days.split("")) {
				assert(validDays.includes(d as Day), `invalid day ${d}`);
				times.push({day: d as Day, time: o.Time});
			}

			if (o.Instructors!="TBA") {
				const instr = o.Instructors.split(", ").map(x => x.trim().replaceAll(/\s+/g, " "));
				scheduleType = o["Schedule Type"];
				for (const i of instr) {
					if (i.endsWith(" (P)")) instructors.set(i.slice(0, i.length-" (P)".length), true);
					else if (!instructors.has(i)) instructors.set(i,false);
				}
			}
		}

		if (dateRange[0]==null || dateRange[1]==null || scheduleType==null) return null;

		for (const i of instructors.keys()) allInstructors.add(i);

		return {
			times,
			dateRange: [
				(new Date(dateRange[0])).toISOString(),
				(new Date(dateRange[1])).toISOString()
			] as [string,string],
			instructors: [...instructors.entries().map(([k,v]) => ({
				name: k, primary: v
			}))],
			scheduleType
		};
	});

	assert(names.length==more.length, "mismatched rows of subject query");

	for (let i=0; i<names.length; i++) {
		const s = courseNames.get(names[i].subject) ?? new Map<number, CourseInfo>();
		if (!s.has(names[i].course)) s.set(names[i].course, {
			name: names[i].name, sections: [], grades: new Map(), prevCourse: null
		});

		courseNames.set(names[i].subject, s);

		const x = more[i];
		if (x!=null) allSections.push({
			course: names[i].course, subject: names[i].subject,
			crn: names[i].crn,
			section: names[i].section,
			...x
		});
	}

	console.log(`finished with ${sub.abbr}`);
}, sub => sub.name);

for (const c of data.courses) {
	const res = courseNames.get(c.subject)?.get(c.course);
	if (res!==undefined) {
		if (res.prevCourse!=null) throw "duplicate courses in input";
		res.prevCourse=c;
	}
}

console.log(`retrieving grades (from boilergrades or ${values.grades})`);

for (const g of await getGrades(values.grades!)) {
	if (g.grades==null) continue;
	g.instructor = normalizeName(g.instructor);
	const gr = courseNames.get(g.subject)?.get(Number(g.course))?.grades;
	if (gr==undefined) continue;
	const i = normalizeName(g.instructor);
	gr.set(i, [...(gr.get(i) ?? []), g]);
}

console.log(`retrieving professor ratings`);

const res = await RMPGraphQL(`query SearchSchool($query: SchoolSearchQuery!) {
	newSearch {
		schools(query: $query) {
			edges {
				node {
					id
					name
				}
			}
		}
	}
}`, {
	query: {text: values.schoolName!}
});

const schoolCandidates: any[] = res.data.newSearch.schools.edges;
if (schoolCandidates.length==0) {
	console.error(`no schools found matching ${values.schoolName}`);
	abort();
}

const schoolID = schoolCandidates[0].node.id;
console.log(`using school ${schoolCandidates[0].node.name}`)

if (values.allRMP===true) {
	for (const k of Object.keys(data.rmp))
		allInstructors.add(k);
}

await logArray(allInstructors.keys().toArray(), async (k) => {
	//thanks https://github.com/Michigan-Tech-Courses/rate-my-professors/blob/master/src/queries.ts
	const res = await RMPGraphQL(`query NewSearchTeachersQuery($text: String!, $schoolID: ID!) {
		newSearch {
			teachers(query: {text: $text, schoolID: $schoolID}) {
				edges {
					cursor
					node {
						id
						firstName
						lastName
						avgDifficulty
						avgRating
						numRatings
						wouldTakeAgainPercent
					}
				}
			}
		}
	}`, { text: k, schoolID });

	const nname = normalizeName(k);
	const candidate = (res.data.newSearch.teachers.edges as any[]).map(x => x.node).find(x => 
		normalizeName(`${x.firstName} ${x.lastName}`)==nname
	);
	
	if (candidate===undefined) return;
	
	const rmpId = Number.parseInt(Buffer.from(candidate.id,"base64").toString("utf-8").trimIfStarts("Teacher-"));
	if (!isFinite(rmpId)) throw "invalid RMP teacher id";

	data.rmp[k] = {
		avgDifficulty: candidate.avgDifficulty,
		avgRating: candidate.avgRating, numRatings: candidate.numRatings,
		wouldTakeAgainPercent: candidate.wouldTakeAgainPercent,
		rmpUrl: `https://www.ratemyprofessors.com/professor/${rmpId}`
	};
}, x => x);

console.log(`getting availability for ${allSections.length} sections`);

await logArray(allSections, async (sec) => {
	const res = await getHTML("https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_detail_sched", {
		term_in: termId,
		crn_in: sec.crn.toString()
	});

	const labels = res("div.pagebodydiv table.datadisplaytable[width=\"100%\"] td.dddefault > span.fieldlabeltext")
		.toArray().map(x => res(x).text().trim());

	const obj = tableToObject(res,res("table.datadisplaytable table.datadisplaytable tbody"));
	const seats: Seats[] = obj.map((x) => ({used: Number.parseInt(x.Actual), left: Number.parseInt(x.Remaining)}));

	const normal = seats.at(obj.findIndex(x => x[""]=="Seats"));
	const waitlist = seats.at(obj.findIndex(x => x[""]=="Waitlist Seats"));
	if (normal==undefined || waitlist==undefined)
		throw "couldn't find registration availability";

	const s = {
		...sec, course: undefined, subject: undefined, //clear course/subject
		permissionOfInstructor: labels.includes("Permission from Instructor Required"),
		permissionOfDept: labels.includes("Permission from Department Required"),
		seats: normal, waitlist
	};

	courseNames.get(sec.subject)!.get(sec.course)!.sections.push(s);
}, (sec) => `${sec.subject} ${sec.course} - ${sec.section}`);

const courseArr = [...courseNames.entries().flatMap(([subject,courses]) => courses.keys()
	.map((k): [string,number] => [subject,k]))];

console.log(`getting details for ${courseArr.length} courses`);

const courses = await logArray(courseArr, async ([subject,course]): Promise<Course> => {
	//https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202510&subj_code_in=MA&crse_numb_in=66400
	const res = await getHTML(`https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail`, {
		"cat_term_in": termId,
		"subj_code_in": subject,
		"crse_numb_in": course.toString()
	});

	const td = res("div.pagebodydiv table.datadisplaytable[width=\"100%\"] td.ntdefault");
	let bits: {
		heading?: string,
		txt: string
	}[] = [];

	for (const child of td.contents()) {
		const txt = res(child).text();

		if (txt.trim().length==0) {
			if (bits.length>0 && bits[bits.length-1].txt.length>0 && res(child).is("br")) {
				bits.push({txt: ""});
			}
		} else if (child.nodeType==1 && res(child).is("span.fieldlabeltext")) {
			bits.push({txt: "", heading: txt.trim()});
		} else if (bits.length>0) {
			const l = bits[bits.length-1];
			if (l.txt.length>0) l.txt+=`\n${txt}`;
			else l.txt=txt;
		} else {
			bits.push({txt});
		}
	}

	bits[0].txt=bits[0].txt.trim();
	const match = bits[0].txt.match(/^Credit Hours: [\d\.]+(\s*\w+\s*[\d\.]+)?.\s*/);
	if (match!=null) {
		bits[0].txt=bits[0].txt.slice(match[0].length);
	}

	let end = " Credit hours";
	bits[1].txt=bits[1].txt.trim();
	assert(bits[1].txt.endsWith(end), "doesn't end with credit hours");
	bits[1].txt=bits[1].txt.slice(0,bits[1].txt.length-end.length);

	const expr = parseExpr(bits[1].txt, {
		operators: ["TO", "OR"],
		precedence: [1,1],
		type: "atom",
		parseAtom: (credits) => {
			const m = credits.match(/^[\d\.]+/)![0];
			return [{value: Number.parseInt(m)}, credits.slice(m.length)];
		},
		left: "(", right: ")"
	})[0]!;

	let credits: Course["credits"];

	if (expr.type=="op" && expr.op=="TO") {
		credits={
			type: "range",
			min: reduceExpr(expr, x=>x.value, (a,b,c) => Math.min(a,b)),
			max: reduceExpr(expr, x=>x.value, (a,b,c) => Math.max(a,b))
		};
	} else {
		credits={
			type: "fixed",
			values: reduceExpr(expr, x=>[x.value], (a,b,c) => {
				if (c=="OR") return [...a, ...b];
				else {
					const out: number[] = [], top = Math.max(...b);
					for (let i=Math.min(...a); i<=top; i++) out.push(i);
					return out;
				}
			}),
		};
	}

	let reqs: Course["prereqs"] = "none";
	let restrictions: Course["restrictions"] = [];
	let attributes: string[] = [];

	let which: "none"|"restrictions"|"requirements" = "none";
	let curRestrictionTy: Pick<Restriction, "exclusive"|"type">|null = null;

	const headings = [
		"Levels:","Schedule Types:","Offered By:","Department:","Course Attributes:",
		"May be offered at any of the following campuses:","Learning Outcomes:",
		"Repeatable for Additional Credit:","Restrictions:","Prerequisites:","General Requirements:",
		"Corequisites:","Required Materials:","May be offered at any campus except the following:"
	];

	//ignored if general requirements is used instead
	const preReqStrs: [string,boolean][] = [];
	const genReqStrs: string[] = [];
	for (const b of bits) {
		try {
			if (b.heading!==undefined && headings.includes(b.heading)) {
				which="none";

				if (b.heading=="General Requirements:") {
					which="requirements";
					genReqStrs.push("");
				} else if (b.heading=="Restrictions:") {
					which="restrictions";
				} else if (b.heading=="Course Attributes:") {
					attributes.push(...b.txt.split(",").map(x => x.trim()));
				} else if (b.heading=="Prerequisites:") {
					preReqStrs.push([b.txt, false]);
				} else if (b.heading=="Corequisites:") {
					preReqStrs.push([b.txt, true]);
				}
			} else if (b.heading!==undefined) {
				b.txt = `${b.heading}\n${b.txt}`;
			}

			if (which=="restrictions") {
				//preserve indentation for below lmao
				b.txt=b.txt.trimIfStarts("\n").trimEnd();
				const bTrim = b.txt.trimStart();

				if (bTrim.length!=b.txt.length) {
					if (curRestrictionTy==null) continue;
					const {type, exclusive} = curRestrictionTy;

					switch (type) {
						case "level":
						case "class":
							if (levels.includes(bTrim)) {
								restrictions.push({type: "level",exclusive,level: bTrim as Level});
								break;
							}

							const m = bTrim.match(/^(Junior|Sophomore|Freshman|Senior):? (\d+)(?: - (\d+)|\+) hours$|^Professional (\w+) Year$/);
							
							if (m==null)
								throw "invalid classification or level, (which are parsed as one due to the abomination that is AAE 571)";

							if (m[4]===undefined) restrictions.push({type: "class",exclusive,
								class: m[1] as "Sophomore" | "Junior" | "Freshman" | "Senior",
								minCredit: Number.parseInt(m[2]),
								maxCredit: m[3]==undefined ? null : Number.parseInt(m[3])
							});
							else restrictions.push({type: "class",exclusive,
								class: "Professional", year: ords.indexOf(m[4].toLowerCase())+1
							});

							break;
						case "cohort": restrictions.push({type,exclusive,cohort: bTrim}); break;
						case "college": restrictions.push({type,exclusive,college: bTrim}); break;
						case "degree": restrictions.push({type,exclusive,degree: bTrim}); break;
						case "major": restrictions.push({type,exclusive,major: bTrim}); break;
						case "program": restrictions.push({type,exclusive,program: bTrim}); break;
					}
				} else if (bTrim.length>0) {
					const tyMap = {
						"level": ["Levels"],
						"major": ["Majors"],
						"degree": ["Degrees"],
						"program": ["Concentrations", "Fields of Study (Major, Minor,  or Concentration)", "Programs"],
						"class": ["Classifications"],
						"cohort": ["Cohorts"],
						"college": ["Colleges"]
					};

					if (b.txt.endsWith(":")) b.txt=b.txt.slice(0,b.txt.length-1);
					const ty = Object.entries(tyMap).find(([k,v]) => v.find(x => b.txt.endsWith(x))!==undefined);

					if (ty!==undefined) curRestrictionTy = {
						exclusive: b.txt.startsWith("May not be"),
						type: ty[0] as Restriction["type"]
					};
					else curRestrictionTy=null;
				}
			} else if (which=="requirements") {
				genReqStrs[genReqStrs.length-1]+=` ${b.txt}`;
			}
		} catch(e) {
			console.error(`error parsing ${subject} ${course}: ${e}\nline: ${b.txt}`)
		}
	}

	const addReqs = (txt: string, f: () => PreReqExpr|null) => {
		if (reqs=="failed") return;

		try {
			const newreqs = f();
			if (newreqs==null) return;
			const flat = flattenPreReqs(newreqs);

			if (reqs=="none") reqs=flat;
			else reqs={type: "and", vs: [
				...(reqs.type=="and" ? reqs.vs : [reqs]),
				...(flat.type=="and" ? flat.vs : [flat])
			]};
		} catch (e) {
			reqs="failed";
			console.error(`error parsing prerequisites for ${subject} ${course}: ${e}\npart: ${txt}`);
		}
	};

	//prereqs are disabled if general requirements exists
	//i havent seen a case where prereqs isn't filled with garbage when gen reqs exists
	if (genReqStrs.length==0) {
		for (const [prereq, concurrent] of preReqStrs) {
			addReqs(prereq, () => parsePreReqs(prereq, concurrent));
		}
	}

	for (const genreq of genReqStrs) {
		addReqs(genreq, () => parseGenReqs(genreq)[0]);
	}

	const info = courseNames.get(subject)!.get(course)!;
	const instructorSet = new Set([
		...info.sections.flatMap(x => x.instructors).map(x => x.name),
		...(info.prevCourse?.instructor==undefined ? [] : Object.keys(info.prevCourse.instructor))
	]);

	const instructorOut: Course["instructor"] = {};

	for (const i of instructorSet.keys()) {
		const g = info.grades.get(normalizeName(i));

		if (g==undefined) continue;

		const termGs = new Map<Term, Grades[]>();

		for (const x of g)
			termGs.set(x.term, [...(termGs.get(x.term) ?? []), x]);

		for (const [t, gs] of termGs.entries())
			instructorOut[i] = {
				...instructorOut[i],
				[t]: mergeGrades(gs.map((x):InstructorGrade => toInstructorGrade(x.grades)))
			};
	}

	const newCourse: Omit<Course,"lastUpdated"> = {
		name: info.name,
		subject, course,
		instructor: instructorOut,
		description: bits[0].txt,
		restrictions,
		credits,
		sections: {
			...info.prevCourse?.sections,
			[t]: info.sections as Course["sections"]["fall0"]
		},
		prereqs: reqs,
		attributes
	};

	if (info.prevCourse!=null
		&& isDeepStrictEqual(newCourse, {...info.prevCourse, lastUpdated: undefined}))
		return info.prevCourse;
	else return {...newCourse, lastUpdated: (new Date()).toISOString()};
}, ([course, sub]) => `${sub} ${course}`);

console.log(`done (${courses.reduce((y,x) => (x.status=="fulfilled" ? 1 : 0)+y,0)}/${courses.length} successful)`);

const d: Data = {
	...data,
	courses: courses.filter(x => x.status=="fulfilled").map(x => x.value),
	terms: {
		...data.terms,
		[t]: {
			id: termId, name: termFormatted,
			lastUpdated: (new Date()).toISOString()
		} as Data["terms"]["fall0"]
	},
	subjects, attributes: courseAttributes, scheduleTypes
};

await writeFile(values.output, JSON.stringify(d));
