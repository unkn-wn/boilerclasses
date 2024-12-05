import React, { useState, useEffect, useRef } from 'react';

import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

const CourseSearch = ({ courses, onSelect, searchTerm, updateFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Reset selected index when courses change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [courses]);

  // Close dropdown when clicking outside
  useEffect(() => {
    updateFilter('semesters', []);

    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        inputRef.current !== event.target
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen && courses.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < Math.min(courses.length - 1, 9) ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (courses.length > 0) {
          // If nothing is selected, choose the first result
          if (selectedIndex === -1) {
            handleSelect(courses[0]);
          } else {
            handleSelect(courses[selectedIndex]);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        return;
    }
  };

  const handleSelect = (course) => {
    if (!course) return;
    onSelect(course);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    updateFilter('searchTerm', e.target.value);
    setIsOpen(true);
  };

  const shouldShowDropdown = isOpen && (searchTerm ?? '').trim().length > 0;

  // sort courses to show current sem courses first
  const sortedCourses = [...courses].sort((a, b) => {
    const aOffered = a.value.terms.includes(CURRENT_SEMESTER);
    const bOffered = b.value.terms.includes(CURRENT_SEMESTER);

    if (aOffered && !bOffered) return -1;
    if (!bOffered && aOffered) return 1;

    // If both are offered or both are not offered, sort by subject and course code
    return `${a.value.subjectCode}${a.value.courseCode}`.localeCompare(
      `${b.value.subjectCode}${b.value.courseCode}`
    );
  });

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          autoComplete="off"
          id="search"
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="text-white text-xl bg-neutral-950 w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
          placeholder="Search for courses..."
        />
      </div>

      {shouldShowDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-neutral-900 rounded-lg shadow-lg border border-neutral-800 max-h-96 overflow-y-auto">
          {sortedCourses.length > 0 ? (
            sortedCourses.slice(0, 10).map((course, index) => (
              <div
                key={course.id}
                onClick={() => handleSelect(course)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex flex-row justify-between px-4 py-2 cursor-pointer ${selectedIndex === index
                  ? 'bg-neutral-800 text-white'
                  : 'text-white hover:bg-neutral-800'
                  }`}
              >
                <div>
                  <div className="font-medium flex items-center justify-between">
                    <span>{course.value.subjectCode} {course.value.courseCode}</span>

                  </div>
                  <div className="text-sm text-neutral-400 truncate">
                    {course.value.title}
                  </div>
                </div>
                {!course.value.terms.includes(CURRENT_SEMESTER) && (
                  <span className="text-xs px-2 py-1 rounded h-fit self-center bg-orange-500/50 text-orange-100/50">
                    Not Offered in {CURRENT_SEMESTER}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-neutral-400">
              No courses found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseSearch;