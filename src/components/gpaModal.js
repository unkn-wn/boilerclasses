import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';
import { processGpaData } from '@/lib/gpaUtils';

const replaceZeroGpaWithDash = (gpaValue) => {
    return gpaValue === 0 ? '-' : gpaValue;
};

const GpaModal = ({ course }) => {
	const [gpa, setGpa] = useState({});
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		const grades = processGpaData(course);
		setGpa(grades);
	}, [course]);

	const filteredInstructors = Object.keys(gpa).filter(instructor =>
		instructor.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className='h-[32rem] overflow-y-auto flex flex-col'>
			<h1 className='text-primary text-2xl font-bold'>GPA Breakdown</h1>
			<h3 className='text-primary text-sm'>
				This graphic displays all the professors along with their GPA for each semester. Use the search bar to filter for a specific professor!<br />
				GPA: <span className='bg-[#632230] px-2'>1.0</span> ― <span className='bg-[#ddaa33] px-2 text-opposite'>4.0</span>
			</h3>
			<SearchBar
				placeholder="Filter instructors..."
				value={searchQuery}
				onChange={setSearchQuery}
			/>
			<div className='mt-2'>
				{filteredInstructors.map((instructor, index) => (
					<div key={index} className='flex flex-col mt-5'>
						<h2 className='text-primary font-bold text-xl'>{instructor}</h2>
						<div className='grid grid-flow-col auto-cols-fr justify-stretch'>
							{Object.keys(gpa[instructor]).map((semester, index) => (
								// console.log(`bg-[${gpa[instructor][semester].color}]`),
								<div key={index} className='flex flex-col mt-2'>
									<div className='grid h-12 text-center relative overflow-hidden' style={{ backgroundColor: `${gpa[instructor][semester].color}` }}>
										{/* <div className='absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none' /> */}
										<p className='text-white m-auto font-black relative z-10'>{replaceZeroGpaWithDash(gpa[instructor][semester].gpa)}</p>
									</div>
									<h3 className='text-secondary text-center text-sm px-1 hidden md:block'>{semester}</h3>
									<h3 className='text-secondary text-center text-[10px] px-1 block md:hidden'>{semester.split(" ")[0]}</h3>
									<h3 className='text-secondary text-center text-sm px-1 block md:hidden'>{" '" + semester.split(" ")[1].substring(2, 4)}</h3>
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
		if (!course.instructor[CURRENT_SEMESTER]) {
			setGpa({});
			return;
		}

		for (const instructor in grades) {
			if (!course.instructor[CURRENT_SEMESTER].includes(instructor)) {
				delete grades[instructor];
			}
		}

		setGpa(grades);
	}, [course]);

	return (
		<div className='flex flex-col'>
			{Object.keys(gpa).length != 0 ? (
				<>
					<div className='w-full grid font-bold mt-2 border-b'
						style={{
							gridTemplateColumns: `repeat(${Object.keys(gpa).length > 0 ?
								Math.min(Object.keys(gpa[Object.keys(gpa)[0]]).length, 5) : 1}, minmax(0, 1fr))`
						}}>
						{Object.keys(gpa).length > 0 &&
							Object.keys(gpa[Object.keys(gpa)[0]]).slice(0, 5).map((semester, i) => (
								<div key={i} className='flex flex-col'>
									<h3 className='text-center text-[10px]'>{semester.split(" ")[0]}</h3>
									<h3 className='text-center text-[10px]'>{" '" + semester.split(" ")[1].substring(2, 4)}</h3>
								</div>
							))
						}
					</div>
					{Object.keys(gpa).map((instructor, index) => (
						<div key={index} className='grid grid-flow-row py-1 gap-1'>
							<h2 className='text-primary text-xs'>{instructor}</h2>
							<div className='w-full grid grid-flow-col auto-cols-fr justify-stretch gap-1'>
								{Object.keys(gpa[instructor]).map((semester, index) => (
									<div key={index} className='flex flex-col'>
										<div className='grid py-1 text-center rounded-md relative overflow-hidden' style={{ backgroundColor: `${gpa[instructor][semester].color}` }}>
											{/* <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none' /> */}
											<p className='text-white m-auto text-sm font-bold relative z-10'>{replaceZeroGpaWithDash(gpa[instructor][semester].gpa)}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</>
			) : (
				<div>
					<p className='text-primary text-sm font-light text-left'>No data for current instructors.</p>
				</div>
			)}
		</div>
	);
};