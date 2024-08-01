# [BoilerClasses](https://www.boilerclasses.com/)

# Structure
BoilerClasses combines a [Next.js](https://nextjs.org/) with a [Kotlin](https://kotlinlang.org/) + [Jooby](https://jooby.io/) backend using [Apache Lucene](https://lucene.apache.org/) to provide an enhanced course catalog.

We use [Docker](https://www.docker.com/), specifically Compose, to host our app.

# Setup
You can clone this repository and run a local instance of the app in two ways (with or without Docker):

## Without Docker
When developing, you should run the server and client in development mode, without Docker.

1. Firstly, make sure you have [node](https://nodejs.org/en/download/) installed.
2. Then, navigate into the `server` directory and run the following commands:
   ```
   wget boilerclasses.com/data -O ./data/courses.json
   ```
   This downloads a single JSON file containing all the information required. Its format is fully specified by shared/types.ts
3. Once you have the data for the server, you can run it. Create application.conf, and enter
   ```dotenv
   server.port=8080
   ```
   to set the port. Then either run/debug using a Kotlin IDE of your choice (you should probably use IntelliJ), or type `./gradlew run`
4. Now that the server is up, you can run the client by navigating to the ``client`` directory and running:
   ```
   npm install
   npm run dev
   ```
   Now, you can make changes within the Next.js app and have them reflect in real-time at `localhost:3000`.

## With Docker (deployment)
First, configure the deployment by using a .env file or other. Here's an example:
```dotenv
DATA_SOURCE=/home/you/boilerclasses/data
PROXIES_PATH=/home/you/boilerclasses/proxies.json
SCRAPE_ARGS="-p /run/secrets/proxies"
SCRAPE_INTERVAL=360 # in minutes
ROOT_URL=http://localhost:8000
```

`DATA_SOURCE` creates a bind mount to persist data, and `PROXIES_PATH` (if specified) mounts the file from the location to `/run/secrets/proxies` use as proxies when scraping data (if they're referenced in `SCRAPE_ARGS` as above). If you don't have any proxies, leave it blank and remove the arguments from `SCRAPE_ARGS`.

Make sure you have `docker` installed and the daemon running. More information about installation can be found [here](https://docs.docker.com/get-docker/). Once you get that up and running, navigate into the cloned repository and run:

```
docker compose up -d
```

This will expose the app at `localhost:8000`. You can edit whatever files you want locally, but you'll have to rebuild the image every time you want to view your changes. Thus, not ideal for quick changes.

# Data Collection
Use `npx tsx server/scripts/fetch.ts` to fetch data. To see the arguments, take a look at the parseArgs invocation (I'm too lazy to document things here, but its pretty straightforward). Errors while running due to invalid prerequsities are expected for some terms, though no courses should be dropped. `fetch.ts` scrapes the Purdue Catalog, RateMyProfessor, and BoilerGrades in turn.

# Future Improvements
We're trying to integrate as many features as possible, and we'll have open issues for the same. If you find a *bug* or have any *feedback*, let us through a [PR](https://github.com/unkn-wn/boilerclasses/pulls) or our [feedback form](https://docs.google.com/forms/d/e/1FAIpQLScoE5E-G7dbr7-v9dY5S7UeIoojjMTjP_XstLz38GBpib5MPA/viewform). All contributions are very, very welcome!

# Acknowledgements
Inspired by [classes.wtf](https://classes.wtf) and Purdue's slow course catalogs. We'd like to also thank our friends over at [Boilerexams](https://boilerexams.com) and [BoilerGrades](https://boilergrades.com/).
