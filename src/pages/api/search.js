import { searchCourses } from "../../lib/redis"

// Query params may be missing (bots, malformed links) or repeated (arrays).
// Normalize to a string so .trim()/.split() never throw.
const param = (value, fallback = "") => {
  if (Array.isArray(value)) return value.join(",");
  return value ?? fallback;
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const q = param(req.query.q).trim();
    const subjects = param(req.query.sub);
    const terms = param(req.query.term);
    const gen = param(req.query.gen);
    const cmin = param(req.query.cmin, "0");
    const cmax = param(req.query.cmax, "18");
    const levels = param(req.query.levels);
    const sched = param(req.query.sched);
    const maxlim = param(req.query.maxlim, "100");
    const courses = await searchCourses(q, subjects.split(","), terms.split(","), gen.split(","), cmin, cmax, levels.split(","), sched.split(","), maxlim);
    res.status(200).json({ courses });
  }
}
