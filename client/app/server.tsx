//utilities for server...
//you shouldn't use any of these from non-server components

import { notFound } from "next/navigation";
import { Course, CourseId, InstructorId, ServerInfo, ServerResponse } from "../../shared/types";
import { ImageResponse } from "next/og";

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
				throw new Error(`couldn't fetch ${endpoint}: ${res.error} - ${res.message}`)
			}
			return res.result;
		});

export const courseById = (id: number): Promise<Course> => api("course", id)
export const profById = (id: number): Promise<InstructorId> => api("prof", id)

export const getInfo = (): Promise<ServerInfo> => api("info")

export async function makeThumbnail(title: string, sub: string) {
	const interSemiBold = await fetch(new URL('../public/Inter-SemiBold.ttf', import.meta.url))
		.then((res) => res.arrayBuffer());
	const interRegular = await fetch(new URL('../public/Inter-Regular.ttf', import.meta.url))
		.then((res) => res.arrayBuffer());
	const icon = await fetch(new URL('../public/icon-color.png', import.meta.url))
		.then((res) => res.arrayBuffer()).then(x => Buffer.from(x).toString("base64"));

	return new ImageResponse(
		(
			<div tw="w-full h-full flex flex-col justify-center items-center bg-stone-900">
				<img src={`data:image/png;base64,${icon}`} alt="logo" height={200} width={200}/>
				<div tw="text-white flex flex-col px-16 pb-16 pt-8 items-center">
					<div tw="flex text-5xl w-full mb-4 items-center text-center" style={{ fontWeight: 500 }}>
						{title}
					</div>
					<div tw="flex text-2xl" style={{ fontWeight: 400 }}>
						{sub}
					</div>
				</div>
			</div>
		),
		{ 
			width: 1200, 
			height: 628, 
			fonts: [
				{
					name: 'Inter',
					data: interRegular,
					style: 'normal',
					weight: 400,
				},
				{
					name: 'Inter',
					data: interSemiBold,
					style: 'normal',
					weight: 500,
				},
			]
		}
	);
}