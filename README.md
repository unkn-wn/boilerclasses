# [BoilerClasses](https://www.boilerclasses.com/)

https://github.com/user-attachments/assets/2f1d7f6c-00fd-4de0-880b-80b4598cb77c

# Structure
BoilerClasses is a simple [Next.js](https://nextjs.org/) app with a few Python helper files to format and organize the data. We use a [Redis](https://redis.io/) instance to store and rapidly query all our data. 

We use [Fly.io](https://fly.io/) through [Docker](https://www.docker.com/) to host our app. More steps to run the Docker container through our Dockerfile can be found below. 

# Setup
You can clone this repository and run a local instance of the app in two ways (with or without Docker):

## With Docker
Make sure you have `docker` installed and the daemon running. More information about installation can be found [here](https://docs.docker.com/get-docker/). Once you get that up and running, navigate into the cloned repository and run:

```
docker build . -t boilerclasses
```
The first build downloads the pinned course snapshot and embedding model, then
generates all course embeddings. This can take roughly 10-15
minutes depending on CPU and network speed. Docker caches the course artifact
stage, so frontend-only rebuilds do not repeat vectorization.

After the image is created, run:
```
docker run -it -p 3000:3000 boilerclasses
```
This will expose the container's port `3000` to your machine. Navigate to `localhost:3000` to view the app! You can edit whatever files you want locally, but you'll have to rebuild the image every time you want to view your changes. Thus, not ideal for quick changes.

## Without Docker
1. Make sure you have [Python](https://www.python.org/downloads/), [Node](https://nodejs.org/en/download/), and Docker installed. Semantic search requires the RedisJSON and RediSearch modules, so a plain `redis-server` is not sufficient.
2. Then, navigate into the `server` directory and run the following commands:
   ```
   pip3 install -r requirements.txt
   sh fetch_snapshot.sh
   python3 vectorize.py
   ```
   `fetch_snapshot.sh` downloads and verifies the data snapshot pinned in `data.lock`, and `vectorize.py` generates a checksummed embedding artifact.
3. Start Redis Stack on port `6379`:
   ```
   docker run --name boilerclasses-redis --rm -d -p 6379:6379 redis/redis-stack-server:7.0.6-RC8
   ```
4. Load the course JSON and precomputed vectors into Redis:
   ```
   python3 push.py
   ```
5. Start the semantic worker from `server` in one terminal:
   ```
   EMBEDDING_THREADS=1 python3 semantic_api.py
   ```
6. From the repository root, start Next.js in another terminal:
   ```
   npm install
   npm run dev
   ```
   Now, you can make changes within the Next.js app and have them reflect in real-time at `localhost:3000`.

### Semantic search experiment

`server/vectorize.py` embeds each course with `BAAI/bge-small-en-v1.5`. It embeds
the subject/course code, title, and description into a normalized 384-dimensional
`FLOAT32` vector. The script writes `course_embeddings.npy` and a manifest that
binds the vectors to the source JSON checksum and ordered course IDs.

`server/push.py` validates that artifact, stores each vector and its filter fields
in a paired Redis hash, and creates the `idx:classes:vector` FLAT cosine index. It
does not run the embedding model. To test retrieval after loading Redis, run:

```
cd server
python3 semantic_search.py "low level classes about operating systems and memory"
```

Use `--limit` to change the number of results. The website accesses the same search
through a local background worker. The existing lexical request renders first;
semantic matches are fetched separately and appended without delaying or
reordering lexical results. If the worker is unavailable, lexical search continues
to work normally.

   PS: if you look at the Dockerfile, you can see that these exact commands are run!

# Data Collection

Data is refreshed by the **Data Pipeline** GitHub Action (`.github/workflows/data.yml`), weekly on Mondays or by hand from the Actions tab:
1. `scrape.py` scrapes the newest 2 semesters from Purdue's catalog and uploads them to our [S3 bucket](https://s3.amazonaws.com/boilerclasses). Older semesters stay as they are on S3.
2. `grades.py` converts the newest 5 semesters of grade CSVs from [BoilerGrades](https://github.com/eduxstad/boiler-grades) and uploads any that changed.
3. `harmonize.py` combines everything on S3 into one JSON file and writes `src/data/terms.json` for the frontend.
4. If the result changed, it's uploaded as `snapshots/<sha256>.json`, the hash is committed to `data.lock`, and the site is deployed. Only the snapshots from the last 10 `data.lock` commits are kept.

To roll back data, revert the `data.lock` commit. The Docker build fetches the pinned snapshot and generates its embeddings. When the container starts, `push.py` validates and loads both artifacts into Redis, then creates the lexical and vector indexes.

Manual runs take two optional inputs: `terms` (e.g. `["Fall 2026"]`, or `[]` to skip scraping) and `subjects` (e.g. `CS`, a quick test scrape that uploads nothing).

Running the `scrape.py` script may cause issues, but feel free to tweak line ~42, where the driver is initialized. It is somewhat system-dependent -- that configuration should work on MacOS with a Google Chrome driver and `selenium v4.x`. If you want more clarification/help, open up an [issue](https://github.com/unkn-wn/boilerclasses/issues)!

# Future Improvements
We're trying to integrate as many features as possible, and we'll have open issues for the same. If you find a *bug* or have any *feedback*, let us through a [PR](https://github.com/unkn-wn/boilerclasses/pulls) or our [feedback form](https://docs.google.com/forms/d/e/1FAIpQLScoE5E-G7dbr7-v9dY5S7UeIoojjMTjP_XstLz38GBpib5MPA/viewform). All contributions are very, very welcome!

# Acknowledgements
Inspired by [classes.wtf](https://classes.wtf) and Purdue's slow course catalogs. We'd like to also thank our friends over at [Boilerexams](https://boilerexams.com), [Purdue.io](https://purdue.io/), and [BoilerGrades](https://boilergrades.com/).
