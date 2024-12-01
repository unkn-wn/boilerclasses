import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';

const FullInstructorModal = ({ course }) => {

	const [gpa, setGpa] = useState({});
	const [searchQuery, setSearchQuery] = useState('');

	// function to get color based on gpa:
	const getColor = (gpa) => {
		if (gpa === 0) {
			return "#18181b";
		}

		// calculate the color based on gpa as a percentage of 4.0
		const perc = gpa / 4.0;
		const perc2 = perc * perc * 0.9;
		const color1 = [221, 170, 51]; // higher gpa color
		const color2 = [79, 0, 56]; // lower gpa color

		const w1 = perc2;
		const w2 = 1 - perc2;

		const r = Math.round(color1[0] * w1 + color2[0] * w2 * 1);
		const g = Math.round(color1[1] * w1 + color2[1] * w2 * 1);
		const b = Math.round(color1[2] * w1 + color2[2] * w2 * 1);

		const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
		// console.log(hex);
		return hex;
	};


	useEffect(() => {
		if (!course) return;
		// @unkn-wn @knightron0 delete this comment after review:
		// Is there a reason why we do the following check?
		// if (Object.keys(course.gpa).length === 0) return;
		// console.log(JSON.stringify(course, null, 2));

		/////////////////////////////////////////////////////
		// consolidate grades and instr per sem data

		const consolidatedData = {};

		// Populate consolidatedData with all semesters and professors and gpas
		for (const semester in course.instructor) {
			consolidatedData[semester] = {};
			for (const instructor of course.instructor[semester]) {
				let gpa = "-";
				let color = getColor(0);
				if (course.gpa[instructor] && course.gpa[instructor][semester]) {
					gpa = course.gpa[instructor][semester][13] || "No GPA";
					color = getColor(course.gpa[instructor][semester][13] || 0);
				}
				consolidatedData[semester][instructor] = {
					gpa: gpa,
					color: color
				};
			}
		}

		// SORTING BY SEMESTERS
		const sortedSemesters = Object.keys(consolidatedData).sort((a, b) => {
			const a_split = a.split(" ");
			const b_split = b.split(" ");
			if (a_split[1] !== b_split[1]) {
				return b_split[1] - a_split[1];
			}

			const seasons = ["Spring", "Summer", "Fall"];
			return seasons.indexOf(b_split[0]) - seasons.indexOf(a_split[0]);
		});

		const sortedConsolidatedData = {};
		sortedSemesters.forEach(semester => {
			sortedConsolidatedData[semester] = consolidatedData[semester];
		});

		// console.log(JSON.stringify(sortedConsolidatedData, null, 2));

		setGpa(sortedConsolidatedData);
	}, [course]);


	return (
			<div className='h-[32rem] overflow-y-auto flex flex-col'>
				<h1 className='text-white text-2xl font-bold'>All Instructors Breakdown</h1>
				<h3 className='text-white text-sm'>
					This graphic displays all semesters and professors that have taught this course. Use the search bar below to filter for a specific professor!<br />
					GPA: <span className='bg-[#632230] px-2'>1.0</span> ― <span className='bg-[#ddaa33] px-2 text-black'>4.0</span>
				</h3>
				<SearchBar
					placeholder="Filter instructors..."
					value={searchQuery}
					onChange={setSearchQuery}
				/>
				<div className='mt-2'>
					{Object.keys(gpa).map((semester, index) => {
						const filteredInstructors = Object.keys(gpa[semester]).filter(instructor =>
							instructor.toLowerCase().includes(searchQuery.toLowerCase())
						);

						if (filteredInstructors.length === 0) return null;

						return (
							<div key={index} className='flex flex-col mt-5'>
								<h2 className='text-white font-bold text-xl border-b border-yellow-500'>{semester}</h2>
								<div className='flex flex-col justify-stretch'>
									{filteredInstructors.map((instructor, index) => (
										<div key={index} className='flex flex-row mt-2 items-center justify-between'>
											<h3 className='text-white font-semibold text-md mr-2'>{instructor}</h3>
											<span className='h-0.5 border-b border-dotted flex-grow mx-2' />
											<div className='grid w-20 h-10 text-center' style={{ backgroundColor: `${gpa[semester][instructor].color}` }}>
												<p className='text-white m-auto font-semibold'>{gpa[semester][instructor].gpa}</p>
											</div>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
	);
};

export default FullInstructorModal;
