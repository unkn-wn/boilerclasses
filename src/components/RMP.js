/*
 * This file contains functions to fetch RateMyProfessor ratings for professors.
 */


// Get RateMyProfessor ratings for instructor
async function getRMPRating(instructor) {
  if (!instructor) return 0;

  try {
    // TO SEARCH FOR "PURDUE UNIVERSITY"
    // const params = new URLSearchParams({ q: "Purdue University" });
    // const responseSchools = await fetch("/api/ratings/searchSchool?" + params);
    // const schools = await responseSchools.json();
    // const purdues = schools.schools.filter(school => school.city === "West Lafayette");

    let rating = 0;

    // for all Purdue University schools in West Lafayette, search prof
    const schools = ["U2Nob29sLTc4Mw==", "U2Nob29sLTE3NTk5"]; // purdue IDs for West Lafayette
    for (const school of schools) {
      const paramsTeacher = new URLSearchParams({ name: instructor, id: school });
      const responseProf = await fetch("http://localhost:3000/api/ratings/searchTeacher?" + paramsTeacher);
      const prof = await responseProf.json();
      const profs = prof.prof.filter(Boolean);

      if (profs.length > 0) {
        const paramsGetTeacher = new URLSearchParams({ id: profs[0].id });
        const responseRMP = await fetch("http://localhost:3000/api/ratings/getTeacher?" + paramsGetTeacher);
        const RMPrating = await responseRMP.json();
        rating = RMPrating.RMPrating.avgRating;
        break;
      }
    }

    return rating;
  } catch (error) {
    console.error(error);
    return 0;
  }
}


// Batched RMP ratings fetch for allProfs
async function getAllRMPRatings(allProfs) {
  if (!Array.isArray(allProfs) || allProfs.length === 0) return {};

  const batchSize = 10; // Number of requests to send in each batch
  const batches = []; // Array to hold batches of professors
  const ratings = {}; // Object to store ratings

  // Split allProfs into batches
  for (let i = 0; i < allProfs.length; i += batchSize) {
    batches.push(allProfs.slice(i, i + batchSize));
  }

  // Process batches in parallel
  await Promise.all(
    batches.map(async (batch) => {
      const ratingsBatch = await Promise.all(batch.map((instructor) => getRMPRating(instructor)));
      batch.forEach((instructor, index) => {
        ratings[instructor] = ratingsBatch[index];
      });
    })
  );

  return ratings;
}


// Add these new utility functions before loadRatingsForProfs
export function getRMPScore(rmpData, instructor) {
  if (!rmpData || !instructor) return null;
  return rmpData[instructor] || null;
}


// Asynchronously fetch RMP rating for all professors
let isLoadingRatings = false;

export async function loadRatingsForProfs(course, onUpdate = null) {
  if (!course) return Promise.resolve({});

  const allProfs = [];
  for (const semester in course.instructor) {
    for (const instructor of course.instructor[semester]) {
      if (!allProfs.includes(instructor)) {
        allProfs.push(instructor);
      }
    }
  }

  if (isLoadingRatings) return Promise.resolve({});
  isLoadingRatings = true;

  const ratings = {};
  try {
    // Process professors individually for streaming updates
    const promises = allProfs.map(async (instructor) => {
      const rating = await getRMPRating(instructor);
      ratings[instructor] = rating;
      // Call callback with accumulated ratings so far
      if (onUpdate) onUpdate({...ratings});
    });

    await Promise.all(promises);
    return ratings;
  } catch (error) {
    console.error("Error loading ratings:", error);
    return Promise.resolve({});
  } finally {
    isLoadingRatings = false;
  }
}