import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDetailContext } from './DetailContext';

// Create the context
const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showCurrentSemesterOnly, setShowCurrentSemesterOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get selected instructors from DetailContext
  const { selectedInstructors } = useDetailContext();

  // Count of active filters for badge display
  const activeFiltersCount = [showSelectedOnly, showCurrentSemesterOnly].filter(Boolean).length;

  // Reset selected-only filter if no instructors are selected
  useEffect(() => {
    if (selectedInstructors.length === 0) {
      setShowSelectedOnly(false);
    }
  }, [selectedInstructors]);

  // Clear all filters
  const clearAllFilters = () => {
    setShowSelectedOnly(false);
    setShowCurrentSemesterOnly(false);
  };

  return (
    <FilterContext.Provider value={{
      // Search state
      searchQuery,
      setSearchQuery,

      // Filter states
      showSelectedOnly,
      setShowSelectedOnly,
      showCurrentSemesterOnly,
      setShowCurrentSemesterOnly,

      // Dropdown state
      isFilterOpen,
      setIsFilterOpen,

      // Helpers
      activeFiltersCount,
      clearAllFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

// Custom hook to use the filter context
export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
