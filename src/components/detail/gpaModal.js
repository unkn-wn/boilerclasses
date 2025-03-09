// GPA Modal component for all GPA data for each professor and each semester

import React, { useEffect, useRef } from 'react';
import SearchBar from '@/components/SearchBar';
import GpaTable from '@/components/detail/GpaTable';
import { useDetailContext } from '@/components/detail/context/DetailContext';
import { FilterProvider, useFilterContext } from '@/components/detail/context/FilterContext';
import { FiFilter, FiCheck, FiUser, FiCalendar, FiSliders } from 'react-icons/fi';
import { Switch } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

const GpaModal = () => {
  const { courseData } = useDetailContext();

  if (!courseData || !courseData.gpa) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-tertiary font-medium">No GPA data available for this course</p>
      </div>
    );
  }

  return (
    <FilterProvider>
      <GpaModalContent />
    </FilterProvider>
  );
};

const GpaModalContent = () => {
  const { searchQuery, setSearchQuery } = useFilterContext();

  return (
    <div className="w-full text-primary">
      <div className="flex flex-col mb-4">
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

      {/* Redesigned search and filter area with clear separation */}
      <div className="flex flex-row gap-2 mb-2">
        {/* Search bar - takes most of the space */}
        <div className="flex-1">
          <SearchBar
            placeholder="Search instructors..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full"
          />
        </div>

        {/* Filter button - now clearly separate */}
        <div className="md:w-auto">
          <FilterButton />
        </div>
      </div>

      <GpaTable />
    </div>
  );
};

// Redesigned Filter Button Component
const FilterButton = () => {
  const {
    activeFiltersCount,
    isFilterOpen,
    setIsFilterOpen
  } = useFilterContext();

  // Create a ref for the button to prevent clickOutside from triggering on it
  const buttonRef = useRef(null);

  return (
    <>
      <motion.button
        ref={buttonRef} // Add ref to the button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className={`
        w-auto h-full
        py-2 px-2 lg:px-4
        flex items-center justify-center gap-2
        bg-background hover:bg-background-secondary
        text-primary hover:text-primary
        rounded-md border border-[rgb(var(--background-secondary-color))]
        transition-all
      `}
        aria-label="Filter options"
        data-filter-button="true" // Add a data attribute to identify this button
      >
        <FiSliders className="text-tertiary" />
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-tertiary">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 w-4 text-xs bg-yellow-600 text-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
      </motion.button>
      <FilterDropdown buttonRef={buttonRef} />
    </>
  );
};

// Custom Filter Dropdown Component
const FilterDropdown = ({ buttonRef }) => {
  const {
    activeFiltersCount,
    isFilterOpen,
    setIsFilterOpen,
    showSelectedOnly,
    setShowSelectedOnly,
    showCurrentSemesterOnly,
    setShowCurrentSemesterOnly,
    clearAllFilters
  } = useFilterContext();

  const { selectedInstructors } = useDetailContext();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is on the button or inside it, don't close the dropdown
      if (buttonRef.current && buttonRef.current.contains(event.target)) {
        return;
      }

      // Otherwise, if click is outside the dropdown, close it
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      // Use a small timeout to ensure this runs after the button click event
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen, setIsFilterOpen, buttonRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Custom Dropdown Menu */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 z-50 w-[250px] bg-background border border-[rgb(var(--background-tertiary-color))] rounded-md shadow-lg"
            style={{
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
            }}
          >
            {/* Dropdown Arrow - custom triangle for dropdown */}
            <div className="absolute -top-2 right-3 w-4 h-4 rotate-45 bg-[rgb(var(--background-color))] border-t border-l border-[rgb(var(--background-tertiary-color))]"></div>

            {/* Header */}
            <div className="px-4 pt-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <FiFilter size={10} />
                <span>Filter Options</span>
              </div>
            </div>

            {/* Content */}
            <div className="pb-2 px-4 pt-2">
              <div className="space-y-2">
                {/* Selected Only Option */}
                <div className={`flex items-center px-2 rounded-lg ${showSelectedOnly ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                  <div className="flex items-center flex-1 gap-2">
                    <div className={`p-1 rounded-md ${showSelectedOnly ? 'bg-blue-100 dark:bg-blue-800/20 text-blue-600 dark:text-blue-400' : 'bg-background-secondary text-tertiary'}`}>
                      <FiUser size={16} />
                    </div>
                    <div className="flex-1 text-left">
                      <label className="text-sm font-medium cursor-pointer flex-1">Selected Only</label>
                      {selectedInstructors.length > 0 && (
                        <p className="text-xs text-tertiary -mt-1">
                          {selectedInstructors.length} instructor{selectedInstructors.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    isDisabled={selectedInstructors.length === 0}
                    isChecked={showSelectedOnly}
                    onChange={() => setShowSelectedOnly(!showSelectedOnly)}
                    colorScheme="blue"
                    className="ml-2"
                    size="md"
                  />
                </div>

                {/* Current Semester Option */}
                <div className={`flex items-center px-2 rounded-lg ${showCurrentSemesterOnly ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
                  <div className="flex items-center flex-1 gap-2">
                    <div className={`p-1 rounded-md ${showCurrentSemesterOnly ? 'bg-green-100 dark:bg-green-800/20 text-green-600 dark:text-green-400' : 'bg-background-secondary text-tertiary'}`}>
                      <FiCalendar size={16} />
                    </div>
                    <div className="flex-1 text-left">
                      <label className="text-sm font-medium cursor-pointer flex-1">Current Semester</label>
                      <p className="text-xs text-tertiary -mt-1">
                        {CURRENT_SEMESTER} only
                      </p>
                    </div>
                  </div>
                  <Switch
                    isChecked={showCurrentSemesterOnly}
                    onChange={() => setShowCurrentSemesterOnly(!showCurrentSemesterOnly)}
                    colorScheme="green"
                    className="ml-2"
                    size="md"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <div className="mt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearAllFilters}
                    className="w-full py-2 px-2 bg-background-secondary hover:bg-background-tertiary/60 rounded-md text-tertiary hover:text-secondary transition-all flex items-center justify-center gap-1.5 text-sm font-medium"
                  >
                    <FiCheck size={14} />
                    <span>Clear All Filters</span>
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GpaModal;

// For backward compatibility
export { default as ScheduleGpaModal } from '@/components/schedule/ScheduleGpaModal';