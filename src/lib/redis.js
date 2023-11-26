import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

async function connect() {
  if (!client.isOpen) {
    await client.connect();
  }
}

export async function searchCourses(q) {
  await connect();
  try {
    const res = await client.ft.search('idx:classes', `${q}*`, "LIMIT 0 10000");
    return res;
  } catch {
    return {'documents': []};
  }
}