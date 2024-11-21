import React, { useEffect, useState } from 'react';

import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

const replaceZeroGpaWithDash = (gpaValue) => {
	return gpaValue === 0 ? '-' : gpaValue;
};

const GpaModal = ({ course }) => {
	const [gpa, setGpa] = useState({});

	useEffect(() => {
		const grades = processGpaData(course);
		setGpa(grades);
	}, [course]);


	return (
		<div className='h-[32rem] overflow-y-auto flex flex-col'>
			<h1 className='text-white text-2xl font-bold'>GPA Breakdown</h1>
			<h3 className='text-white text-sm'>
				This graphic displays all the professors along with their GPA for each semester. Pro-tip: use ⌘F or Ctrl+F to search for a specific professor!<br />
				GPA: <span className='bg-[#632230] px-2'>1.0</span> ― <span className='bg-[#ddaa33] px-2 text-black'>4.0</span>
			</h3>
			<div className='mt-2'>
				{/*sems.length > 0 && (
									<div className='grid grid-flow-col justify-stretch'>
										{sems.map((semester, index) => (
											<div key={index} className='flex flex-col mt-2'>
												<div className='grid h-12 text-center'>
													<p className='text-white m-auto'>{semester}</p>
												</div>
											</div>
										))}
									</div>
								)*/}
				{Object.keys(gpa).map((instructor, index) => (
					<div key={index} className='flex flex-col mt-5'>
						<h2 className='text-white font-bold text-xl'>{instructor}</h2>
						<div className='grid grid-flow-col auto-cols-fr justify-stretch'>
							{Object.keys(gpa[instructor]).map((semester, index) => (
								// console.log(`bg-[${gpa[instructor][semester].color}]`),
								<div key={index} className='flex flex-col mt-2'>
									<div className='grid h-12 text-center' style={{ backgroundColor: `${gpa[instructor][semester].color}` }}>
										<p className='text-white m-auto font-semibold'>{replaceZeroGpaWithDash(gpa[instructor][semester].gpa)}</p>
									</div>
									<h3 className='text-zinc-500 text-center text-sm px-1 hidden md:block'>{semester}</h3>
									<h3 className='text-zinc-500 text-center text-[10px] px-1 block md:hidden'>{semester.split(" ")[0]}</h3>
									<h3 className='text-zinc-500 text-center text-sm px-1 block md:hidden'>{" '" + semester.split(" ")[1].substring(2, 4)}</h3>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default GpaModal;

export const ScheduleGpaModal = ({ course }) => {
	const [gpa, setGpa] = useState({});

	useEffect(() => {
		const grades = processGpaData(course, true);

		// only show instructors that are teaching in the current semester
		for (const instructor in grades) {
			if (!course.instructor[CURRENT_SEMESTER].includes(instructor)) {
				delete grades[instructor];
			}
		}

		setGpa(grades);
	}, [course]);

	const semesters = Object.keys(gpa).length != 0 ? Object.keys(gpa[Object.keys(gpa)[0]]) : [];

	return (
		<div className='flex flex-col'>
			{Object.keys(gpa).length != 0 ?
				(
					<>
						<div className='w-full grid grid-cols-5 font-bold mt-2 border-b'>
							{semesters.length > 4 ? semesters.slice(0, 5).map((semester, i) => (
								<div key={i} className='flex flex-col'>
									<h3 className='text-center text-[10px]'>{semester.split(" ")[0]}</h3>
									<h3 className='text-center text-[10px]'>{" '" + semester.split(" ")[1].substring(2, 4)}</h3>
								</div>
							)) : <></>
							}
						</div>
						{Object.keys(gpa).map((instructor, index) => (
							<div key={index} className='grid grid-flow-row py-1 gap-2'>
								<h2 className='text-white text-xs'>{instructor}</h2>
								<div className='w-full grid grid-flow-col auto-cols-fr justify-stretch gap-1'>
									{Object.keys(gpa[instructor]).map((semester, index) => (
										<div key={index} className='flex flex-col'>
											<div className='grid py-1 text-center rounded-md' style={{ backgroundColor: `${gpa[instructor][semester].color}` }}>
												<p className='text-white m-auto text-sm font-light'>{replaceZeroGpaWithDash(gpa[instructor][semester].gpa)}</p>
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</>
				) : (
					<div>
						<h1 className='text-white text-sm font-light text-center'>No data for current instructors.</h1>
					</div>
				)}
		</div>
	);
};

// Function to get color based on GPA
const getColor = (gpa) => {
	if (gpa === 0) {
		return "#18181b";
	}

	// Calculate the color based on GPA as a percentage of 4.0
	const perc = gpa / 4.0;
	const perc2 = perc * perc * 0.9;
	const color1 = [221, 170, 51]; // Higher GPA color
	const color2 = [79, 0, 56]; // Lower GPA color

	const w1 = perc2;
	const w2 = 1 - perc2;

	const r = Math.round(color1[0] * w1 + color2[0] * w2 * 1);
	const g = Math.round(color1[1] * w1 + color2[1] * w2 * 1);
	const b = Math.round(color1[2] * w1 + color2[2] * w2 * 1);

	const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	return hex;
};

// Function to process GPA data
const processGpaData = (course, recentOnly = false) => {
	if (!course || Object.keys(course.gpa).length === 0) return {};

	const grades = {};
	const sems = [];

	// Collect all semesters across all instructors
	for (const instructor in course.gpa) {
		for (const semester in course.gpa[instructor]) {
			if (!sems.includes(semester)) {
				sems.push(semester);
			}
		}
	}

	// Sort semesters chronologically
	const sorted_sems = sems.sort((a, b) => {
		const a_split = a.split(" ");
		const b_split = b.split(" ");
		if (a_split[1] !== b_split[1]) {
			return a_split[1] - b_split[1]; // Compare years
		}

		const seasons = ["Spring", "Summer", "Fall"];
		return seasons.indexOf(a_split[0]) - seasons.indexOf(b_split[0]); // Compare seasons
	});

	// Process GPA data for each instructor
	for (const instructor in course.gpa) {
		grades[instructor] = {};

		// Get recent semesters if flag is true, but keep all semesters with GPA = 0
		const instructorSemesters = sorted_sems;
		const recentSemesters = recentOnly
			? instructorSemesters.slice(-5)
			: instructorSemesters;

		// Fill in GPA and color for each semester
		for (const semester of instructorSemesters) {
			if (!recentSemesters.includes(semester)) continue; // Skip if not in the recent subset

			// Fill in GPA data, defaulting to 0 if not present
			if (!course.gpa[instructor][semester]) {
				grades[instructor][semester] = { gpa: 0, color: getColor(0) };
			} else {
				grades[instructor][semester] = {
					gpa: course.gpa[instructor][semester][13],
					color: getColor(course.gpa[instructor][semester][13]),
				};
			}
		}
	}

	return grades;
};