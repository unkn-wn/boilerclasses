import { Metadata } from "next";
import { courseById, getInfo } from "@/app/server";
import { CourseDetailApp } from "./course";

export async function generateMetadata(
  { params }: {params: {id: string}},
): Promise<Metadata> {
	const id = Number.parseInt(params.id);
	const course = await courseById(id);

	const title = `${course.subject}${course.course}: ${course.name} at Purdue`;

  return {
    title: title,
		description: course.description,
		openGraph: {
			url: `/course/${id}`,
			type: "website", title, description: course.description,
			images: [`/course/${id}/thumb`]
		},
		twitter: {
			card: "summary_large_image",
			title, description: course.description,
			images: [`/course/${id}/thumb`]
		}
  }
}

export default async function Page({ params }: {params: {id: string}}) {
	const id = Number.parseInt(params.id);
	const course = await courseById(id);
	const info = await getInfo();
	return <CourseDetailApp course={course} id={id} info={info} />;
}