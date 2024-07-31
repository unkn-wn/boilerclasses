"use client"

import React, { useEffect, useState, PointerEvent, HTMLAttributes, useContext } from "react";
import { Course, Section, ServerInfo, Term } from "../../shared/types";
import { Tooltip, TooltipPlacement } from "@nextui-org/tooltip";
import { twMerge } from "tailwind-merge";
import { AppCtx } from "./wrapper";

export type CourseContextType = {
	course: Course,
	info: ServerInfo,
	term: Term,
	section: Section|null,
	selSection: (section: Section|null) => void,
	selTerm: (term: Term) => void
};

export const CourseContext = React.createContext<CourseContextType>("uninitialized context" as any);

export function useMediaQuery(q: MediaQueryList|string, init: boolean=true) {
	const [x, set] = useState(init);

	useEffect(() => {
		const mq = typeof q=="string" ? window.matchMedia(q) : q;
		const cb = () => set(mq.matches);
		mq.addEventListener("change", cb);
		set(mq.matches);
		return ()=>mq.removeEventListener("change",cb);
	}, [q]);

	return x;
}

let mdMq=null;
try { mdMq = window.matchMedia("(min-width: 768px)"); } catch (e) {}
export const useMd = () => {
	if (mdMq==null) throw "uninitialized media query";
	return useMediaQuery(mdMq);
};

export const IsInTooltipContext = React.createContext(false);

//opens in modal if already in tooltip...
export function AppTooltip({content, children, placement, className, onChange, ...props}: {content: React.ReactNode, placement?: TooltipPlacement, onChange?: (x: boolean)=>void}&Omit<HTMLAttributes<HTMLDivElement>,"content">) {
	const app = useContext(AppCtx);
	const [open, setOpen] = useState(false);
	const [reallyOpen, setReallyOpen] = useState<number|null>(null);
	
	const ctx = useContext(IsInTooltipContext);
	const unInteract = (p: PointerEvent<HTMLDivElement>) => {
		if (!ctx && p.pointerType=="mouse") setOpen(false);
	};

	const interact = (p: PointerEvent<HTMLDivElement>) => {
		if (!ctx && p.pointerType=="mouse") setOpen(true);
	};

	const cc = useContext(CourseContext);

	useEffect(()=>{
		if (open) {
			onChange?.(true);
			app.incTooltipCount();

			if (ctx) {
				//forward course context
				app.open({type: "other", modal: <CourseContext.Provider value={cc} >
					<IsInTooltipContext.Provider value={true} >
						{content}
					</IsInTooltipContext.Provider>
				</CourseContext.Provider>, onClose() {
					onChange?.(false);
				}});
			} else {
				setReallyOpen(app.tooltipCount+1);

				const cb = ()=>setOpen(false);
				document.addEventListener("click",cb);
				return ()=>document.removeEventListener("click",cb);
			}
		} else {
			if (!ctx) onChange?.(false);
			const tm = setTimeout(() => setReallyOpen(null), 500);
			return ()=>clearTimeout(tm);
		}
	}, [open]);

	return <Tooltip showArrow placement={placement} content={
			<IsInTooltipContext.Provider value={true} >{content}</IsInTooltipContext.Provider>
		}
		isOpen={reallyOpen==app.tooltipCount}
		onPointerEnter={interact} onPointerLeave={unInteract} >
		<div className={twMerge("inline-block", className)}
			onPointerEnter={interact} onPointerLeave={unInteract}
			onClick={(ev)=>{
				setOpen(reallyOpen!=app.tooltipCount);
				ev.stopPropagation();
			}} {...props} >

			{children}
		</div>
	</Tooltip>;
}