import React, { useEffect, useState } from 'react';
import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	ChakraProvider,
	extendTheme,
} from '@chakra-ui/react';

const theme = extendTheme({
	components: {
		Modal: {
			baseStyle: (props) => ({
				dialog: {
					bg: "#18181b"
				}
			})
		}
	}
});



const FullInstructorModal = ({ isOpen, onClose, course }) => {

	const [gpa, setGpa] = useState({});

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


	// Helper function to format instructor name
	function formatInstructorName(name) {
		if (name === "TBA") return 'TBA';
		const splitName = name.split(' ');
		const lastName = splitName.pop();
		const firstName = splitName.shift();
		const middleName = splitName.join(' ');
		if (middleName.length === 1) {
			splitName[0] = middleName + '.';
		}
		return `${lastName}, ${firstName}${splitName.length > 0 ? ' ' + splitName.join(' ') : ''}`;
	}


	useEffect(() => {
		if (!course) return;
		if (Object.keys(course.gpa).length === 0) return;
		// console.log(JSON.stringify(course, null, 2));

		/////////////////////////////////////////////////////
		// consolidate grades and instr per sem data

		const consolidatedData = {};

		// Populate consolidatedData with all semesters and professors
		for (const semester in course.instructor) {
			consolidatedData[semester] = {};
			for (const instructor of course.instructor[semester]) {
				const formattedInstructor = formatInstructorName(instructor);
				consolidatedData[semester][formattedInstructor] = {
					gpa: "No GPA",
					color: getColor(0)
				};
			}
		}

		// Update consolidatedData with available grades data
		for (const instructor in course.gpa) {
			for (const semester in course.gpa[instructor]) {
				if (consolidatedData[semester] && consolidatedData[semester][instructor]) {
					const gpa = course.gpa[instructor][semester][13];
					consolidatedData[semester][instructor] = {
						gpa: gpa || "No GPA",
						color: getColor(gpa || 0)
					};
				}
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
		<ChakraProvider theme={theme}>
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay
					backdropFilter='blur(5px)'
				/>
				<ModalContent maxW={{ base: "90%", md: "60%", lg: "40%" }} maxH={"80%"}>
					<ModalHeader />
					<ModalBody className=' overflow-y-auto'>
						<div className='flex flex-col'>
							<h1 className='text-white text-2xl font-bold'>All Instructors Breakdown</h1>
							<h3 className='text-white text-sm'>
								To view all semester GPAs sorted by professor, click on the "Average GPA" circle graph!<br />
								This graphic displays all the semesters with each professor. Pro-tip: use ⌘F or Ctrl+F to search for a specific professor!
							</h3>
							<div className='mt-2'>
								{Object.keys(gpa).map((semester, index) => (
									<div key={index} className='flex flex-col mt-5'>
										<h2 className='text-white font-bold text-xl border-b border-yellow-500'>{semester}</h2>
										<div className='flex flex-col justify-stretch'>
											{Object.keys(gpa[semester]).map((instructor, index) => (
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
								))}
							</div>
						</div>
					</ModalBody>
					<ModalCloseButton color={'white'} />
					<ModalFooter />
				</ModalContent>
			</Modal>
		</ChakraProvider>
	);
};

export default FullInstructorModal;
