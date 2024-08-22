import { makeThumbnail, profById } from "../../../server";
import { capitalize } from "@/components/util";
 
export const runtime = "edge";
 
export async function GET(request: Request, {params: {id}}: {params: {id: string}}) {
  const i = (await profById(Number.parseInt(id)));

	let title = i.instructor.title!=null ? capitalize(i.instructor.title) : "Instructor";
  return makeThumbnail(i.instructor.name, title + " at Purdue University");
}