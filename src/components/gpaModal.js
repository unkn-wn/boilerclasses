// GPA Modal component for all GPA data for each professor and each semester

import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import GpaTable from '@/components/detail/GpaTable';
import ProfessorComparisonChart from '@/components/detail/ProfessorComparisonChart';
import { processGpaDataForDisplay } from '@/components/detail/GpaDataProcessor';

const GpaModal = ({ course, selectedInstructors = [] }) => {
  const [gpaData, setGpaData] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedInstructors, setLocalSelectedInstructors] = useState(selectedInstructors);

  useEffect(() => {
    const { professorData, semesters } = processGpaDataForDisplay(course);
    setGpaData(professorData);
    setSemesters(semesters);
  }, [course]);

  // Update local selection when props change
  useEffect(() => {
    setLocalSelectedInstructors(selectedInstructors);
  }, [selectedInstructors]);

  // Handle selecting/deselecting professors
  const handleProfessorSelection = (professorName) => {
    setLocalSelectedInstructors(prev => {
      if (prev.includes(professorName)) {
        return prev.filter(name => name !== professorName);
      } else {
        return [...prev, professorName];
      }
    });
  };

  return (
    <div className="w-full text-primary p-4">
      <div className="flex flex-col mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">GPA Breakdown by Professor</h2>
          <div className="flex items-center text-sm bg-background px-3 py-1 rounded-lg">
            <span className='mr-1'>GPA:</span>
            <span className='text-white bg-[#632230] px-2 mr-1'>1.0</span>
            <span className='bg-[#ddaa33] px-2 text-black'>4.0</span>
          </div>
        </div>
      </div>

      {/* Comparison chart for selected professors */}
      <ProfessorComparisonChart
        gpaData={gpaData}
        selectedProfessors={localSelectedInstructors}
      />

      <SearchBar
        placeholder="Filter instructors..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="mb-6"
      />

      <GpaTable
        gpaData={gpaData}
        semesters={semesters}
        selectedInstructors={localSelectedInstructors}
        searchQuery={searchQuery}
        onSelectProfessor={handleProfessorSelection}
      />
    </div>
  );
};

export default GpaModal;

// For backward compatibility - import from detail directory
export { default as ScheduleGpaModal } from '@/components/schedule/ScheduleGpaModal';