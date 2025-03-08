// GPA Modal component for all GPA data for each professor and each semester

import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import GpaTable from '@/components/detail/GpaTable';
import { useDetailContext } from '@/components/detail/context/DetailContext';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';
import { Switch } from '@chakra-ui/react';

const GpaModal = () => {
  const { courseData, selectedInstructors } = useDetailContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  useEffect(() => {
    if (selectedInstructors.length === 0) {
      setShowSelectedOnly(false);
    }
  }, [selectedInstructors]);

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
          <h2 className="text-2xl font-bold">All Grades</h2>
        </div>

        <div className="mt-2 flex items-start gap-3">
          <div className="text-sm">
            <p className="text-secondary mb-2">This table shows grade distributions for every professor. The <span className="font-semibold">Average</span> column shows the instructor's overall GPA for this course.</p>
            <p className="text-tertiary">Click on any instructor to add them to the Overview tab.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4 items-end md:items-center">
        <SearchBar
          placeholder="Filter instructors..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="flex-grow"
        />

        {/* Selected instructors toggle switch */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="selected-only"
            checked={showSelectedOnly}
            onChange={() => setShowSelectedOnly(!showSelectedOnly)}
            className="mr-1"
          />
          <label htmlFor="selected-only" className="text-sm text-tertiary cursor-pointer">
            Selected Only
          </label>
        </div>
      </div>

      <GpaTable
        searchQuery={searchQuery}
        showSelectedOnly={showSelectedOnly}
        selectedInstructorsList={selectedInstructors}
      />
    </div>
  );
};

export default GpaModal;

// For backward compatibility
export { default as ScheduleGpaModal } from '@/components/schedule/ScheduleGpaModal';