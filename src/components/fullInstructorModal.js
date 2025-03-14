import React, { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { getColor } from '@/lib/gpaUtils';
import { useDetailContext } from '@/components/detail/context/DetailContext';

const FullInstructorModal = () => {
  const { courseData } = useDetailContext();

  const [gpa, setGpa] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!courseData) return;

    const consolidatedData = {};

    for (const semester in courseData.instructor) {
      consolidatedData[semester] = {};
      for (const instructor of courseData.instructor[semester]) {
        let gpa = "-";
        let color = getColor(0);
        if (courseData.gpa[instructor] && courseData.gpa[instructor][semester]) {
          gpa = courseData.gpa[instructor][semester][13] || "No GPA";
          color = getColor(courseData.gpa[instructor][semester][13] || 0);
        }
        consolidatedData[semester][instructor] = {
          gpa: gpa,
          color: color
        };
      }
    }

    const sortedSemesters = Object.keys(consolidatedData).sort((a, b) => {
      const a_split = a.split(" ");
      const b_split = b.split(" ");
      if (a_split[1] !== b_split[1]) {
        return b_split[1] - a_split[1];
      }

      const seasons = ["Spring", "Summer", "Fall"];
      return seasons.indexOf(b_split[0]) - seasons.indexOf(a_split[0]);
    });

    const sortedConsolidatedData = {};
    sortedSemesters.forEach(semester => {
      sortedConsolidatedData[semester] = consolidatedData[semester];
    });

    setGpa(sortedConsolidatedData);
  }, [courseData]);

  return (
    <div className='h-[32rem] overflow-y-auto flex flex-col'>
      <h1 className='text-primary text-2xl font-bold'>All Semesters Breakdown</h1>
      <h3 className='text-primary text-sm'>
        This graphic displays all semesters and professors that have taught this course. Use the search bar below to filter for a specific professor!<br />
        GPA: <span className='text-white bg-[#632230] px-2'>1.0</span> ― <span className='bg-[#ddaa33] px-2 text-black'>4.0</span>
      </h3>
      <SearchBar
        placeholder="Filter instructors..."
        value={searchQuery}
        onChange={setSearchQuery}
      />
      <div className='mt-2'>
        {Object.keys(gpa).map((semester, index) => {
          const filteredInstructors = Object.keys(gpa[semester]).filter(instructor =>
            instructor.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredInstructors.length === 0) return null;

          return (
            <div key={index} className='flex flex-col mt-5'>
              <h2 className='text-primary font-bold text-xl border-b border-yellow-500'>{semester}</h2>
              <div className='flex flex-col justify-stretch'>
                {filteredInstructors.map((instructor, index) => (
                  <div key={index} className='flex flex-row mt-2 items-center justify-between'>
                    <h3 className='text-primary font-semibold text-md mr-2'>{instructor}</h3>
                    <span className='h-0.5 border-b border-dotted flex-grow mx-2' />
                    <div className='relative grid w-20 h-10 text-center' style={{ backgroundColor: `${gpa[semester][instructor].color}` }}>
                      <p className='text-white m-auto font-black z-10'>{gpa[semester][instructor].gpa}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FullInstructorModal;
