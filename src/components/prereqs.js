import { useRouter } from 'next/router';
import Link from 'next/link';

const Prereqs = ({ course }) => {
  const router = useRouter();

  const handleClick = (detailId) => {
    router.push(`/detail/${detailId}`).then(() => {
      router.reload();
    });
  };

  const parsePrereqs = (prereq, i) => {
    if (prereq.split(' ').length == 2) {
      const [detailId, concurrent] = prereq.split(' ');
      const subjectCodeMatch = detailId.match(/[A-Z]+/);
      const courseNumberMatch = detailId.match(/\d+/);

      if (!subjectCodeMatch || !courseNumberMatch) {
        return null;
      }

      const subjectCode = subjectCodeMatch[0];
      const courseNumber = courseNumberMatch[0];

      return (
        <span className='' key={i}>
          <a onClick={() => handleClick(detailId)}
            className='underline decoration-dotted hover:text-blue-400 transition-all duration-300 ease-out text-blue-600'>
            {subjectCode} {courseNumber}
          </a>
          {concurrent === "True" ? " [may be taken concurrently]" : ""}
        </span>
      );
    } else if (prereq.split(' ').length == 3) {
      const [subject, number, concurrent] = prereq.split(' ');
      return `${subject} ${number}${concurrent === "True" ? " [may be taken concurrently]" : ""}`;
    } else {
      return `${"()".includes(prereq) ? "" : " "}${prereq}${"()".includes(prereq) ? "" : " "}`;
    }
  };

  try {
    return (
      (course.prereqs && course.prereqs[0].split(' ')[0] !== router.query.id) && (
        <p className="lg:text-sm text-xs text-gray-400 mb-4 font-medium">
          <span className="text-gray-400 lg:text-sm text-xs">Prerequisites: </span>
          {course.prereqs.map((prereq, i) => parsePrereqs(prereq, i))}
        </p>
      )
    );
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default Prereqs;