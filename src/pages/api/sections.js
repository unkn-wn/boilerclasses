import { readFile } from 'fs/promises';
import path from 'path';

// Current term's sections ({detailId: sections}), downloaded at build by
// server/fetch_snapshot.sh from the snapshot pinned in sections.lock.
const SECTIONS_FILE = path.join(process.cwd(), 'server', 'sections_out.json');

let sections = null;

async function getAllSections() {
  // Cache only a successful read so a missing file is retried, not pinned as null.
  if (!sections) {
    try {
      sections = JSON.parse(await readFile(SECTIONS_FILE, 'utf8'));
    } catch (error) {
      console.error('Error loading sections:', error.message);
    }
  }
  return sections;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const all = await getAllSections();
    res.status(200).json({ sections: all?.[String(req.query.detailId)] ?? null });
  }
}
