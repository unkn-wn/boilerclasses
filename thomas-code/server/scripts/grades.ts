import { Grade, grades, Term, termPre } from "../../shared/types";
import * as XLSX from 'xlsx';

export type Grades = {
	subject: string,
	course: string,
	term: Term,
	instructor: string,
	data: Partial<Record<Grade, number>>
};

export async function getGrades(buf: ArrayBuffer): Promise<Grades[]> {
	console.log("loading grades from buffer...");
	const excel = XLSX.read(buf);

	console.log("reading grades...");
	const out: Grades[] = [];
	for (const [_, sheet] of Object.entries(excel.Sheets).reverse()) {
		const data: Record<number, (string|number)>[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

		let maxC = 0;
		for (const r of data) {
			maxC=Math.max(maxC, ...Object.keys(r).map(Number));
		}

		let headerFound=false, gradeHeaderFound=false;
		const header: (string|null)[] = [];
		let gradeHeader: [Grade, number][]=[];
		let headerI=0;

		for (let i=0; i<data.length; i++) {
			for (const j in data[i]) {
				if (data[i][j]=="Academic Period" && !headerFound) {
					for (let c=0; c<maxC; c++) {
						const x = data[i][c];
						if (typeof x=="string") header.push(x);
						else header.push(null);
					}

					headerFound=true;
					headerI=i;
				} else if (data[i][j]=="A" && !gradeHeaderFound) {
					for (const c in data[i]) {
						const e = data[i][c];
						if (typeof e=="string" && (grades as string[]).includes(e))
							gradeHeader.push([e as Grade, Number(c)]);
					}

					gradeHeaderFound=true;
					headerI=i;
				}
			}
		}

		if (!headerFound || !gradeHeaderFound) throw "header not found";

		let o: Record<string,string>={};
		for (let i=headerI+1; i<data.length; i++) {
			const row=data[i];
			const nums = Object.keys(row).map(Number);

			o ={
				...o,
				...Object.fromEntries(nums.map(i => [header[i], row[i]])
					.filter(([k,v]) => typeof v == "string"))
			};

			let term=o["Academic Period Desc"]==undefined ? o["Academic Period"] : o["Academic Period Desc"];
			if (term===undefined) throw "term not found";
			const parts = term.split(" ");
			const termTy = parts[0].toLowerCase();
			if (!termPre.includes(termTy) || parts.length!=2) throw "invalid term";

			let grades: null|Partial<Record<Grade,number>> =
				Object.fromEntries(gradeHeader.map(([x,i]) => {
					if (row[i]=="" || row[i]==undefined) return [x,0];
					if (typeof row[i] != "number") throw "grade not a number";
					return [x,row[i]];
				})) as Partial<Record<Grade,number>>;

			let tot=0;
			for (const v of Object.values(grades)) tot+=v;
			if (tot==0) {
				continue; //no grades reported, apparently. discard
			} else {
				tot/=100;
				for (const k of Object.keys(grades))
					grades[k as Grade]!/=tot;
			}

			let subject:string, course:string;
			if (o["Course Number"]!==undefined) {
				subject=o["Subject"], course=o["Course Number"];
			} else {
				const split = o["Course"].length-5;
				subject=o["Course"].slice(0,split);
				course=o["Course"].slice(split);
			}

			out.push({
				subject, course, data: grades,
				term: `${termTy}${parts[1]}` as Term,
				instructor: o["Instructor"]
			});
		}
	}

	return out;
}