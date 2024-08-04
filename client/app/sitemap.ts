import { MetadataRoute } from 'next'
import { api } from "./server";
 
type ServerAll = {
	courses: {id: number, lastUpdated: string}[],
	instructors: {id: number, lastUpdated: string}[]
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const all: ServerAll = await api("all");

	type X = ServerAll["courses"][0]&{type: "course"|"prof"};
	const a = [
		...all.courses.map((x):X=>({...x, type: "course"})),
		...all.instructors.map((x):X=>({...x, type: "prof"}))
	];

  return a.map(x => ({
		url: new URL(`/${x.type}/${x.id}`, process.env.NEXT_PUBLIC_ROOT_URL!).href,
		lastModified: new Date(x.lastUpdated)
	}));
}