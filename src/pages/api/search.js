import { searchCourses } from "../../lib/redis"

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const q = req.query.q.trim();
    const subjects = req.query.sub;
    const terms = req.query.term;
    const gen = req.query.gen;
    const cmin = req.query.cmin;
    const cmax = req.query.cmax;
    const lmin = req.query.lmin;
    const lmax = req.query.lmax;
    const courses = await searchCourses(q, subjects.split(","), terms.split(","), gen.split(","), cmin, cmax, lmin, lmax);
    res.status(200).json({ courses });
  }
}