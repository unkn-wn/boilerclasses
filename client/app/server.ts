"use server" //like you shouldn't use any of these from client so this is useless

//utilities for server...

import { notFound } from "next/navigation";
import { Course, ServerInfo, ServerResponse } from "../../shared/types";

//a much worse api wrapper for server
export const api = <T,>(endpoint: string, data?: any): Promise<T> =>
	fetch(`${process.env.SERVER}/${endpoint}`, {
		method: "POST", body: data==undefined ? undefined : JSON.stringify(data)
	}).then((res) => res.json() as Promise<ServerResponse<T>>)
		.then((res) => {
			if (res.status=="error") {
				if (res.error=="notFound") notFound();
				throw new Error(`couldn't fetch ${endpoint}: ${res.error} - ${res.msg}`)
			}
			return res.result;
		});

export const courseById = (id: string): Promise<Course> => api("course", id)
export const getInfo = (): Promise<ServerInfo> => api("info")