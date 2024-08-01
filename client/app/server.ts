//utilities for server...
//you shouldn't use any of these from non-server components

import { notFound } from "next/navigation";
import { CourseId, ServerInfo, ServerResponse } from "../../shared/types";

//a much worse api wrapper for server
export const api = <T,>(endpoint: string, data?: any): Promise<T> =>
	fetch(`${process.env.SERVER_URL}/${endpoint}`, {
		method: "POST",
		body: data==undefined ? undefined : JSON.stringify(data),
		cache: "no-store"
	}).then((res) => res.json() as Promise<ServerResponse<T>>)
		.then((res) => {
			if (res.status=="error") {
				if (res.error=="notFound") notFound();
				throw new Error(`couldn't fetch ${endpoint}: ${res.error} - ${res.msg}`)
			}
			return res.result;
		});

export const courseById = (id: string): Promise<CourseId> => api("course", id)
export const getInfo = (): Promise<ServerInfo> => api("info")