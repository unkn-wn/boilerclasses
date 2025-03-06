// GPA Modal component for all GPA data for each professor and each semester

import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import GpaTable from '@/components/detail/GpaTable';
import { useDetailContext } from '@/components/detail/context/DetailContext';

const GpaModal = () => {
  const { courseData } = useDetailContext();
  const [searchQuery, setSearchQuery] = useState('');

  if (!courseData || !courseData.gpa) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-tertiary font-medium">No GPA data available for this course</p>
      </div>
    );
  }

  return (
    <div className="w-full text-primary">
      <div className="flex flex-col mb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">GPA Breakdown</h2>
          {/* <div className="flex items-center text-sm bg-background px-3 py-1 rounded-lg">
            <span className='mr-1'>GPA:</span>
            <span className='text-white bg-[#632230] px-2 mr-1'>1.0</span>
            <span className='bg-[#ddaa33] px-2 text-black'>4.0</span>
          </div> */}
        </div>

        {/* Description text */}
        <div className="mt-2 flex items-start gap-3">
          <div className="text-sm">
            <p className="text-secondary mb-2">This table shows GPA data for each instructor across different semesters. The <span className="font-semibold">Average</span> column shows the instructor's overall GPA for this course.</p>
            <p className="text-tertiary">Click on any row to select/deselect an instructor and add them to the charts in the Overview tab.</p>
          </div>
        </div>
      </div>

      <SearchBar
        placeholder="Filter instructors..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="mb-4"
      />

      {/* Pass only search query and enable local selection mode */}
      <GpaTable
        searchQuery={searchQuery}
        localSelectMode={true}
      />
    </div>
  );
};

export default GpaModal;

// For backward compatibility
export { default as ScheduleGpaModal } from '@/components/schedule/ScheduleGpaModal';