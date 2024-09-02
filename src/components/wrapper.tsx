"use client"

import React, { useContext, useEffect, useRef, useState } from "react";
import { Course, ServerInfo, ServerResponse } from "../types";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { NextUIProvider } from "@nextui-org/system";
import { Button } from "./util";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

export type AppModal = {
	type: "error", name: string, msg: string, retry?: () => void
} | {
	type: "other", name?: string, onClose?: () => void, modal: React.ReactNode
};

export type AppCtx = {
	open: (m: AppModal) => void,
	tooltipCount: number, incTooltipCount: () => void,
	forward: () => void, back: () => void,
	info: ServerInfo
};

export const AppCtx = React.createContext<AppCtx>("context not initialized" as any)

export function usePromise<R>(f: (rerun: () => void) => Promise<R | null>, deps: any[]): R | null {
	const [ret, setRet] = useState<R | null>(null);

	const i = useRef(0);
	useEffect(() => {
		const oi = ++i.current;
		const attempt = () => f(attempt)
			.then((x) => {
				if (x != null && i.current == oi) setRet(x);
			});
		attempt();
	}, deps);

	return ret;
}

const cache: Record<string, Promise<any>> = {};

export function setAPI<R, T extends any = null>(endpoint: string, { data, method, result }: {
	data?: T, method?: string, result: R
}) {
	const r: ServerResponse<R> = { status: "ok", result };
	cache[`${method ?? "POST"} ${endpoint}\n${JSON.stringify(data)}`] = Promise.resolve(r);
}

export function useAPI<R, T extends any = null>(endpoint: string, { data, method, handleErr, defer }: {
	data?: T, method?: string,
	handleErr?: (e: ServerResponse<R> & { status: "error" }) => R | undefined,
	defer?: boolean
} = {}) {
	const c = useContext(AppCtx);

	const body = JSON.stringify(data); //hehe, cursed
	return usePromise(async (rerun) => {
		if (defer) return;

		try {
			const k = `${method ?? "POST"} ${endpoint}\n${body}`;

			let cacheBad = cache[k] == undefined;
			while (true) {
				try {
					const t = cache[k];
					const r = await t;
					if (t != cache[k]) continue;
					if (r.status != "ok") cacheBad = true;
				} catch (e) {
					cacheBad = true;
				};

				break;
			}

			if (cacheBad) {
				cache[k] = fetch(`/api/${endpoint}`, {
					method: method ?? "POST", body: data == undefined ? undefined : body,
				}).then(x => x.json());
			}

			const resp = await cache[k] as ServerResponse<R>;

			if (resp.status == "error") {
				const recover = handleErr?.(resp);
				if (recover !== undefined) return {
					res: recover, endpoint, req: data
				};

				let name = "Unknown error";
				switch (resp.error) {
					case "badRequest": name = "Bad Request"; break;
					case "loading": name = "Loading"; break;
					case "notFound": name = "Not Found"; break;
					case "other": name = "Other Error"; break;
					case "rateLimited": name = "Rate Limited"; break;
					case "unauthorized": name = "Unauthorized"; break;
				}

				console.error(resp);
				c.open({ type: "error", name, msg: resp.message ?? "Error performing API request.", retry: rerun })
			} else {
				return { res: resp.result, endpoint, req: data };
			}
		} catch (e) {
			console.error(`Fetching ${endpoint}: ${e}`);

			c.open({
				type: "error", name: "Error reaching API",
				msg: `Fetch error: ${e instanceof Error ? e.message : e}. Try refreshing?`, retry: rerun
			});
		}

		return null;
	}, [endpoint, body, defer]);
}

export const useInfo = (): ServerInfo => useContext(AppCtx).info;
export const useCourse = (id: number): Course | null =>
	useAPI<Course, number>("course", { data: id })?.res ?? null;

