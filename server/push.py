import argparse
import json

import redis
from tqdm import tqdm

from embeddings import (
  DEFAULT_MANIFEST_PATH,
  DEFAULT_VECTORS_PATH,
  EMBEDDING_DIM,
  VECTOR_FIELD_NAME,
  VECTOR_INDEX_NAME,
  VECTOR_KEY_PREFIX,
  load_embedding_artifact,
)


def tag_values(values):
  return ",".join(str(value) for value in values)


def main():
  parser = argparse.ArgumentParser(description="Load course data into Redis")
  parser.add_argument("--data", "-data", default="classes_out.json", dest="infile")
  parser.add_argument("--vectors", default=DEFAULT_VECTORS_PATH)
  parser.add_argument("--manifest", default=DEFAULT_MANIFEST_PATH)
  args = parser.parse_args()

  with open(args.infile) as infile:
    data = json.load(infile)

  # Validate before flushing Redis so a stale or missing artifact cannot destroy
  # an otherwise healthy local dataset.
  embeddings = load_embedding_artifact(
    data, args.infile, args.vectors, args.manifest
  )

  client = redis.Redis(host="localhost", port=6379)
  client.ping()
  client.flushall()

  print(f"Loading {len(data)} courses and precomputed embeddings into Redis...")
  pipe = client.pipeline(transaction=False)
  for count, (course, embedding) in enumerate(
    tqdm(zip(data, embeddings), total=len(data)), start=1
  ):
    course_key = f"classes:{count}"
    pipe.execute_command("JSON.SET", course_key, "$", json.dumps(course))
    pipe.hset(
      f"{VECTOR_KEY_PREFIX}{count}",
      mapping={
        "courseKey": course_key,
        "subjectCode": course["subjectCode"],
        "terms": tag_values(course["terms"]),
        "gened": tag_values(course["gened"]),
        "sched": tag_values(course["sched"]),
        "courseCode": course["courseCode"],
        "creditMin": course["credits"][0],
        "creditMax": course["credits"][1],
        VECTOR_FIELD_NAME: embedding.tobytes(),
      },
    )
    if count % 500 == 0:
      pipe.execute()
  pipe.execute()

  client.execute_command("FT.CONFIG", "SET", "MINPREFIX", "1")

  client.execute_command("FT.CREATE", "idx:classes", "ON", "JSON", "PREFIX", "1",
              "classes:", "SCHEMA", 
              "$.fullTitle", "AS", "fullTitle", "TEXT", "WEIGHT", "50", 
              "$.detailId", "AS", "detailId", "TAG", 
              "$.description", "AS", "description", "TEXT", 
              "$.subjectCode", "AS", "subjectCode", "TAG", 
              "$.terms[*]", "AS", "terms", "TAG", 
              "$.courseCode", "AS", "courseCode", "NUMERIC", "SORTABLE",
              "$.instructor[*][*]", "AS", "instructor", "TEXT", "NOSTEM", 
              "$.credits[0]", "AS", "creditMin", "NUMERIC", 
              "$.credits[1]", "as", "creditMax", "NUMERIC", 
              "$.gened[*]", "AS", "gened", "TAG",
              "$.sched[*]", "AS", "sched", "TAG")

  # This remains separate so the existing lexical schema and queries are unchanged.
  client.execute_command(
    "FT.CREATE", VECTOR_INDEX_NAME,
    "ON", "HASH",
    "PREFIX", "1", VECTOR_KEY_PREFIX,
    "SCHEMA",
    "subjectCode", "TAG",
    "terms", "TAG",
    "gened", "TAG",
    "sched", "TAG",
    "courseCode", "NUMERIC",
    "creditMin", "NUMERIC",
    "creditMax", "NUMERIC",
    VECTOR_FIELD_NAME,
    "VECTOR", "FLAT", "6",
    "TYPE", "FLOAT32",
    "DIM", str(EMBEDDING_DIM),
    "DISTANCE_METRIC", "COSINE",
  )


if __name__ == "__main__":
  main()
