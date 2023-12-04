import { searchCourses } from "../../lib/redis"

// example query: FT.SEARCH idx:classes @title:"Computer Architecture"
// searchParam structure: q, subjectCode 

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const q = req.query.q.trim();
    const subjects = req.query.sub;
    const terms = req.query.term;
    const gen = req.query.gen;
    // const cmin = req.query.cmin;
    // const cmax = req.query.cmax;
    const courses = await searchCourses(q, subjects.split(","), terms.split(","), gen.split(","));
    res.status(200).json({ courses });
  }
}