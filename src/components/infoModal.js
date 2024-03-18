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



const InfoModal = ({ isOpen, onClose }) => {

	return (
		<ChakraProvider theme={theme}>
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay
					backdropFilter='blur(5px)'
				/>
				<ModalContent maxW={{ base: "40%" }} maxH={"80%"}>
					<ModalHeader />
					<ModalBody>

							<p className='text-white'>
								The <span className='font-bold'>first instructor selected</span> represents the Average GPA and RateMyProfessors Rating on the circle graphs! To view a different average GPA or RateMyProfessor (RMP) rating, click the instructor dropdown and select a different instructor, and remove the previous instructor.
								<br />
								<br />
								To view <span className='font-bold'>all instructor GPAs</span>, click on the circle graphs. It will display the breakdown of each professor's GPA per semester. 0 means that the professor has not taught that semester.
							</p>

					</ModalBody>
					<ModalCloseButton color={'white'} />
					<ModalFooter />
				</ModalContent>
			</Modal>
		</ChakraProvider>
	);
};

export default InfoModal;
