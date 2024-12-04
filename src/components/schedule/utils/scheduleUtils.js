
export const groupLecturesByTime = (lectures) => {
  const grouped = lectures.reduce((acc, lecture) => {
    const timeKey = lecture.startTime;
    if (!acc[timeKey]) acc[timeKey] = [];
    acc[timeKey].push(lecture);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped)
      .sort(([timeA, _], [timeB, __]) => sortByTime(timeA, timeB))
  );
};

export const normalizeInstructorName = (lectureName, courseInstructors) => {
  if (!lectureName) return "";
  const nameParts = lectureName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return Object.values(courseInstructors)
    .flat()
    .find(instructor => {
      const instructorParts = instructor.split(' ');
      return instructorParts[0] === firstName &&
        instructorParts[instructorParts.length - 1] === lastName;
    }) || lectureName;
};