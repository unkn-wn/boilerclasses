import argparse
import json

from embeddings import (
    DEFAULT_MANIFEST_PATH,
    DEFAULT_VECTORS_PATH,
    write_embedding_artifact,
)


def main():
    parser = argparse.ArgumentParser(description="Generate course embedding artifacts")
    parser.add_argument("--data", default="classes_out.json")
    parser.add_argument("--vectors", default=DEFAULT_VECTORS_PATH)
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST_PATH)
    args = parser.parse_args()

    with open(args.data) as infile:
        courses = json.load(infile)

    print(f"Generating embeddings for {len(courses)} courses...")
    write_embedding_artifact(courses, args.data, args.vectors, args.manifest)
    print(f"Wrote {args.vectors} and {args.manifest}")


if __name__ == "__main__":
    main()
