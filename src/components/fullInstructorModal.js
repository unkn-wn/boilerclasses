import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { getColor } from '@/lib/gpaUtils';

const FullInstructorModal = ({ course }) => {

	const [gpa, setGpa] = useState({});
	const [searchQuery, setSearchQuery] = useState('');


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
<<<<<<< HEAD
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
=======
			<div className='h-[32rem] overflow-y-auto flex flex-col'>
				<h1 className='text-primary text-2xl font-bold'>All Instructors Breakdown</h1>
				<h3 className='text-primary text-sm'>
					This graphic displays all semesters and professors that have taught this course. Use the search bar below to filter for a specific professor!<br />
					GPA: <span className='bg-[#632230] px-2'>1.0</span> ― <span className='bg-[#ddaa33] px-2 text-opposite'>4.0</span>
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
>>>>>>> eb44da0 (schedule hover fix)

					if (filteredInstructors.length === 0) return null;

<<<<<<< HEAD
					return (
						<div key={index} className='flex flex-col mt-5'>
							<h2 className='text-white font-bold text-xl border-b border-yellow-500'>{semester}</h2>
							<div className='flex flex-col justify-stretch'>
								{filteredInstructors.map((instructor, index) => (
									<div key={index} className='flex flex-row mt-2 items-center justify-between'>
										<h3 className='text-white font-semibold text-md mr-2'>{instructor}</h3>
										<span className='h-0.5 border-b border-dotted flex-grow mx-2' />
										<div className='relative grid w-20 h-10 text-center' style={{ backgroundColor: `${gpa[semester][instructor].color}` }}>
											{/* <div className='absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none' /> */}
											<p className='text-white m-auto font-black z-10'>{gpa[semester][instructor].gpa}</p>
=======
						return (
							<div key={index} className='flex flex-col mt-5'>
								<h2 className='text-primary font-bold text-xl border-b border-yellow-500'>{semester}</h2>
								<div className='flex flex-col justify-stretch'>
									{filteredInstructors.map((instructor, index) => (
										<div key={index} className='flex flex-row mt-2 items-center justify-between'>
											<h3 className='text-primary font-semibold text-md mr-2'>{instructor}</h3>
											<span className='h-0.5 border-b border-dotted flex-grow mx-2' />
											<div className='grid w-20 h-10 text-center' style={{ backgroundColor: `${gpa[semester][instructor].color}` }}>
												<p className='text-primary m-auto font-semibold'>{gpa[semester][instructor].gpa}</p>
											</div>
>>>>>>> eb44da0 (schedule hover fix)
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
