
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

async function connect() {
  if (!client.isOpen) {
    await client.connect();
  }
}

export async function searchCourses(q, sub, term) {
  await connect();
  try {
    const res = await client.ft.search('idx:classes', `${q}${q.trim().length > 0 ? "*" : ""}${sub[0].length > 0 ? ` @subjectCode:{${sub.join("|")}}` : ""}${term[0].length > 0 ? ` @terms:{${term.join("|")}}` : ""}`, {
      LIMIT: { size: 100, from: 0 }
    });
    return res;
  } catch {
    return {'documents': []};
  }
}