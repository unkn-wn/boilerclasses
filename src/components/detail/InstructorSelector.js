// Dropdown component for selecting multiple instructors to view/compare data
import React from 'react';
import Select from 'react-select';
import { instructorStyles } from '@/lib/utils';

const InstructorSelector = ({
  instructors,
  selectedInstructors,
  onChange
}) => {
  return (
    <div className="grow">
      <Select
        isMulti
        options={instructors.map((instructor) => ({ value: instructor, label: instructor }))}
        className="basic-multi-select w-full no-wrap"
        classNamePrefix="select"
        placeholder="Instructor..."
        menuPlacement='bottom'
        value={selectedInstructors.map(instructor => ({ value: instructor, label: instructor }))}
        styles={instructorStyles}
        color="white"
        onChange={onChange}
      />
    </div>
  );
};

export default InstructorSelector;
