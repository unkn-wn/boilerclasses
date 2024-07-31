import { MetadataRoute } from 'next'
import { api } from "./server";
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const allCourses: {id: string, lastUpdated: string}[] = await api("all");

  return allCourses.map(x => ({
		url: new URL(`/course/${x.id}`, process.env.NEXT_PUBLIC_ROOT_URL!).href,
		lastModified: new Date(x.lastUpdated)
	}));
}