import { Metadata, ResolvingMetadata } from "next";
import { courseById, getInfo } from "@/app/server";
import { CourseDetailApp } from "./course";

export async function generateMetadata(
  { params }: {params: {id: string}},
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
	const course = await courseById(id);

	const title = `${course.subject}${course.course}: ${course.name} at Purdue`;
	// const short = `${course.subject}${course.course}`;
  return {
    title: title,
		description: course.description,
		openGraph: {
			url: `/course/${params.id}`,
			type: "website", title, description: course.description,
			images: [`/course/${params.id}/thumb`]
		},
		twitter: {
			card: "summary_large_image",
			title, description: course.description,
			images: [`/course/${params.id}/thumb`]
		}
  }
}

export default async function Page({ params }: {params: {id: string}}) {
	const course = await courseById(params.id);
	const info = await getInfo();
	return <CourseDetailApp course={course} info={info} />;
}