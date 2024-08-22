import { Knex } from "knex";
import { Course, CourseLikePreReq, Day, formatTerm, Grade, grades, InstructorGrade, Level, levels, mergeGrades, normalizeName, PreReq, PreReqs, Restriction, Seats, Section, Term, termIdx, toInstructorGrade, validDays } from "../../shared/types";
import { Grades } from "./grades";
import { getHTML, logArray, ords, postHTML, tableToObject } from "./fetch";
import assert from "node:assert";
import { DBAttribute, DBCourse, DBSchedType, DBSubject } from "./db";
import { isDeepStrictEqual } from "node:util";

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
				while (stack.length>1) { //ignore unmatched right parens..., should throw
					const b = stack.pop()!;
					if (b.type=="op")
						cv=cv==null ? b.a : {type: "op", op: b.op, a: b.a, b: cv};
					else break;
				}
			} else if (nxt==null) {
				const b = stack.pop()!;
				if (b.type!="op") {
					if (stack.length==0) return [cv,s];
					//should throw if unmatched left paren
					// throw "unexpected token";
				} else {
					cv=cv==null ? b.a : {type: "op", op: b.op, a: b.a, b: cv};
				}
			} else {
				if (cv!==null)
					stack.push({type: "op", op: operators[nxt], a: cv, prec: precedence[nxt]});
				break;
			}
		}
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
	const studentAttrRe = /^Student Attribute:\s+(\w+)/
	const gpaRe = /^([\d\.]+) gpa\./
	const creditsRe = /^Required Credits:\s+([\d\.]+)/
	const rangeRe = /^(\w+)?\s+(\d+)(?:\s+to\s+(\d+))?/

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
		if (match[1]==undefined) ret=null; //range of wat?! c.f. spring 2024 econ 499...
		else ret = {type: "leaf", leaf: {
			type: "range", what: match[1],
			min: Number.parseInt(match[2]),
			max: Number.parseInt(match[3])
		}};
	} else if (match=m(creditsRe)) {
		ret={type: "leaf", leaf: {type: "credits", minimum: Number.parseInt(match[1])}};
	} else {
		// expected to error on e.g. spring 2024 com 565, which is literally just "may not be taken concurrently" D:
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

export async function updateCourses({term: t,termId,grades,knex,subjectArg}:{
	term: Term, termId: string, grades: Grades[], knex: Knex,
	subjectArg?: string
}) {
	const idx = termIdx(t);

	console.log(`fetching subjects for term ${formatTerm(t)}`);
	const courseSearch = await postHTML("https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_cat_term_date", [
		["call_proc_in", "bwckctlg.p_disp_dyn_ctlg"],
		["cat_term_in", termId]
	]);

	let subjects = courseSearch("select[name=\"sel_subj\"] > option").toArray()
		.map(x => ({
			abbr: x.attribs.value,
			name: courseSearch(x).text().trim().trimIfStarts(`${x.attribs.value}-`)
		}));

	// code duplication 🚨
	const courseAttributes = courseSearch("select[name=\"sel_attr\"] > option").toArray()
		.map(x => ({
			id: x.attribs.value, name: courseSearch(x).text().trim()
		})).filter(x => x.id!="%");
	
	const courseAttributeMap = new Map(courseAttributes.map(x=>[x.name,x.id]));

	const scheduleTypes = courseSearch("select[name=\"sel_schd\"] > option").toArray()
		.filter(x => x.attribs.value!="%").map(x => courseSearch(x).text().trim());

	await knex<DBSubject>("subject").insert(subjects).onConflict("abbr").merge();
	await knex<DBAttribute>("attribute").insert(courseAttributes).onConflict("id").merge();
	await knex<DBSchedType>("scheduleType").insert(scheduleTypes.map(x=>({name: x})))
		.onConflict("name").ignore();

	if (subjectArg!=undefined) {
		subjects=subjects.filter(x=>x.abbr.toLowerCase()==subjectArg.toLowerCase());
		if (subjects.length==0) throw `subject ${subjectArg} not found`;
	}

	//subject -> course code
	type CourseInfo = {
		sections: Section[],
		grades: Map<string, Grades[]>
	};

	const courseNames = new Map<string, Map<number, CourseInfo>>();
	const allSections: (
			Omit<Section,"seats"|"waitlist"|"permissionOfInstructor"|"permissionOfDept">
				&{course: number, subject: string}
		)[] = [];

	const allInstructors: [string, number][] = [];

	console.log(`getting courses for ${subjects.length} subjects`);

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
			["sel_camp", "PWL"], //technically supports indy for new semesters
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

			return {
				times,
				dateRange: [
					(new Date(dateRange[0])).toISOString(),
					(new Date(dateRange[1])).toISOString()
				] as [string,string],
				instructors: [...instructors.entries()].map(([k,v]) => ({
					name: k, primary: v
				})),
				scheduleType
			};
		});

		assert(names.length==more.length, "mismatched rows of subject query");

		for (let i=0; i<names.length; i++) {
			const s = courseNames.get(names[i].subject) ?? new Map<number, CourseInfo>();
			if (!s.has(names[i].course)) s.set(names[i].course, {
				sections: [], grades: new Map()
			});

			courseNames.set(names[i].subject, s);

			const x = more[i];
			if (x!=null) allSections.push({
				name: names[i].name,
				course: names[i].course, subject: names[i].subject,
				crn: names[i].crn,
				section: names[i].section,
				...x
			});
		}
	}, sub => sub.abbr);

	console.log("extracting course grades");

	for (const g of grades) {
		if (g.data==null) continue;
		g.instructor = normalizeName(g.instructor);
		const gr = courseNames.get(g.subject)?.get(Number(g.course))?.grades;
		if (gr==undefined) continue;
		const i = normalizeName(g.instructor);
		gr.set(i, [...(gr.get(i) ?? []), g]);
	}

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

	const courseArr = [...courseNames.entries()].flatMap(([subject,courses]) => [...courses.keys()]
		.map((k): [string,number] => [subject,k]));

	console.log(`getting details for ${courseArr.length} courses`);

	const courses = await logArray(courseArr, async ([subject,course]) => {
		//https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202510&subj_code_in=MA&crse_numb_in=66400
		const res = await getHTML(`https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail`, {
			"cat_term_in": termId,
			"subj_code_in": subject,
			"crse_numb_in": course.toString()
		});

		const name = res(".nttitle").first().text().split(" - ")[1].trim();

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
						attributes.push(...b.txt.split(",").map(x => x.trim()).map(x => {
							const v = courseAttributeMap.get(x);
							return v ?? x;
						}));
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

		const info = courseNames.get(subject)!.get(course)!;

		await knex.transaction(async trans => {
			const pcourseRow = await trans<DBCourse>("course").where({subject, course, name}).first();
			const pcourse = pcourseRow==undefined ? undefined : JSON.parse(pcourseRow.data);

			const newInstructors = new Set(info.sections.flatMap(x => x.instructors).map(x => x.name));
			const instructorSet = newInstructors.union(
				new Set(pcourse?.instructor==undefined ? [] : Object.keys(pcourse.instructor)));

			const isNewer = pcourse==undefined
				|| Object.keys(pcourse.sections).find(x=>termIdx(x as Term)>idx)==undefined;

			//prereqs are disabled if general requirements exists
			//i havent seen a case where prereqs isn't filled with garbage when gen reqs exists
			if (isNewer) {
				if (genReqStrs.length==0) {
					for (const [prereq, concurrent] of preReqStrs) {
						addReqs(prereq, () => parsePreReqs(prereq, concurrent));
					}
				}

				for (const genreq of genReqStrs) {
					addReqs(genreq, () => parseGenReqs(genreq)[0]);
				}
			}

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
						[t]: mergeGrades(gs.map((x):InstructorGrade => toInstructorGrade(x.data)))
					};
			}
			
			const mergeCourses = (old: Course|undefined, newCourse: Course): Course => {
				if (old!==undefined
					&& isDeepStrictEqual({...newCourse, lastUpdated: undefined}, {...old, lastUpdated: undefined}))
					return {
						...newCourse,
						lastUpdated: new Date(Math.min(Date.parse(old.lastUpdated),
							Date.parse(newCourse.lastUpdated))).toISOString()
					};

				return {
					...newCourse,
					instructor: instructorOut,
					sections: { ...old?.sections, ...newCourse.sections }
				};
			};

			const toMerge: Course = {
				name, subject, course,
				instructor: instructorOut,
				description: bits[0].txt,
				restrictions, credits,
				sections: { [t]: info.sections.map(sec => ({
					...sec, name: sec.name==name ? undefined : sec.name
				})) },
				prereqs: reqs, attributes,
				lastUpdated: new Date().toISOString()
			}; 

			const newCourse = isNewer ? mergeCourses(pcourse, toMerge) : mergeCourses(toMerge, pcourse);

			let id: number;
			if (pcourseRow==undefined)
				id=(await trans<DBCourse>("course").insert({
					subject, course, name,
					data: JSON.stringify(newCourse)
				}, "id"))[0].id;
			else {
				id=pcourseRow.id;
				await trans<DBCourse>("course").where("id", pcourseRow.id).update({
					data: JSON.stringify(newCourse)
				});
			}

			for (const i of newInstructors) allInstructors.push([i,id]);
		});
	}, ([course, sub]) => `${sub} ${course}`);

	console.log(`done (${courses.reduce((y,x) => (x.status=="fulfilled" ? 1 : 0)+y,0)}/${courses.length} successful)`);

	return { instructors: allInstructors };
}