import os
import hashlib
import json
from functools import lru_cache
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding


MODEL_NAME = "BAAI/bge-small-en-v1.5"
EMBEDDING_DIM = 384
VECTOR_INDEX_NAME = "idx:classes:vector"
VECTOR_FIELD_NAME = "embedding"
VECTOR_KEY_PREFIX = "class-vectors:"
QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "
ARTIFACT_VERSION = 1
TEXT_TEMPLATE_VERSION = 1
DEFAULT_VECTORS_PATH = "course_embeddings.npy"
DEFAULT_MANIFEST_PATH = "course_embeddings.manifest.json"


@lru_cache(maxsize=1)
def load_embedding_model():
    configured_threads = os.getenv("EMBEDDING_THREADS")
    threads = int(configured_threads) if configured_threads else None
    return TextEmbedding(model_name=MODEL_NAME, threads=threads)


def course_embedding_text(course):
    code = f"{course['subjectCode']} {course['courseCode']}"
    title = course.get("title", "").strip()
    description = course.get("description", "").strip()
    return f"Course: {code}. Title: {title}. Description: {description}"


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as infile:
        for chunk in iter(lambda: infile.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def embed_courses(courses, batch_size=64):
    texts = [course_embedding_text(course) for course in courses]
    embeddings = np.asarray(list(load_embedding_model().embed(
        texts,
        batch_size=batch_size,
    )), dtype=np.float32)
    if embeddings.shape != (len(courses), EMBEDDING_DIM):
        raise ValueError(f"Unexpected course embedding shape: {embeddings.shape}")
    embeddings /= np.linalg.norm(embeddings, axis=1, keepdims=True)
    return embeddings


def embed_query(query):
    embeddings = list(load_embedding_model().embed([QUERY_INSTRUCTION + query]))
    embedding = np.asarray(embeddings[0], dtype=np.float32)
    if embedding.shape != (EMBEDDING_DIM,):
        raise ValueError(f"Unexpected query embedding shape: {embedding.shape}")
    embedding /= np.linalg.norm(embedding)
    return embedding


def write_embedding_artifact(courses, source_path, vectors_path, manifest_path):
    vectors = embed_courses(courses)
    vectors_path = Path(vectors_path)
    manifest_path = Path(manifest_path)
    temporary_vectors_path = vectors_path.with_suffix(vectors_path.suffix + ".tmp")
    temporary_manifest_path = manifest_path.with_suffix(manifest_path.suffix + ".tmp")

    with temporary_vectors_path.open("wb") as outfile:
        np.save(outfile, vectors, allow_pickle=False)

    manifest = {
        "artifactVersion": ARTIFACT_VERSION,
        "model": MODEL_NAME,
        "dimensions": EMBEDDING_DIM,
        "dtype": "float32",
        "normalized": True,
        "distanceMetric": "COSINE",
        "textTemplateVersion": TEXT_TEMPLATE_VERSION,
        "sourceSha256": file_sha256(source_path),
        "courseCount": len(courses),
        "courseIds": [course["detailId"] for course in courses],
    }
    with temporary_manifest_path.open("w") as outfile:
        json.dump(manifest, outfile, indent=2)
        outfile.write("\n")
    temporary_vectors_path.replace(vectors_path)
    temporary_manifest_path.replace(manifest_path)


def load_embedding_artifact(courses, source_path, vectors_path, manifest_path):
    with open(manifest_path) as infile:
        manifest = json.load(infile)

    expected = {
        "artifactVersion": ARTIFACT_VERSION,
        "model": MODEL_NAME,
        "dimensions": EMBEDDING_DIM,
        "dtype": "float32",
        "normalized": True,
        "distanceMetric": "COSINE",
        "textTemplateVersion": TEXT_TEMPLATE_VERSION,
        "sourceSha256": file_sha256(source_path),
        "courseCount": len(courses),
        "courseIds": [course["detailId"] for course in courses],
    }
    for field, value in expected.items():
        if manifest.get(field) != value:
            if field == "courseIds":
                raise ValueError("Embedding manifest course ordering does not match data")
            raise ValueError(f"Embedding manifest mismatch for {field}")

    vectors = np.load(vectors_path, allow_pickle=False, mmap_mode="r")
    if vectors.shape != (len(courses), EMBEDDING_DIM):
        raise ValueError(f"Unexpected embedding artifact shape: {vectors.shape}")
    if vectors.dtype != np.float32:
        raise ValueError(f"Unexpected embedding artifact dtype: {vectors.dtype}")
    return vectors
