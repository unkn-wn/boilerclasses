export type Level = "Undergraduate" | "Graduate" | "Professional";
export const levels = ["Undergraduate", "Graduate", "Professional"];

export type PlusMinus = "+" | "-" | "";
export type Letters = "A" | "B" | "C" | "D";
export type Grade = `${Letters}${PlusMinus}` | "E" | "F" | "U" | "S" | "SI" | "P" | "PI" | "NS";

export const grades = [...["A","B","C","D"].flatMap(x => [`${x}+`, `${x}-`, x]), "E", "F", "U", "S", "SI", "P", "PI", "NS"];

export type PreReq = (
  { type: "course", level: Level|null, subject: string, course: string }
  | { type: "courseRange", subject: string, course: string, courseTo: string }
  | { type: "subject", subject: string }
  | { type: "attribute", attribute: string }
)&{
  minCredits: number|null,
  minGPA: number|null,
  grade: Grade|null,
  concurrent: boolean
} | {
  type: "range",
  what: string,
  min: number, max: number,
} | {
  type: "test",
  test: string,
  minScore: string
} | {
  type: "gpa",
  minimum: number
} | {
  type: "studentAttribute",
  attr: string
};

export type CourseLikePreReq = Extract<PreReq, {concurrent: boolean}>;

export type Restriction =
  {exclusive: boolean}&({ type: "level", level: Level }
  | { type: "major", major: string }
  | { type: "degree", degree: string }
  | { type: "program", program: string }
  | { type: "college", college: string }
  | { type: "class", class: "Sophomore" | "Junior" | "Freshman" | "Senior",
      minCredit: number, maxCredit: number|null }
  | {type: "class", class: "Professional", year: number}
  | { type: "cohort", cohort: string })

export type PreReqs = {type: "leaf", leaf: PreReq} | (
  ({type: "or"} | {type: "and"})&{vs: PreReqs[]}
);

export const termPre = ["spring", "summer", "fall", "winter"];
export type Term = `${"spring" | "fall" | "summer" | "winter"}${number}`

export type RMPInfo = {
	avgDifficulty: number,
	avgRating: number,
	rmpUrl: string,
	numRatings: number,
	wouldTakeAgainPercent: number
};

export type InstructorGrade = {
  grade: Partial<Record<Grade, number>>,
  gpa: number|null, gpaSections: number, // sections with non-null gpa / which have letter grades
  numSections: number
};

export const emptyInstructorGrade: InstructorGrade = {grade: {}, gpa: null, gpaSections: 0, numSections: 0 };

export function toInstructorGrade(x: Partial<Record<Grade,number>>): InstructorGrade {
  let gpa = 0, gpaTot=0;
  for (const [k,v] of Object.entries(x) as [Grade,number][]) {
      if (gradeGPA[k]!==undefined) {
        gpa += gradeGPA[k]*v;
        gpaTot += v;
      }
  }

  return {
    grade: x, gpa: gpaTot==0 ? null : gpa/gpaTot,
    numSections: 1, gpaSections: gpaTot==0 ? 0 : 1
  };
}

export function mergeGrades(arr: InstructorGrade[]): InstructorGrade {
  let gpa = 0, totSec=0, gpaTot=0;
  let out: Partial<Record<Grade, number>> = {};

  for (const x of arr) {
    for (const [k,v] of Object.entries(x.grade) as [Grade,number][]) {
      if (out[k]==undefined) out[k]=v;
      else out[k]+=v;
    }

    if (x.gpa!=null) {
      gpa += x.gpaSections*x.gpa;
      gpaTot += x.gpaSections;
    }

    totSec+=x.numSections;
  }

  if (totSec==0) return emptyInstructorGrade;

  for (const k in out) out[k as Grade]!/=totSec;

  return { grade: out, gpa: gpaTot==0 ? null : gpa/gpaTot,
    numSections: totSec, gpaSections: gpaTot };
};

export type Day = "M"|"T"|"W"|"R"|"F"|"S";

export type Seats = {
  used: number, left: number
};

export type Instructor = {primary: boolean, name: string};

export type Section = {
  crn: number,
  section: string,

  permissionOfInstructor: boolean,
  permissionOfDept: boolean,

  times: {
    day: Day,
    time: string
  }[],

  seats: Seats,
  waitlist: Seats,

  //utc for timezone independence...
  dateRange: [string, string],
  scheduleType: string,
  
  instructors: Instructor[]
};

export const validDays = ["M","T","W","R","F","S"];

