import { courseById, makeThumbnail } from "../../../server";
import { creditStr, formatTerm, instructorStr, sectionsByTerm } from "../../../../../shared/types";

export const runtime = "edge";

export async function GET(request: Request, { params: { id } }: { params: { id: string } }) {
  const course = (await courseById(Number.parseInt(id)));
  const terms = sectionsByTerm(course).map(x => x[0]);

  return makeThumbnail(`${course.subject} ${course.course}: ${course.name}`,
    `${formatTerm(terms[terms.length - 1])} | ${creditStr(course)} | ${instructorStr(course)}`);
}