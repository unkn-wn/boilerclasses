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

export const termPre = ["spring", "fall", "summer", "winter"];
export type Term = `${"spring" | "fall" | "summer" | "winter"}${number}`

export type RMPInfo = {
	avgDifficulty: number,
	avgRating: number,
	rmpUrl: string,
	numRatings: number,
	wouldTakeAgainPercent: number
};

export type Instructor = {
  name: string,
  grade: Partial<Record<Grade, number>>|null,
  gpa: number|null
};

export type Day = "M"|"T"|"W"|"R"|"F"|"S";

export type Seats = {
  used: number, left: number
};

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
  
  instructors: {
    name: string,
    primary: boolean
  }[]
};

export const validDays = new Set<Day>(["M","T","W","R","F","S"]);

export type Course = {
  name: string,
  subject: string,
  course: number, //5 digits
  instructor: Record<Term, Instructor[]>,
  sections: Record<Term, Section[]>,

  lastUpdated: string,

  description: string,
  credits: {type: "range", min: number, max: number}|{type: "fixed", values: number[]},
  attributes: string[],
  prereqs: PreReqs | "failed" | "none", //may fail to parse
  restrictions: Restriction[]
};

export function normalizeName(name: string) {
  return name.split(",").reverse().join(" ").toLowerCase()
    .replaceAll(/\s+/g, " ").trim().replaceAll(/[^a-z ]/g,"");
}

export function compareName(x: string, y: string) {
  if (x==y) return true;
  const s = new Set(x.split(" "));
  let cnt=0;
  for (const z of y.split(" "))
    if (s.has(z)) if (++cnt >= 2) return true;
  return false;
}

export const gradeGPA: Partial<Record<Grade, number>> = {
  ...Object.fromEntries([
    "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A"
  ].map((x,i) => [x,(i%3==0 ? 0.7 : (i%3==1 ? 1 : 1.3)) + Math.floor(i/3)])),
  "A+": 4, "E": 0, "F": 0
};

export type Data = {
  courses: Course[],
  rmp: Record<string, RMPInfo>,
  terms: Partial<Record<Term,{ id: string, name: string, lastUpdated: string }[]>>,
  subjects: { abbr: string, name: string }[],
  attributes: { id: string, name: string }[]
}

export type ServerResponse<T> = {
  status:"error",
  error: "notFound"|"unauthorized"|"badRequest"|"loading"|"rateLimited"|"other",
  msg: string
} | {status: "ok", result: T}

export type ServerInfo = Pick<Data, "attributes"|"terms"|"subjects">

async function load() {
	const info: ServerResponse<ServerInfo> = await (await fetch("/api/info")).json();
}