export type InstructorGrades = Record<Term, InstructorGrade>;

export type Course = {
  name: string,
  subject: string,
  course: number, //5 digits
  instructor: Record<string, InstructorGrades>,
  sections: Record<Term, Section[]>,

  lastUpdated: string,

  description: string,
  credits: {type: "range", min: number, max: number}|{type: "fixed", values: number[]},
  attributes: string[],
  prereqs: PreReqs | "failed" | "none", //may fail to parse
  restrictions: Restriction[]
};

export function normalizeName(name: string) {
  const n=name.split(",").reverse().join(" ").toLowerCase()
    .replaceAll(/[^a-z ]/g,"").split(/\s+/g).filter(x=>x.length>0);
  return n.toSpliced(1, n.length-2).join(" ");
}

// export function compareName(x: string, y: string) {
//   if (x==y) return true;
//   const s = new Set(x.split(" "));
//   let cnt=0;
//   for (const z of y.split(" "))
//     if (s.has(z)) if (++cnt >= 2) return true;
//   return false;
// }

export const gradeGPA: Partial<Record<Grade, number>> = {
  ...Object.fromEntries([
    "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A"
  ].map((x,i) => [x,(i%3==0 ? 0.7 : (i%3==1 ? 1 : 1.3)) + Math.floor(i/3)])),
  "A+": 4, "E": 0, "F": 0
};

export type Data = {
  courses: Course[],
  rmp: Record<string, RMPInfo>,
  terms: Partial<Record<Term,{ id: string, name: string, lastUpdated: string }>>,
  subjects: { abbr: string, name: string }[],
  attributes: { id: string, name: string }[],
  scheduleTypes: string[]
}

export type ServerResponse<T> = {
  status:"error",
  error: "notFound"|"unauthorized"|"badRequest"|"loading"|"rateLimited"|"other",
  msg: string|null
} | {status: "ok", result: T}

export type ServerInfo = Pick<Data, "attributes"|"terms"|"subjects"|"scheduleTypes">

export type CourseId = {course: Course, id: string};
export type ServerSearch = {
  results: ({score: number}&CourseId)[],
  numHits: number, npage: number
};

//pls don't store anything using this
export function termIdx(t: Term) {
  const i = termPre.findIndex((v) => t.startsWith(v));
  return Number.parseInt(t.slice(termPre[i].length))*termPre.length + i;
}

export function creditStr(course: Course) {
  let out;
  if (course.credits.type=="range") {
    out=`${course.credits.min} to ${course.credits.max} credits`;
  } else {
    const lv = course.credits.values[course.credits.values.length-1];
    out=`${lv} credit${lv==1 ? "" : "s"}`;
    if (course.credits.values.length>1)
      out=`${course.credits.values.slice(0,-1).join(", ")} or ${out}`;
  }

  return out;
}

//latest section first
export function sectionsByTerm(course: Course) {
  return ([...Object.entries(course.sections)] as [Term,Section[]][])
    .sort(([a,x],[b,y]) => termIdx(b)-termIdx(a));
}

export function instructorsForTerm(course: Course, term: Term) {
  const all = course.sections[term].flatMap(x => x.instructors);
  const primary = new Map(all.filter(x => x.primary).map(x=>[x.name,x]));
  return [...primary.values(), ...new Map(all.filter(x => !primary.has(x.name))
    .map(x=>[x.name,x])).values()];
}

export function instructorStr(course: Course) {
  const t = latestTerm(course);
  const arr = [...new Set(course.sections[t].flatMap(x=>x.instructors)
    .filter(x=>x.primary).map(x=>x.name))];
  const [instructors, extra] = [arr.slice(0,2), arr.length<=2 ? null : arr.length-2];
  return `${instructors.length==0 ? `No instructors assigned for ${formatTerm(t)}`
    : instructors.join(", ")} ${extra!=null && ` and ${extra} other${extra==1 ? "" : "s"}`}`;
}

export function formatTerm(t: Term) {
  const x = termPre.find((v) => t.startsWith(v))!;
  return `${x[0].toUpperCase()}${x.slice(1)} ${t.slice(x.length)}`;
}

export function latestTerm(course: Course, restrict?: Term[]): Term {
  let latest=null, idx=-1;
  for (const k in course.sections) {
    const v = termIdx(k as Term);
    if (v>idx && (restrict===undefined || restrict.includes(k as Term)))
      idx=v, latest=k as Term;
  }

  if (latest==null) throw "no terms!";
  return latest;
}