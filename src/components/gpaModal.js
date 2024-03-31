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



const GpaModal = ({ isOpen, onClose, course }) => {

	const [gpa, setGpa] = useState({});

	// function to get color based on gpa:
	const getColor = (gpa) => {
		if (gpa === 0) {
			return "#18181b";
		}

		// calculate the color based on gpa as a percentage of 4.0
		const perc = gpa / 4.0;
		const perc2 = perc * perc * 1;
		const color1 = [43, 191, 199];
		const color2 = [38, 19, 43];

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
		if (Object.keys(course.gpa).length === 0) return;

		/////////////////////////////////////////////////////
		// set the distributed gpas for each prof and sem

		const grades = {};
		const sems = [];
		for (const instructor in course.gpa) {
			grades[instructor] = {};
			for (const semester in course.gpa[instructor]) {
				if (!sems.includes(semester)) {
					sems.push(semester);
				}
			}
		}

		const sorted_sems = sems.sort((a, b) => {
			const a_split = a.split(" ");
			const b_split = b.split(" ");
			if (a_split[1] !== b_split[1]) {
				return a_split[1] - b_split[1];
			}

			const seasons = ["Spring", "Summer", "Fall"];
			return seasons.indexOf(a_split[0]) - seasons.indexOf(b_split[0]);
		});

		// all sems should be present in gpa, if it doesnt exist, set it to 0
		for (const instructor in course.gpa) {
			for (const semester of sorted_sems) {
				if (!course.gpa[instructor][semester]) {
					grades[instructor][semester] = { gpa: 0, color: getColor(0) };
				} else {
					grades[instructor][semester] = { gpa: course.gpa[instructor][semester][13], color: getColor(course.gpa[instructor][semester][13]) };
				}
			}
		}


		setGpa(grades);
	}, [course]);


	return (
		<ChakraProvider theme={theme}>
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay
					backdropFilter='blur(5px)'
				/>
				<ModalContent maxW={{ base: "90%", lg: "60%" }} maxH={"80%"}>
					<ModalHeader />
					<ModalBody className=' overflow-y-auto'>
						<div className='flex flex-col'>
							<h1 className='text-white text-2xl font-bold'>GPA Breakdown</h1>
							<h3 className='text-white text-sm'>To view instructors ordered by semester, click on the "View All Instructors" button under the title!</h3>
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
														<p className='text-white m-auto font-semibold'>{gpa[instructor][semester].gpa}</p>
													</div>
													<h3 className='text-zinc-500 text-center text-sm px-1'>{semester}</h3>
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

export default GpaModal;
