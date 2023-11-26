import { searchCourses } from "../../lib/redis"

// example query: FT.SEARCH idx:classes @title:"Computer Architecture"
// searchParam structure: q, subjectCode 

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const q = req.query.q.trim();
    const subjects = req.query.sub;
    console.log(subjects)
    // const description = searchParams.get('description');
    // const res = await redis.ft.search('idx:classes', `'@title:` + title + `'`, `'@description:` + description + `'`);
    const courses = await searchCourses(q);
    res.status(200).json({ courses });
  }
}
