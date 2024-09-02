import { getCourse } from "../../lib/redis"

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const detailId = req.query.detailId;
    const course = await getCourse(detailId);
    res.status(200).json({ course });
  }
}