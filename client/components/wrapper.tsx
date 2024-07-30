import React, { useContext, useEffect, useState } from "react";
import { ServerResponse } from "../../shared/types";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { NextUIProvider } from "@nextui-org/system";
import { Button } from "./util";

export type AppModal = {
	type: "error", name: string, msg: string, retry?: () => void
} | {
	type: "other", name?: string, onClose?: () => void, modal: React.ReactNode
};

export type AppCtx = { open: (m: AppModal) => void, tooltipCount: number, incTooltipCount: ()=>void };
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

export function useAPI<R,T extends any=null>(endpoint: string, data?: T, method="POST") {
	const c = useContext(AppCtx);

	const body = JSON.stringify(data);
	return usePromise(async (rerun) => {
		try {
			const start = performance.now()
			const resp = await (await fetch(`/api/${endpoint}`, {
				method, body: data==undefined ? undefined : body
			})).json() as ServerResponse<R>;
			const dur = performance.now()-start;

			if (resp.status=="error") {
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
				return {res: resp.result, msTaken: dur, endpoint, req: data};
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
	const [activeModals, setActiveModals] = useState<AppModal[]>([]);
	const [modalVisible, setModalVisible] = useState<boolean>(false);

	let m = <></>;
	if (activeModals.length>0) {
		const x = activeModals[activeModals.length-1];
		const retry = x.type=="error" && x.retry!=undefined ? x.retry : null;
		m = <Modal isOpen={modalVisible} onOpenChange={(isOpen) => {
			if (isOpen) return;
			if (x.type=="other") x.onClose?.();
			if (activeModals.length>1)
				setActiveModals(activeModals.toSpliced(activeModals.length-1,1));
			else setModalVisible(false);
		}} className={x.type=="error" ? "bg-red-900" : ""} backdrop="blur"
			placement={x.type=="error" ? "bottom-center" : "center"} >
			<ModalContent>
				{(close) => (
					<>
						{x.name && <ModalHeader className="font-display font-extrabold text-2xl" >{x.name}</ModalHeader>}
						<ModalBody>
							{x.type=="error" ? <p>{x.msg}</p> : x.modal}
						</ModalBody>
						<ModalFooter>
							{retry ?
								<Button onClick={() => {close(); retry();}} >Retry</Button>
								: <Button onClick={close} >Close</Button>
							}
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	}

	const [count, setCount] = useState(0);

  return (<NextUIProvider>
		<AppCtx.Provider value={{open: (m) => {
			if (!modalVisible) {
				setActiveModals([m]);
				setModalVisible(true);
			} else setActiveModals([...activeModals, m]);
		}, tooltipCount: count, incTooltipCount: () => setCount(x=>x+1) }}>
			{m}
			{children}
		</AppCtx.Provider>
  </NextUIProvider>);
}