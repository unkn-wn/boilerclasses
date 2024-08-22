import { Metadata } from "next";
import { getInfo, profById } from "@/app/server";
import { InstructorApp } from "./instructor";
import { capitalize } from "@/components/util";

export async function generateMetadata(
  { params }: {params: {id: string}},
): Promise<Metadata> {
	const i = await profById(Number.parseInt(params.id));

	const title = `${i.instructor.name} at Purdue`;
	const fs = i.instructor.name.split(/\s+/);
	const first=fs.length==0 ? undefined : fs[0], last=fs.length<=1 ? undefined : fs[fs.length-1];
	const desc = i.instructor.title==null ? "Instructor at Purdue University" : capitalize(i.instructor.title);

  return {
    title: title,
		description: desc,
		openGraph: {
			type: "profile",
			url: `/prof/${i.id}`,
			images: [`/prof/${i.id}/thumb`],
			firstName: first, lastName: last,
			username: i.instructor.email
		},
		twitter: {
			card: "summary_large_image",
			title, description: desc, 
			images: [`/course/${i.id}/thumb`]
		}
  }
}

export default async function Page({ params }: {params: {id: string}}) {
	const i = await profById(Number.parseInt(params.id));
	const info = await getInfo();
	return <InstructorApp instructor={i} info={info} />;
}