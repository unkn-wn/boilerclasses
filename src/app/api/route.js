import { searchCourses } from "../../lib/redis"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q');
  // const title = searchParams.get('title');
  // const description = searchParams.get('description');
  // const res = await redis.ft.search('idx:classes', `'@title:` + title + `'`, `'@description:` + description + `'`);
  const courses = await searchCourses(q);
  return Response.json({ courses });
}


// example query: FT.SEARCH idx:classes @title:"Computer Architecture"

// searchParam structure: q, subjectCode 