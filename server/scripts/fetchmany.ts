import { ChildProcess, exec, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

//im too sucky at bash for this
//really bad script, look away!

const start = Number.parseInt(process.argv[2]);
const sep = process.argv.indexOf("sep");
if (sep==-1) throw "separate arguments";

const terms = process.argv.slice(3,sep);

for (let i=0;i<terms.length;i++) {
	const out=`../data/courses_${start+i+1}.json`;
	console.log(`term ${i+1}: ${terms[i]}, saving to ${out} and loading from ../data/courses_${start+i}.json`);
	const cmd = `npx tsx ./fetch.ts ${process.argv.slice(sep+1).join(" ")}${start+i>0 ? ` -i ../data/courses_${start+i}.json` : ""} -o ${out} -t ${terms[i]}`;
	console.log(`running: ${cmd}`);
	const x = spawn(cmd, {shell: true, stdio: "inherit"});
	await new Promise<void>((res,req)=>x.once("exit", ()=>res()));
	if (!existsSync(out)) throw "output doesn't exist";
}