export function AppWrapper({ children, className, info }: { children: React.ReactNode, className?: string, info: ServerInfo }) {
	//😒
	const [activeModals, setActiveModals] = useState<AppModal[]>([]);
	const [modalVisible, setModalVisible] = useState<Record<"error" | "other", boolean>>({
		error: false, other: false
	});
	const activeNormals = activeModals.filter(x => x.type == "other");
	const activeErrors = activeModals.filter(x => x.type == "error");
	const setVis = (x: "error" | "other", y: boolean) =>
		setModalVisible({ ...modalVisible, [x]: y });

	let m = <></>;
	if (activeNormals.length > 0) {
		const x = activeNormals[activeNormals.length - 1];
		m = <Modal isOpen={modalVisible["other"]} onOpenChange={(isOpen) => {
			if (isOpen) return;
			x.onClose?.();
			if (activeNormals.length > 1)
				setActiveModals(activeModals.filter(y => y != x));
			else setVis("other", false);
		}} backdrop="blur" placement="center" >
			<ModalContent>
				{(close) => (
					<>
						{x.name && <ModalHeader className="font-display font-extrabold text-2xl" >{x.name}</ModalHeader>}
						<ModalBody> {x.modal} </ModalBody>
						<ModalFooter className="py-2" >
							<Button onClick={close} >Close</Button>
							{activeModals.length > 1 && <Button onClick={() => {
								setVis("other", false);
							}} className="bg-red-800" >Close all</Button>}
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	}

	if (activeErrors.length > 0) {
		const x = activeErrors[activeErrors.length - 1];
		const retry = x.retry != undefined ? x.retry : null;
		m = <>{m}<Modal isOpen={modalVisible["error"]} onOpenChange={(isOpen) => {
			if (isOpen) return;
			if (activeErrors.length > 1) setActiveModals(activeModals.filter(y => y != x));
			else setVis("error", false);
		}} className="bg-red-900" backdrop="blur"
			placement="bottom-center" >
			<ModalContent>
				{(close) => (
					<>
						{x.name && <ModalHeader className="font-display font-extrabold text-2xl" >{x.name}</ModalHeader>}
						<ModalBody> <p>{x.msg}</p> </ModalBody>
						<ModalFooter className="py-2" >
							{retry ? <Button onClick={() => { close(); retry(); }} >Retry</Button>
								: <Button onClick={close} >Close</Button>
							}
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal></>;
	}

	const [count, setCount] = useState(0);

	const [backUrls, setBackUrls] = useState<string[]>([]);
	const router = useRouter();

	useEffect(() => {
		const it = window.localStorage.getItem("backUrl");
		if (it != null) {
			setBackUrls(JSON.parse(it));
			window.localStorage.removeItem("backUrl");
		}
	}, []);

	return (<NextUIProvider>
		<AppCtx.Provider value={{
			open: (m) => {
				if (!modalVisible[m.type]) {
					setActiveModals([...activeModals.filter(x => x.type != m.type), m]);
					setVis(m.type, true);
				} else setActiveModals([...activeModals, m]);
			}, tooltipCount: count,
			incTooltipCount: () => setCount(x => x + 1),
			forward() {
				window.localStorage.setItem("backUrl", JSON.stringify([...backUrls, window.location.href]));
			}, back() {
				if (backUrls.length == 0) router.push("/");
				else {
					const nb = backUrls.slice(0, -1);
					window.localStorage.setItem("backUrl", JSON.stringify(nb));
					router.push(backUrls[backUrls.length - 1]);
					//happens in the very rare case that back urls get fucked up (e.g. due to load timing / maybe refreshing the current page after opening a new one) and we end up pushing the same url, in which case the page does not refresh
					setBackUrls(nb);
				}
			}, info
		}}>

			{m}
			<div id="parent" className={twMerge("flex flex-col bg-neutral-950 container mx-auto p-4 lg:px-14 lg:mt-5 gap-5 max-w-screen-xl", className)}>
				{children}
			</div>
		</AppCtx.Provider>
	</NextUIProvider>);
}