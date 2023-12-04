

# [BoilerClasses](https://www.boilerclasses.com/)



# Setup
You can clone this repository and spawn a Redis server (steps coming soon!) with the data in the `python/data` folder. Then, to view the webapp, you can run:
```
npm install
npm run dev
```
There are some scripts in the `python` folder that you might find useful. You can scrape data from the catalog for a particular semester by:
```
python3 scrape.py -sem "Fall 2023"
```
The above command will generate a JSON with data from Fall 2023. If you have multiple JSONs, you can combine them into a single file via:
```
python3 harmonize.py
```

# Future Improvements
We're trying to integrate as many features as possible, and we'll have open issues for the same. If you find a bug or have any feedback, let us through a [PR](https://github.com/unkn-wn/boilerclasses/pulls) or our [feedback form](https://docs.google.com/forms/d/e/1FAIpQLScoE5E-G7dbr7-v9dY5S7UeIoojjMTjP_XstLz38GBpib5MPA/viewform). All contributions are very, very welcome!

# Acknowledgements
Inspired by [classes.wtf](https://classes.wtf) and Purdue's slow course catalogs. We'd like to also thank our friends at [Boilerexams](https://boilerexams.com) and [BoilerGrades](https://boilergrades.com/).
