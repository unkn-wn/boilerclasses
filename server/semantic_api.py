from flask import Flask, jsonify, request
from waitress import serve

from embeddings import load_embedding_model
from semantic_search import search


app = Flask(__name__)
MAX_RESULTS = 8
MAX_QUERY_LENGTH = 500


def csv_values(name):
    return [value for value in request.args.get(name, "").split(",") if value]


def int_arg(name, default):
    try:
        return int(request.args.get(name, default))
    except (TypeError, ValueError):
        return default


def float_arg(name, default):
    try:
        return float(request.args.get(name, default))
    except (TypeError, ValueError):
        return default


def request_filters():
    levels = []
    for level in csv_values("levels"):
        try:
            levels.append(int(level))
        except ValueError:
            continue
    return {
        "subjects": csv_values("sub"),
        "terms": csv_values("term"),
        "geneds": csv_values("gen"),
        "levels": levels,
        "schedule_types": csv_values("sched"),
        "credit_min": float_arg("cmin", 0),
        "credit_max": float_arg("cmax", 18),
    }


@app.get("/health")
def health():
    return jsonify({"ready": True})


@app.get("/search")
def semantic_search():
    query = request.args.get("q", "").strip()[:MAX_QUERY_LENGTH]
    limit = min(max(int_arg("maxlim", MAX_RESULTS), 1), MAX_RESULTS)
    if len(query) < 2:
        return jsonify({"courses": {"documents": []}})

    matches = search(query, limit, request_filters())
    documents = [
        {
            "id": match["courseKey"],
            "value": {
                **match["course"],
                "semanticDistance": match["distance"],
            },
        }
        for match in matches
    ]
    return jsonify({"courses": {"documents": documents}})


if __name__ == "__main__":
    load_embedding_model()
    serve(app, host="127.0.0.1", port=5001, threads=1)
