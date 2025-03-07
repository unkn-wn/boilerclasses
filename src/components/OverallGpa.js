import { calculateOverallGPA } from '@/lib/gpaUtils';
import { Tooltip } from '@chakra-ui/react';

const OverallGpa = ({ courseData, card, preCalculatedData = null }) => {
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
      <Tooltip
        label={`Averaged across ${totalSemCount} semester(s) and ${profCount} instructor(s)`}
        hasArrow
        placement='auto'
        bg={`rgb(var(--background-secondary-color))`}
        color={`rgb(var(--text-color))`}
        openDelay={0}
        fontSize='sm'
        px={2}
        py={1}
      >
        {content}
      </Tooltip>
    );
  }

  // Otherwise return just the GPA display
  return content;
};

export default OverallGpa;