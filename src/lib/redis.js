
import { createClient } from 'redis';

const client = createClient();

async function connect() {
  if (!client.isOpen) {
    await client.connect();
  }
}

export async function searchCourses(q, sub, term, gen, cmin, cmax, levels, sched, page, pageSize) {
  await connect();
  try {
    const formattedLevels = levels.map(level => `@courseCode:[${parseInt(level)*100}, ${parseInt(level)*100 + 9999}]`)
    const res = await client.ft.search('idx:classes', 
      `${q}${q.trim().length > 0 ? "*" : ""}${sub[0].length > 0 ? ` @subjectCode:{${sub.join("|")}}` : ""}${term[0].length > 0 ? ` @terms:{${term.join("|")}}` : ""}${gen[0].length > 0 ? gen.map((g) => ` @gened:{${g}}`) : ""} (@creditMin:[${cmin}, ${cmax}] | @creditMax:[${cmin}, ${cmax}])${levels[0].length > 0 ? ` (${formattedLevels.join(" | ")})` : " @courseCode:[0, 0]"}${sched[0].length > 0 ? ` @sched:{${sched.join("|")}}` : " @sched:{}"}`, 
      {
        LIMIT: { 
          size: parseInt(pageSize), 
          from: (parseInt(page) - 1) * parseInt(pageSize) 
        }
      }
    );
    return res;
  } catch {
    return {'documents': []};
  }
}


export async function getCourse(detailId) {
  await connect();
  try {
    const res = await client.ft.search('idx:classes', `@detailId:{${detailId}}`, {
      LIMIT: { size: 1, from: 0 }
    });
    return res;
  } catch {
    return {'documents': []};
  }
}
