import { searchCourses } from "../../lib/redis"

// example query: FT.SEARCH idx:classes @title:"Computer Architecture"
// searchParam structure: q, subjectCode 

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const q = req.query.q.trim();
    const subjects = req.query.sub || "";
    const terms = req.query.term || "";
    const gen = req.query.gen || "";
    const cmin = req.query.cmin || 0;
    const cmax = req.query.cmax || 18;
    const query = `${q}${q.trim().length > 0 ? "*" : ""}${subjects[0].length > 0 ? ` @subjectCode:{${subjects.join("|")}}` : ""}${terms[0].length > 0 ? ` @terms:{${terms.join("|")}}` : ""}${gen[0].length > 0 ? gen.map((g) => ` @gened:{${g}}`) : ""} (@creditMin:[${cmin}, ${cmax}] | @creditMax:[${cmin}, ${cmax}])`
    const courses = await fetch("127.0.0.1:5000/query?q=" + query)
      .then((response) => response.json())
    res.status(200).json({ courses });
  }
}
