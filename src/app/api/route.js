import { createClient } from 'redis';



export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  const res = await redis.ft.search('idx:classes', `'@title:Computer Architecture'`);
  console.log(res)
  return Response.json(res);
}


// example query: FT.SEARCH idx:classes @title:"Computer Architecture"

// searchParam 