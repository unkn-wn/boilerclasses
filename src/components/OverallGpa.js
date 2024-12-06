import { calculateOverallGPA } from '@/lib/gpaUtils';
import { Tooltip } from '@chakra-ui/react';

const OverallGpa = ({ courseData, card }) => {
  const { gpa, color, profCount, totalSemCount } = calculateOverallGPA(courseData);

  return (
    <Tooltip
      label={`Averaged across ${totalSemCount} semester(s) and ${profCount} professor(s)`}
      hasArrow
      placement='auto'
      bg='gray.900'
      color='white'
      openDelay={0}
      fontSize='sm'
      px={2}
      py={1}
    >
      <div className={`relative justify-center flex whitespace-nowrap
        ${card ? 'text-sm px-2 py-1 mx-1 my-1 rounded-full' : 'px-5 rounded-md'}`}
        style={{ backgroundColor: color }}>
        {/* <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none' /> */}
        <span className={`my-auto font-black text-white`}>
          GPA: {gpa === 0 ? "N/A" : gpa}
        </span>
      </div>
    </Tooltip>
  );
};

export default OverallGpa;