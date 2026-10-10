const SEMANTIC_SEARCH_URL = process.env.SEMANTIC_SEARCH_URL || "http://127.0.0.1:5001/search";
const SEMANTIC_TIMEOUT_MS = 10_000;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEMANTIC_TIMEOUT_MS);

  try {
    const params = new URLSearchParams(req.query);
    const response = await fetch(`${SEMANTIC_SEARCH_URL}?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Semantic worker returned ${response.status}`);
    }
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error("Semantic search unavailable:", error.message);
    return res.status(200).json({ courses: { documents: [] }, available: false });
  } finally {
    clearTimeout(timeout);
  }
}
