"use client"

import React, { useContext, useEffect, useState } from "react";
import { ServerResponse } from "../../shared/types";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { NextUIProvider } from "@nextui-org/system";
import { Button } from "./util";
import { useRouter } from "next/navigation";

export type AppModal = {
	type: "error", name: string, msg: string, retry?: () => void
} | {
	type: "other", name?: string, onClose?: () => void, modal: React.ReactNode
};

export type AppCtx = {
	open: (m: AppModal) => void,
	tooltipCount: number, incTooltipCount: ()=>void,
	forward: ()=>void, back: ()=>void
};

export const AppCtx = React.createContext<AppCtx>("context not initialized" as any)

export function usePromise<R>(f: (rerun: () => void) => Promise<R>, deps: any[]): R|null {
	const [ret, setRet] = useState<R|null>(null);
	useEffect(() => {
		const attempt = () => f(() => {
			setRet(null);
			attempt();
		}).then(setRet);
		attempt();
	}, deps);
	return ret;
}

export function useAPI<R,T extends any=null>(endpoint: string, {data, method, handleErr}: {
	data?: T, method?: string, handleErr?: (e: ServerResponse<R>&{status:"error"}) => R|undefined
}={}) {
	const c = useContext(AppCtx);

	const body = JSON.stringify(data); //hehe, cursed
	return usePromise(async (rerun) => {
		try {
			const resp = await (await fetch(`/api/${endpoint}`, {
				method: method ?? "POST", body: data==undefined ? undefined : body
			})).json() as ServerResponse<R>;

			if (resp.status=="error") {
				const recover = handleErr?.(resp);
				if (recover!==undefined) return {
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
				c.open({type: "error", name, msg: resp.msg ?? "Error performing API request.", retry: rerun })
			} else {
				return {res: resp.result, endpoint, req: data};
			}
		} catch(e) {
			console.error(`Fetching ${endpoint}: ${e}`);

			c.open({
				type: "error", name: "Error reaching API",
				msg: `Fetch error: ${e instanceof Error ? e.message : e}. Try refreshing?`, retry: rerun
			});
		}

		return null;
	}, [endpoint, body]);
}

export function AppWrapper({children}: {children: React.ReactNode}) {
	//😒
	const [activeModals, setActiveModals] = useState<AppModal[]>([]);
	const [modalVisible, setModalVisible] = useState<Record<"error"|"other", boolean>>({
		error: false, other: false
	});
	const activeNormals = activeModals.filter(x=>x.type=="other");
	const activeErrors = activeModals.filter(x=>x.type=="error");
	const setVis = (x: "error"|"other", y: boolean) =>
		setModalVisible({...modalVisible, [x]:y});

	let m = <></>;
	if (activeNormals.length>0) {
		const x = activeNormals[activeNormals.length-1];
		m = <Modal isOpen={modalVisible["other"]} onOpenChange={(isOpen) => {
			if (isOpen) return;
			x.onClose?.();
			if (activeNormals.length>1)
				setActiveModals(activeModals.filter(y=>y!=x));
			else setVis("other", false);
		}} backdrop="blur" placement="center" >
			<ModalContent>
				{(close) => (
					<>
						{x.name && <ModalHeader className="font-display font-extrabold text-2xl" >{x.name}</ModalHeader>}
						<ModalBody> {x.modal} </ModalBody>
						<ModalFooter className="py-2" >
							<Button onClick={close} >Close</Button>
							{activeModals.length>1 && <Button onClick={() => {
								setVis("other", false);
							}} className="bg-red-800" >Close all</Button>}
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	}
	
	if (activeErrors.length>0) {
		const x = activeErrors[activeErrors.length-1];
		const retry = x.retry!=undefined ? x.retry : null;
		m = <>{m}<Modal isOpen={modalVisible["error"]} onOpenChange={(isOpen) => {
			if (isOpen) return;
			if (activeErrors.length>1) setActiveModals(activeModals.filter(y=>y!=x));
			else setVis("error", false);
		}} className="bg-red-900" backdrop="blur"
			placement="bottom-center" >
			<ModalContent>
				{(close) => (
					<>
						{x.name && <ModalHeader className="font-display font-extrabold text-2xl" >{x.name}</ModalHeader>}
						<ModalBody> <p>{x.msg}</p> </ModalBody>
						<ModalFooter className="py-2" >
							{retry ?  <Button onClick={() => {close(); retry();}} >Retry</Button>
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
		if (it!=null) {
			setBackUrls(JSON.parse(it));
			window.localStorage.removeItem("backUrl");
		}
	});

  return (<NextUIProvider>
		<AppCtx.Provider value={{open: (m) => {
				if (!modalVisible[m.type]) {
					setActiveModals([...activeModals.filter(x=>x.type!=m.type), m]);
					setVis(m.type, true);
				} else setActiveModals([...activeModals, m]);
			}, tooltipCount: count,
				incTooltipCount: () => setCount(x=>x+1),
				forward() {
					window.localStorage.setItem("backUrl", JSON.stringify([...backUrls, window.location.href]));
				}, back() {
					if (backUrls.length==0) router.push("/");
					else {
						window.localStorage.setItem("backUrl", JSON.stringify(backUrls.slice(0,-1)));
						router.push(backUrls[backUrls.length-1]);
					}
				},
			}}>

			{m}
			{children}
		</AppCtx.Provider>
  </NextUIProvider>);
}