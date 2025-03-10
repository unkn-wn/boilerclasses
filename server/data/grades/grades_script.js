// This script is used to parse the CSV file of grades that Purdue provides
// modified to whatever format purdue gives us. you may have to remove the header
// from the csv file, like the "Legal Counsel... " etc parts

// Only have the csv file starting at "Subject,Subject Desc,Course Number,Title,Academic Period,..."

// npm i csv-parser
const csv = require('csv-parser')
const fs = require('fs')
// import csv from 'csv-parser';
// import fs from 'fs';
const results = [];

const sem = "F24";

const percentageToGPA = (percentage) => {
  if (!percentage) return 0;
  if (percentage.endsWith('%')) {
    const numericPercentage = parseFloat(percentage.slice(0, -1));
    return isNaN(numericPercentage) ? 0 : numericPercentage;
  }
  return 0;
};

// Check if file exists first
if (!fs.existsSync(`./${sem}.csv`)) {
  console.error(`Error: ${sem}.csv file not found`);
  process.exit(1);
}

fs.createReadStream(`./${sem}.csv`)
  .on('error', (error) => {
    console.error('Error reading CSV file:', error);
    process.exit(1);
  })
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(results);
    let currSubject = '';
    const transformedArray = results.map((item) => {
      const totalA = percentageToGPA(item['A']);
      const totalAminus = percentageToGPA(item['A-']);
      const totalAplus = percentageToGPA(item['A+']);
      const totalB = percentageToGPA(item['B']);
      const totalBminus = percentageToGPA(item['B-']);
      const totalBplus = percentageToGPA(item['B+']);
      const totalC = percentageToGPA(item['C']);
      const totalCminus = percentageToGPA(item['C-']);
      const totalCplus = percentageToGPA(item['C+']);
      const totalD = percentageToGPA(item['D']);
      const totalDminus = percentageToGPA(item['D-']);
      const totalDplus = percentageToGPA(item['D+']);
      const totalF = percentageToGPA(item['F']);


      const totalStudents = totalA + totalAminus + totalAplus + totalB + totalBminus + totalBplus + totalC + totalCminus + totalCplus + totalD + totalDminus + totalDplus + totalF;

      const avgGPA = (
        totalA * 4 +
        totalAminus * 3.7 +
        totalAplus * 4 +
        totalBplus * 3.3 +
        totalB * 3 +
        totalBminus * 2.7 +
        totalCplus * 2.3 +
        totalC * 2 +
        totalCminus * 1.7 +
        totalDplus * 1.3 +
        totalD * 1 +
        totalDminus * 0.7 +
        totalF * 0
      ) / totalStudents;


      let itemSubject = item.Subject;
      if (itemSubject === '') {
        //get subject from previous item
        itemSubject = currSubject;
      }
      else {
        //update currSubject
        currSubject = itemSubject;
      }
      return {
        //if subject is '' then subject is the same as the previous subject
        subject: itemSubject,
        'course number': item['Course Number'],
        title: item.Title,
        'academic period desc': item['Academic Period Desc'],
        instructor: item.Instructor,
        'avg gpa': avgGPA.toFixed(2),
        totalA: totalA,
        totalAminus: totalAminus,
        totalAplus: totalAplus,
        totalB: totalB,
        totalBminus: totalBminus,
        totalBplus: totalBplus,
        totalC: totalC,
        totalCminus: totalCminus,
        totalCplus: totalCplus,
        totalD: totalD,
        totalDminus: totalDminus,
        totalDplus: totalDplus,
        totalF: totalF,
        //totalStudents: totalStudents,
        CRN: item.CRN,
      };
    });
    // console.log(transformedArray);
    // Fix writeFile to use fs.writeFile
    fs.writeFile(`classes_${sem.toLowerCase()}.json`, JSON.stringify(transformedArray, null, 2), (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
        process.exit(1);
      }
      console.log('The file has been saved!');
    });
  });

