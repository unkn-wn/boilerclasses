import { searchCourses } from "../../lib/redis"

// example query: FT.SEARCH idx:classes @title:"Computer Architecture"
// searchParam structure: q, subjectCode 

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const q = req.query.q.trim();
    const subjects = req.query.sub.split(",");
    const terms = req.query.term.split(",");
    const gen = req.query.gen.split(",");
    const cmin = req.query.cmin || 0;
    const cmax = req.query.cmax || 18;
    // const courses = await 
    const query = `${q}${q.trim().length > 0 ? "*" : ""}${subjects[0].length > 0 ? ` @subjectCode:{${subjects.join("|")}}` : ""}${terms[0].length > 0 ? ` @terms:{${terms.join("|")}}` : ""}${gen[0].length > 0 ? gen.map((g) => ` @gened:{${g}}`) : ""} (@creditMin:[${cmin}, ${cmax}] | @creditMax:[${cmin}, ${cmax}])`
    // console.log(query)
    // const courses = await fetch("http://127.0.0.1:5000/query?q=" + encodeURIComponent(query))
    //   .then((response) => response.json())
    // res.status(200).json({});
  }
}
