from flask import Flask, request
import redis
app = Flask(__name__)

@app.route('/query', methods = ["GET", "POST"])
def query():
  if request.method == 'GET':
    q = request.args.get('q')
    r = redis.Redis(host='localhost', port=7501)
    res = r.ft("idx:classes").search(q).docs
    full_res = []
    for result in list(res):
      full_res.append(result.json)
    return full_res

if __name__ == "__main__":
  app.run(host= "0.0.0.0", debug=True)