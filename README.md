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
After the image is created, run:
```
docker run -it -p 3000:3000 boilerclasses
```
This will expose the container's port `3000` to your machine. Navigate to `localhost:3000` to view the app! You can edit whatever files you want locally, but you'll have to rebuild the image every time you want to view your changes. Thus, not ideal for quick changes.

## Without Docker
1. Firstly, make sure you have [python](https://www.python.org/downloads/), [node](https://nodejs.org/en/download/), and [redis](https://redis.io/docs/install/install-redis/) installed.
2. Then, navigate into the `server` directory and run the following commands:
   ```
   python3 download.py
   python3 harmonize.py
   ```
   `download.py` will download JSON files for you from our [S3 bucket](https://s3.amazonaws.com/boilerclasses) and `harmonize.py` will combine these to give you a single JSON file containing all the information required. More details regarding what these files do are coming soon.  
3. Now, you want to spawn a Redis instance at the port `6379`. To do this, run the following command:
   ```
   redis-server --daemonize yes
   ```
   The `daemonize` argument will make it run in the background. Alternatively, if you have docker but don't want to install redis-server, you can run:
   ```
   docker run --name boilerclasses-redis -i --rm -p 6379:6379 redis/redis-stack-server:latest redis-stack-server --save
   ```
   Functionally, both of the above commands are equivalent. 
5. Once you have that, you can push all the data from the JSON file generated in step 2 to the Redis instance. To do this, run:
   ```
   python3 push.py
   ```
6. Now, navigate back to the root directory and run:
   ```
   npm install
   npm run dev
   ```
   Now, you can make changes within the Next.js app and have them reflect in real-time at `localhost:3000`.

   PS: if you look at the Dockerfile, you can see that these exact commands are run!

# Data Collection

There are four scripts in the `server` directory that aid with data collection:
1. `scrape.py` scrapes a particular semester's data from Purdue's catalog. Generates a singular JSON file for a semester.
3. `download.py` either downloads the data from our [S3 bucket](https://s3.amazonaws.com/boilerclasses), or runs `scrape.py` for every semester. The default is downloading because it's faster.
4. `harmonize.py` combines all the JSON files downloaded and makes one JSON containing all the data required.
5. `push.py` pushes the data from the resultant JSON from `harmonize.py` to the Redis instance.

Running the `scrape.py` script might give you issues, but feel free to tweak line ~42 where the driver is initialized. It is somewhat system-dependent -- that configuration should work on MacOS with a Google Chrome driver and `selenium v4.x`. If you want more clarification/help, open up an [issue](https://github.com/unkn-wn/boilerclasses/issues)!

# Future Improvements
We're trying to integrate as many features as possible, and we'll have open issues for the same. If you find a *bug* or have any *feedback*, let us through a [PR](https://github.com/unkn-wn/boilerclasses/pulls) or our [feedback form](https://docs.google.com/forms/d/e/1FAIpQLScoE5E-G7dbr7-v9dY5S7UeIoojjMTjP_XstLz38GBpib5MPA/viewform). All contributions are very, very welcome!

# Acknowledgements
Inspired by [classes.wtf](https://classes.wtf) and Purdue's slow course catalogs. We'd like to also thank our friends over at [Boilerexams](https://boilerexams.com) and [BoilerGrades](https://boilergrades.com/).
