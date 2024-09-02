import { IconBan, IconCircleCheck } from "@tabler/icons-react";
import { Restriction } from "../types";
import { Anchor } from "./util";
import React, { useState } from "react";

function RestrictionCard({ mid, pre, post, exclusive }: { mid: string, pre: string, post: string, exclusive: boolean }) {
	const maxMid = 80;
	const tooBig = mid.length > maxMid;
	const [collapsed, setCollapsed] = useState(true);

	const collapser = <Anchor onClick={() => setCollapsed(!collapsed)}
		className="text-blue-300 inline" >
		{collapsed ? `...show more` : "Show less"}</Anchor>;

	return <div className={`flex flex-row gap-2 p-2 first:rounded-t-xl last:rounded-b-xl ${exclusive ? "bg-rose-900" : "bg-amber-900"}`} >
		<span className="flex-shrink-0" >
			{exclusive ? <IconBan size={20} /> : <IconCircleCheck size={20} />}
		</span>
		<span>
			{exclusive && <span className="font-black font-display mr-1" >
				NO
			</span>}
			{pre}
			<span className="font-bold font-display" >
				{collapsed && tooBig ? mid.slice(0, maxMid - 3) : mid}
			</span>
			{post}

			{tooBig && collapsed ? collapser : (tooBig && !collapsed && <p>{collapser}</p>)}
		</span>
	</div>;
}
function RestrictionEl<T extends Restriction["type"], E extends boolean>({ restriction: r, type, exclusive }: { restriction: Extract<Restriction, { type: T, exclusive: E }>[], type: T, exclusive: E }) {
	let pre = "", mid, post = "";
	const joinOr = <X,>(t: (x: Extract<Restriction, { type: X }>) => string) => {
		const s = (r as any).map(t);
		return `${s.length > 1 ? s.slice(0, -1).join(", ") + " or " : ""}${s[s.length - 1]}`;
	}

	const s = r.length != 1 ? "s" : "";
	switch (type) {
		case "class": mid = joinOr<"class">(x => {
			let b = `${x.class == "Freshman" ? "Freshmen" : `${x.class}s`}`
			if (x.class == "Professional") b += ` (year ${x.year})`;
			else b += ` (${x.minCredit}${x.maxCredit == null ? "+" : `-${x.maxCredit}`} credits)`
			return b;
		}); break;
		case "cohort": pre = `Cohort${s}  `; mid = joinOr<"cohort">(x => x.cohort); break;
		case "college": pre = "Students of "; mid = joinOr<"college">(x => x.college); break;
		case "degree": mid = joinOr<"degree">(x => x.degree); post = ` degree${s}`; break;
		case "level": mid = joinOr<"level">(x => `${x.level}s`); break;
		case "major": mid = joinOr<"major">(x => `${x.major}`); post = ` major${s}`; break;
		case "program": pre = `Program${s} `; mid = joinOr<"program">(x => `${x.program}`); break;
	}

	if (mid == null) throw "mid not initialized";

	return <RestrictionCard mid={mid} pre={pre} post={post} exclusive={exclusive} />;
}

export function Restrictions({ restrictions }: { restrictions: Restriction[] }) {
	if (restrictions.length == 0) return <></>;

	const byTy: { [T in Restriction["type"]]?: (Restriction & { type: T })[] } = {};
	for (const r of restrictions) {
		const x = byTy[r.type];
		//@ts-ignore
		if (x == undefined) byTy[r.type] = [r];
		//@ts-ignore
		else x.push(r); //damn i broke typescript
	}

	return <>
		<h2 className="text-2xl font-display font-extrabold" >
			Restrictions
		</h2>
		<div className={`flex flex-col relative border border-zinc-700 mt-2 rounded-xl`} >
			{Object.entries(byTy).map(([ty, v], i) => {
				const exc = v.filter(x => x.exclusive);
				const nonExc = v.filter(x => !x.exclusive);

				return <React.Fragment key={i} >
					{exc.length > 0 && <RestrictionEl restriction={exc} type={ty as Restriction["type"]} exclusive />}
					{nonExc.length > 0 && <RestrictionEl restriction={nonExc} type={ty as Restriction["type"]} exclusive={false} />}
				</React.Fragment>;
			})}
		</div>
	</>;
}