import { ImageResponse } from 'next/og'
import { courseById, getInfo } from "../../../server"
import Image from "next/image"
import { creditStr, formatTerm, instructorStr, sectionsByTerm, Term, termIdx } from "../../../../../shared/types"
import { readFile } from "fs/promises"
 
export const runtime = "edge";
 
export async function GET(request: Request, {params: {id}}: {params: {id: string}}) {
  const course = (await courseById(id)).course, info=await getInfo();
  const terms = sectionsByTerm(course).map(x => x[0]);

  const interSemiBold = await fetch(new URL('../../../../public/Inter-SemiBold.ttf', import.meta.url))
    .then((res) => res.arrayBuffer());
  const interRegular = await fetch(new URL('../../../../public/Inter-Regular.ttf', import.meta.url))
    .then((res) => res.arrayBuffer());
  const icon = await fetch(new URL('../../../../public/icon-color.png', import.meta.url))
    .then((res) => res.arrayBuffer()).then(x => Buffer.from(x).toString("base64"));

  return new ImageResponse(
    (
      <div tw="w-full h-full flex flex-col justify-center items-center bg-stone-900">
        <img src={`data:image/png;base64,${icon}`} alt="logo" height={200} width={200}/>
        <div tw="text-white flex flex-col px-16 pb-16 pt-8 items-center">
          <div tw="flex text-5xl w-full mb-4 items-center text-center" style={{ fontWeight: 500 }}>
            {course.subject} {course.course}: {course.name}
          </div>
          <div tw="flex text-2xl" style={{ fontWeight: 400 }}>
            {formatTerm(terms[terms.length-1])} | {creditStr(course)} | {instructorStr(course)}
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
  )
}