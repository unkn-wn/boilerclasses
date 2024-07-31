import { ChildProcess, exec, spawn } from "node:child_process";
import { promisify } from "node:util";

//im too sucky at bash for this
//really bad script, look away!

const start = Number.parseInt(process.argv[2]);
const sep = process.argv.indexOf("sep");
if (sep==-1) throw "separate arguments";

const terms = process.argv.slice(3);

for (let i=0;i<terms.length;i++) {
	console.log(`term ${i+1}: ${terms[i]}, saving to ../data/courses_${start+i+1}.json and loading from ./data/courses_${start+i}`);
	const cmd = `npx tsx ./fetch.ts ${process.argv.slice(sep+1).join(" ")}${start+i>0 ? ` -i ../data/courses_${start+i}.json` : ""} -o ../data/courses_${start+i+1}.json -t ${terms[i]}`;
	console.log(`running: ${cmd}`);
	const x = spawn(cmd, {shell: true, stdio: "inherit"});
	await new Promise<void>((res,req)=>x.once("exit", ()=>res()));
}