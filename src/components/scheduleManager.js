import React, { useState, useEffect } from 'react';
import {
  Checkbox,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { groupLecturesByTimeSlot, convertTimeToNumber, calculateEndTime } from './calendar';

export const processLectureData = (courseResults, courses) => {
  const coursesArray = [];

  courseResults.forEach((result, index) => {
    if (!result) return;

    // Use groupLecturesByTimeSlot to get pre-grouped lectures
    const groupedLectures = groupLecturesByTimeSlot(result);

    groupedLectures.forEach(lecture => {

      const start = convertTimeToNumber(lecture.startTimeRaw);
      const end = calculateEndTime(lecture.startTimeRaw, lecture.duration);
      const courseName = `${courses[index].subjectCode} ${courses[index].courseCode}`;
      coursesArray.push({
        id: lecture.id,
        name: courseName,
        type: lecture.type,
        start,
        end,
        day: lecture.days.map(day => day.slice(0, 3)), // Convert to abbreviated form
        instructors: lecture.instructors,
        startTime: lecture.startTime
      });
    });
  });

  return coursesArray;
};

const CourseGroup = ({ courseName, lectures, selectedLectures, onLectureToggle }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        onClick={onOpen}
        className="w-full text-left"
        leftIcon={<ChevronRightIcon size={20} />}
      >
        <span className="font-semibold">{courseName}</span>
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{courseName} Sections</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={2}>
              {lectures.map((lecture) => (
                <Checkbox
                  key={lecture.id}
                  isChecked={selectedLectures.has(lecture.id)}
                  onChange={() => onLectureToggle(lecture.id)}
                  colorScheme="blue"
                >
                  <span className="text-sm">
                    {`${lecture.type} - ${lecture.startTime} (${lecture.day.join(', ')})`}
                    <div className="text-xs text-gray-400">
                      {lecture.instructors.join(', ')}
                    </div>
                  </span>
                </Checkbox>
              ))}
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

const ScheduleManager = ({ lectures, onLectureSelectionChange }) => {
  const [selectedLectures, setSelectedLectures] = useState(new Set());

  // Initialize all lectures as selected
  // useEffect(() => {
  //   if (lectures.length > 0) {
  //     const allLectureIds = new Set(lectures.map(lecture => lecture.id));
  //     setSelectedLectures(allLectureIds);
  //   }
  // }, [lectures]);

  const handleLectureToggle = (lectureId) => {
    const newSelectedLectures = new Set(selectedLectures);
    if (newSelectedLectures.has(lectureId)) {
      newSelectedLectures.delete(lectureId);
    } else {
      newSelectedLectures.add(lectureId);
    }
    setSelectedLectures(newSelectedLectures);

    // Filter lectures based on selection
    const filteredLectures = lectures.filter(lecture =>
      newSelectedLectures.has(lecture.id)
    );
    onLectureSelectionChange(filteredLectures);
  };

  // Group lectures by course name
  const courseGroups = lectures.reduce((acc, lecture) => {
    if (!acc[lecture.name]) {
      acc[lecture.name] = [];
    }
    acc[lecture.name].push(lecture);
    return acc;
  }, {});

  return (
    <div className="p-4 border border-zinc-800 rounded-lg">
      <h2 className="text-lg font-bold mb-3">Course Selection</h2>
      {Object.entries(courseGroups).map(([courseName, courseLectures]) => (
        <CourseGroup
          key={courseName}
          courseName={courseName}
          lectures={courseLectures}
          selectedLectures={selectedLectures}
          onLectureToggle={handleLectureToggle}
        />
      ))}
    </div>
  );
};

export default ScheduleManager;