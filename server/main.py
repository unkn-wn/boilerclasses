from flask import Flask, request
import redis
from redis.commands.search.query import Query
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

@app.route('/query', methods = ["GET", "POST"])
def query():
  if request.method == 'GET':
    q = request.args.get('q')
    subjects = request.args.get('sub').split(",");
    terms = request.args.get('term').split(",");
    gen = request.args.get('gen').split(",");
    cmin = int(request.args.get('cmin'))
    cmax = int(request.args.get('cmax'))
    r = redis.Redis(host='redis', port=6379)

    gen_query = ''
    for g in gen:
      gen_query += f' @gened:{{{g}}}'
    full_query = f'{q}{"*" if len(q.strip()) > 0 else ""}' + (f' @subjectCode:{{{"|".join(subjects)}}}' if len(subjects[0]) > 0 else "") + (f' @terms:{{{"|".join(terms)}}}' if len(terms[0]) > 0 else "") + (gen_query if len(gen[0]) > 0 else "") + f' (@creditMin:[{cmin}, {cmax}] | @creditMax:[{cmin}, {cmax}])'
    formatted_query = Query(full_query).paging(0, 50)
    print(formatted_query)
    res = r.ft("idx:classes").search(formatted_query).docs
    full_res = []
    for result in list(res):
      class_res = json.loads(result.json)
      id_res = result.id
      full_res.append({"id": id_res, "data": class_res})
    return full_res


if __name__ == "__main__":
  app.run(host= "0.0.0.0", debug=True, port=8000)
