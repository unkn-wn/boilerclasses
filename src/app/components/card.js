import { semesters } from "../../lib/utils"


const Card = ({ course }) => {

  const instructors = new Set();
  const availableSemesters = [];

  semesters.forEach((sem) => {
    try {
      course.instructor[sem].forEach((prof) => instructors.add(prof));
      if (course.terms.includes(sem)) {
        availableSemesters.push(sem);
      }
    } catch {}
  });
  const uniqueInstructors = [...instructors];

  return (
    <div className="flex flex-col bg-slate-200 p-6 rounded-md shadow-md hover:scale-105 transition hover:transition">
      <h2 className="lg:text-lg md:text-lg font-bold">{course.subjectCode} {course.courseCode}: {course.title}</h2>
      <p className="lg:text-sm text-sm text-gray-700 font-medium my-1">
        <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${uniqueInstructors[0].split(" ")[0]} ${uniqueInstructors[0].split(" ")[uniqueInstructors[0].split(" ").length-1]}`} 
          target="_blank" rel="noopener noreferrer"
          className='underline decoration-dotted'>
          {uniqueInstructors[0]}
        </a>
        { uniqueInstructors.length > 1 && ", "}
        { uniqueInstructors.length > 1 &&
          <a href={`https://www.ratemyprofessors.com/search/professors/783?q=${uniqueInstructors[1]}`} 
            target="_blank" rel="noopener noreferrer"
            className='underline decoration-dotted '>
            {uniqueInstructors[1]}
          </a>
        }
        
      </p>
      <p className="text-sm text-gray-600 mb-4 break-words grow"> 
        <span>{course.description.length > 200
        ? `${course.description.substring(0, 200)}...`
        : course.description}
        </span>
      </p>
      <div>
      {availableSemesters.map((sem, i) => (
        (i < 3) && <span className="text-sm px-2 py-1 mx-1 rounded-full border-solid border border-sky-500 bg-sky-300" key={i}>{sem}</span>
      ))}
      </div>
    </div>
  )
};

export default Card;