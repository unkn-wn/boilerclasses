import { useRouter } from 'next/router';
import Link from 'next/link';

const Prereqs = ({ course, scheduler = false }) => {
  const router = useRouter();

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
          <a
            onClick={(e) => {
              if (scheduler) {
                window.open(`https://www.boilerclasses.com/detail/${detailId}`, '_blank');
              } else {
                router.push(`/detail/${detailId}`);
              }
            }}
            className='underline decoration-dotted cursor-pointer hover:text-blue-700 transition-all duration-300 ease-out text-blue-600'
          >
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
        <div className="prerequisites-container">
          {!scheduler && <div className="text-tertiary lg:text-sm text-xs mb-2">Prerequisites:</div>}
          <div className="lg:text-sm text-xs text-tertiary font-medium">
            {course.prereqs.map((prereq, i) => parsePrereqs(prereq, i))}
          </div>
        </div>
      )
    );
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default Prereqs;