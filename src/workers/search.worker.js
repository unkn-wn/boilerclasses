import { decodeCourses, loadIndex, searchCourses } from '@/lib/courseSearch.mjs';

let courses = [];
let index = null;

const fetchPart = async (url, read) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Search index failed: ${response.status}`);
  return read(response);
};

self.onmessage = async ({ data }) => {
  if (data.type === 'load') {
    try {
      const [docs, indexJson] = await Promise.all([
        fetchPart(data.docsUrl, response => response.json()),
        fetchPart(data.indexUrl, response => response.text()),
      ]);
      courses = decodeCourses(docs);
      index = loadIndex(indexJson);
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'failed', error: String(error) });
    }
  } else if (data.type === 'search') {
    self.postMessage({ type: 'results', id: data.id, documents: searchCourses(courses, index, data.params) });
  }
};
