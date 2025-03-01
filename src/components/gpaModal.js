// GPA Modal component for all GPA data for each professor and each semester

import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import GpaTable from '@/components/detail/GpaTable';
import { useDetailContext } from '@/components/detail/context/DetailContext';
import { getColor } from '@/lib/gpaUtils';
import { extractAllSemesters } from '@/lib/utils';

const GpaModal = () => {
  const {
    courseData, // Use courseData from context instead of course prop
    selectedInstructors,
    defaultGPA,
    refreshGraph
  } = useDetailContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedInstructors, setLocalSelectedInstructors] = useState(selectedInstructors);
  const [professorData, setProfessorData] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Process the data once on mount from the context
  useEffect(() => {
    if (!courseData || !courseData.gpa || !defaultGPA.datasets) return;

    // Extract professor data with their colors from defaultGPA
    const processedData = defaultGPA.datasets?.map(dataset => {
      // Get GPA data per semester for this professor
      const profGpaData = courseData.gpa[dataset.label] || {};

      // Get all semesters this professor has taught
      const profSemesters = Object.keys(profGpaData);

      // Calculate average GPA
      let totalGpa = 0;
      let semesterCount = 0;
      const gpas = [];

      profSemesters.forEach(semester => {
        if (profGpaData[semester] && profGpaData[semester][13] > 0) {
          totalGpa += profGpaData[semester][13];
          semesterCount++;
          gpas.push({
            term: semester,
            value: profGpaData[semester][13]
          });
        }
      });

      const averageGpa = semesterCount > 0 ? totalGpa / semesterCount : null;

      // Create semester data array (to be used by the table)
      const allSemesters = extractAllSemesters(courseData.gpa);
      const semesterData = allSemesters.map(sem => {
        if (profGpaData[sem]) {
          const gpa = profGpaData[sem][13];
          return {
            gpa,
            color: getColor(gpa) // Use getColor instead of backgroundColor
          };
        }
        return { gpa: null, color: null };
      });

      return {
        name: dataset.label,
        averageGpa,
        semesterData,
        gpas,
        backgroundColor: dataset.backgroundColor
      };
    }) || [];

    setProfessorData(processedData);
    setSemesters(extractAllSemesters(courseData.gpa));
  }, [courseData, defaultGPA]);


  // Update local selection when context changes
  useEffect(() => {
    setLocalSelectedInstructors(selectedInstructors);
  }, [selectedInstructors]);

  // Handle selecting/deselecting professors - update both local and context state
  const handleProfessorSelection = (professorName) => {
    setLocalSelectedInstructors(prev => {
      const newSelection = prev.includes(professorName)
        ? prev.filter(name => name !== professorName)
        : [...prev, professorName];

      // Update the context state to keep everything in sync
      refreshGraph(newSelection.map(name => ({ value: name, label: name })));

      return newSelection;
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

      <SearchBar
        placeholder="Filter instructors..."
        value={searchQuery}
        onChange={setSearchQuery}
        className="mb-6"
      />

      <GpaTable
        gpaData={professorData}
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