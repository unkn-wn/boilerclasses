import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  Button,
  Box,
  Text,
  Flex,
  Badge,
  Heading,
  useDisclosure,
  AspectRatio,
  Image,
} from '@chakra-ui/react';
import { FaLightbulb, FaChartLine, FaGraduationCap } from 'react-icons/fa';

const ReleaseNotes = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [hasSeenNotes, setHasSeenNotes] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({
    feature1: false,
    feature2: false,
    feature3: false
  });

  // Check if the user has seen the release notes before
  useEffect(() => {
    const seenReleaseNotes = localStorage.getItem('seenReleaseNotes-v1');
    if (!seenReleaseNotes && window.innerWidth >= 768) {
      onOpen();
    } else {
      setHasSeenNotes(true);
    }
  }, [onOpen]);

  const handleClose = () => {
    localStorage.setItem('seenReleaseNotes-v1', 'true');
    setHasSeenNotes(true);
    onClose();
  };

  // Function to track when images are loaded
  const handleImageLoaded = (feature) => {
    setImagesLoaded(prev => ({
      ...prev,
      [feature]: true
    }));
  };

  // Show the "What's New" button if the modal is closed
  const showWhatsNewButton = !isOpen && hasSeenNotes;

  return (
    <div className='hidden md:block'>
      {showWhatsNewButton && (
        <Button
          position="fixed"
          bottom="4"
          left="4"
          colorScheme="blue"
          size="sm"
          onClick={onOpen}
          zIndex="100"
          boxShadow="lg"
          borderRadius="full"
          px="4"
          rightIcon={<FaLightbulb />}
        >
          What's New
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={handleClose} size={{ base: "full", md: "4xl" }} isCentered>
        <ModalOverlay backdropFilter="blur(3px)" />
        <div className="relative z-60">
          <ModalContent
            bg="#121212"
            color="white"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.7)"
            borderRadius="xl"
            overflow="hidden"
            mx={{ base: 2, md: 6 }}
            my={{ base: 0, md: 6 }}
            p={0}
          >
            {/* Custom header with gradient background */}
            <div className="bg-gradient-to-r from-red-800 to-yellow-600 px-6 py-5">
              <Flex justifyContent="space-between" alignItems="center">
                <Flex alignItems="center" gap={3}>
                  <div className="rounded-full">
                    <Image src="/boilerclasses-FULL.png" alt="BoilerClasses logo" width="12" />
                  </div>
                  <Heading size={{ base: "md", md: "lg" }} fontWeight="bold">BoilerClasses Overhaul!</Heading>
                </Flex>
                <Badge
                  bg="rgba(255,255,255,0.15)"
                  color="white"
                  py={1}
                  px={2}
                  borderRadius="md"
                >
                  v2.0
                </Badge>
              </Flex>
              <Text mt={2} fontSize="sm" opacity={0.8}>
                New and improved features added on with a similar structure! Check out what's new below.
              </Text>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5">
                  <Flex alignItems="center" gap={2} mb={3}>
                    <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                      <FaGraduationCap size={16} />
                    </div>
                    <div>
                      <Text fontWeight="bold" fontSize="md">Instructor Insights</Text>
                      <Badge bg="green.400" color="black" fontSize="2xs">NEW</Badge>
                    </div>
                  </Flex>

                  <Text fontSize="xs" mb={4} opacity={1} lineHeight="1.5">
                    Now you can see all instructors from past semesters in one place!
                    Check out their <span className='text-yellow-400 font-bold'>RateMyProfessor</span> ratings and <span className='text-yellow-400 font-bold'>GPA</span> history to find the right prof for you.
                  </Text>
                </div>

                <AspectRatio ratio={16/9} maxH="200px">
                  <div className="bg-black relative overflow-hidden">
                    {!imagesLoaded.feature1 && (
                      <div className="absolute inset-0 flex justify-center items-center">
                        <div className="animate-pulse w-8 h-8 rounded-full bg-gray-600"></div>
                      </div>
                    )}
                    <Image
                      src="/feature1.gif"
                      alt="Instructor dropdown demonstration"
                      objectFit="cover"
                      width="100%"
                      height="100%"
                      loading="eager"
                      onLoad={() => handleImageLoaded('feature1')}
                      opacity={imagesLoaded.feature1 ? 1 : 0}
                      transition="opacity 0.3s"
                      style={{
                        transform: "scale(1.4)",
                        transformOrigin: "1px 75px"
                      }}
                    />
                  </div>
                </AspectRatio>
              </div>

              {/* Feature 2 */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5">
                  <Flex alignItems="center" gap={2} mb={3}>
                    <div className="bg-purple-500 rounded-full p-2 flex-shrink-0">
                      <FaChartLine size={16} />
                    </div>
                    <div>
                      <Text fontWeight="bold" fontSize="md">GPA Trends Graph</Text>
                      <Badge bg="purple.400" color="black" fontSize="2xs">NEW</Badge>
                    </div>
                  </Flex>

                  <Text fontSize="xs" mb={4} opacity={0.8} lineHeight="1.5">
                    Compare different professors side by side! See which prof gives the best grades
                    and watch how their grading changes over time.
                  </Text>
                </div>

                <AspectRatio ratio={16/9} maxH="200px">
                  <div className="bg-black relative overflow-hidden">
                    {!imagesLoaded.feature2 && (
                      <div className="absolute inset-0 flex justify-center items-center">
                        <div className="animate-pulse w-8 h-8 rounded-full bg-gray-600"></div>
                      </div>
                    )}
                    <Image
                      src="/feature2.gif"
                      alt="GPA trends graph demonstration"
                      objectFit="cover"
                      width="100%"
                      height="100%"
                      loading="eager"
                      onLoad={() => handleImageLoaded('feature2')}
                      opacity={imagesLoaded.feature2 ? 1 : 0}
                      transition="opacity 0.3s"
                      style={{
                        transform: "scale(1.75)",
                        transformOrigin: "0px 50px"
                      }}
                    />
                  </div>
                </AspectRatio>
              </div>

              {/* Feature 3 */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5">
                  <Flex alignItems="center" gap={2} mb={3}>
                    <div className="bg-orange-500 rounded-full p-2 flex-shrink-0">
                      <FaGraduationCap size={16} />
                    </div>
                    <div>
                      <Text fontWeight="bold" fontSize="md">All Grades Tab</Text>
                      <Badge bg="orange.400" color="black" fontSize="2xs">NEW</Badge>
                    </div>
                  </Flex>

                  <Text fontSize="xs" mb={4} opacity={0.8} lineHeight="1.5">
                    We have a new <span className='text-yellow-400 font-bold'>All Grades</span> tab shows you exactly which profs give the most A's.
                    Sort by GPA, grade percentage -- similar to <span className='text-yellow-400 font-bold'>Boilergrades</span>!
                  </Text>
                </div>

                <AspectRatio ratio={16/9} maxH="200px">
                  <div className="bg-black relative overflow-hidden">
                    {!imagesLoaded.feature3 && (
                      <div className="absolute inset-0 flex justify-center items-center">
                        <div className="animate-pulse w-8 h-8 rounded-full bg-gray-600"></div>
                      </div>
                    )}
                    <Image
                      src="/feature3.gif"
                      alt="All Grades tab demonstration"
                      objectFit="cover"
                      width="100%"
                      height="100%"
                      loading="eager"
                      onLoad={() => handleImageLoaded('feature3')}
                      opacity={imagesLoaded.feature3 ? 1 : 0}
                      transition="opacity 0.3s"
                      style={{
                        transform: "scale(1.5)",
                        transformOrigin: "150px 0"
                      }}
                    />
                  </div>
                </AspectRatio>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-900 flex justify-end">
              <button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2 rounded-md font-medium text-sm"
              >
                Got it!
              </button>
            </div>
          </ModalContent>
        </div>
      </Modal>
    </div>
  );
};

export default ReleaseNotes;
