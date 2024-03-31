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



const GpaModal = ({ isOpen, onClose, grades }) => {

	const [gpa, setGpa] = useState({});


	useEffect(() => {
		// console.log(grades);
		setGpa(grades);
	}, [grades]);


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
													<div className='grid h-12 text-center' style={{backgroundColor: `${gpa[instructor][semester].color}`}}>
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
