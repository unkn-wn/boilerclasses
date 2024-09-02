import NextCors from 'nextjs-cors';
import ratings from '@mtucourses/rate-my-professors';

async function handler(req, res) {
   // Run the cors middleware
   // nextjs-cors uses the cors package, so we invite you to check the documentation https://github.com/expressjs/cors
   await NextCors(req, res, {
      // Options
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      origin: '*',
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
   });

   if (req.method === 'GET') {
      const name = req.query.name;
      const id = req.query.id;
      const prof = await ratings.searchTeacher(name, id);
      res.status(200).json({ prof });
    }
  
}

export default handler;