import { calculateOverallGPA } from '@/lib/gpaUtils';
import { useId } from 'react';

const OverallGpa = ({ courseData, card, preCalculatedData = null }) => {
  const tooltipId = useId();
  // Use pre-calculated data if provided, otherwise calculate it
  const { gpa, color, profCount, totalSemCount } = preCalculatedData || calculateOverallGPA(courseData);

  // Create the content with appropriate styling based on card prop
  const content = (
    <div className={`relative justify-center flex whitespace-nowrap
      ${card ? 'text-sm px-2 py-1 mx-1 my-1 rounded-full' : 'px-5 rounded-md'}`}
      style={{ backgroundColor: color }}>
      <span className={`my-auto font-black ${gpa === 0 ? "text-primary" : "text-white"}`}>
        GPA: {gpa === 0 ? "N/A" : gpa}
      </span>
    </div>
  );

  // Only wrap in tooltip if card is true
  if (card) {
    return (
      <div className="group relative inline-flex" tabIndex={0} aria-describedby={tooltipId}>
        {content}
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-1 w-max max-w-[240px] -translate-y-1/2 rounded px-2 py-1 text-sm invisible group-hover:visible group-focus:visible"
          style={{ backgroundColor: 'rgb(var(--background-secondary-color))', color: 'rgb(var(--text-color))' }}
        >
          Averaged across {totalSemCount} semester(s) and {profCount} instructor(s)
        </span>
      </div>
    );
  }

  // Otherwise return just the GPA display
  return content;
};

export default OverallGpa;
