import { searchCourses } from "../../lib/redis"

// example query: FT.SEARCH idx:classes @title:"Computer Architecture"
// searchParam structure: q, subjectCode 

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const q = req.query.q.trim();
    const subjects = req.query.sub;
    const terms = req.query.term;
    const courses = await searchCourses(q, subjects.split(","), terms.split(","));
    res.status(200).json({ courses });
  }
}
