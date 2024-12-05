import { calculateOverallGPA } from '@/lib/gpaUtils';

const OverallGpa = ({ courseData, card }) => {
  const { gpa, color } = calculateOverallGPA(courseData);

  return (
    <a className={`justify-center flex whitespace-nowrap
      ${card ? 'text-sm px-2 py-1 mx-1 my-1 rounded-full border-2 border-yellow-700' : 'px-5 rounded-md'}`}
      style={{
        backgroundColor: color
      }}
      title="Total calculated GPA across all semesters and professors">
      <span className={`my-auto ${card ? '' : 'text-lg'} font-black text-white`}>
        GPA: {gpa === 0 ? "N/A" : gpa}
      </span>
    </a>
  );
};

export default OverallGpa;