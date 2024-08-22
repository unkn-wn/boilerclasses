import * as cheerio from "cheerio";
import { Cheerio } from "cheerio";
import { readFile } from "node:fs/promises";
import { ProxyAgent } from "undici";
import cliProgress from "cli-progress";

const userAgent = "boilerclasses scraper";

let dispatchers: (ProxyAgent|undefined)[] = [undefined];
let waiters: (()=>void)[] = [];

export function shuffle<T>(arr: T[]) {
	for (let i=1; i<arr.length; i++) {
		const j = Math.floor(Math.random()*(i+1));
		const x = arr[j];
		arr[j]=arr[i];
		arr[i]=x;
	}
}

export async function addProxies(proxiesPath: string) {
	const prox: string[] = JSON.parse(await readFile(proxiesPath, "utf-8"));
	console.log(`adding ${prox.length} proxies`);
	for (const p of prox) {
		const parts = p.split(":");
		if (parts.length!=2 && parts.length!=4)
			throw `expected 2 (host,port) or 4 parts (host,port,user,pass) for proxy ${p}`;
		dispatchers.push(new ProxyAgent({
			uri: `http://${parts[0]}:${parts[1]}`,
			token: parts.length==2 ? undefined : `Basic ${Buffer.from(`${parts[2]}:${parts[3]}`).toString('base64')}`
		}));
	}
	shuffle(dispatchers);
}

const dispatcherWait = 1000, dispatcherErrorWait = 30_000;

export async function fetchDispatcher<T>(transform: (r: Response) => Promise<T>, ...args: Parameters<typeof fetch>): Promise<T> {
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

//purdue catalog specific
async function loadAndCheckRatelimit(x: Response): Promise<cheerio.CheerioAPI> {
	const c = cheerio.load(await x.text());
	if (c("body").text().trim()=="We are sorry, but the site has received too many requests. Please try again later.")
		throw "ratelimited";
	return c;
}

export async function getHTML(url: string, qparams: Record<string,string>={}) {
	const u = new URL(url);
	for (const [k,v] of Object.entries(qparams))
		u.searchParams.append(k,v);
	return await fetchDispatcher(loadAndCheckRatelimit, u);
}

export async function postHTML(url: string, form: [string,string][]=[]) {
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

export function tableToObject(c: cheerio.CheerioAPI, tb: Cheerio<cheerio.Element>) {
	tb = tb.children();
	const hdr = tb.first().children().toArray().map(e => c(e).text().trim());
	const rest = tb.slice(1).toArray()
		.map(e => c(e).children().toArray().map(f => c(f).text().trim()));
	return rest.map((row) => Object.fromEntries(hdr.map((h,i) => [h,row[i]])));
}

export const ords = ["first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"];

export function logArray<T, R>(x: T[], y: (x:T) => Promise<R>, name: (x:T,i:number)=>string): Promise<PromiseSettledResult<Awaited<R>>[]> {
	console.log(`beginning operation on ${x.length} objects`);

	const bar = new cliProgress.SingleBar({
		format: "[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | finished {last}"
	}, cliProgress.Presets.shades_classic);
	bar.start(x.length, 0);

	return Promise.allSettled(x.map((p,i) => y(p).finally(() => {
		bar.increment(1,{ last: name(p,i) });
	}).catch((reason) => {
		console.log(`object ${name(p,i)} failed: ${reason}`);
		throw reason;
	}))).then((x) => {
		console.log("done");
		return x;
	}).finally(() => {
		bar.stop();
	});
}