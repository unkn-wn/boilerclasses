import React, { memo, useMemo, useState, useEffect } from 'react';
import { getColor, calculateInstructorGradeDistribution } from '@/lib/gpaUtils';
import GradeDistributionBar from '@/components/GradeDistributionBar';
import { useDetailContext } from './context/DetailContext';
import { useFilterContext } from './context/FilterContext';
import { extractAllSemesters } from '@/lib/utils';
import { FiArrowUp, FiArrowDown, FiChevronDown, FiChevronUp, FiUser, FiCalendar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverArrow, Portal } from '@chakra-ui/react';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

// Sorts "Season Year" strings with most recent first (Fall > Summer > Spring within a year)
const sortSemestersDesc = (semesters) => {
  const seasonOrder = ["Spring", "Summer", "Fall"];
  return [...semesters].sort((a, b) => {
    const [aSeason, aYear] = a.split(" ");
    const [bSeason, bYear] = b.split(" ");
    if (aYear !== bYear) return bYear - aYear;
    return seasonOrder.indexOf(bSeason) - seasonOrder.indexOf(aSeason);
  });
};

// Numeric score for a "Season Year" string - higher means more recent, used for tie-breaking sorts
const getSemesterRecencyScore = (term) => {
  const seasonOrder = { "Spring": 0, "Summer": 1, "Fall": 2 };
  const [season, year] = term.split(" ");
  return parseInt(year, 10) * 10 + (seasonOrder[season] ?? 0);
};

// Same RMP search URL used in the "All Instructors" panel (InstructorItem.js)
const getRmpUrl = (name, curRMP) => {
  if (curRMP && curRMP[name] && curRMP[name].link) {
    return curRMP[name].link;
  }
  const nameParts = name.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  return `https://www.ratemyprofessors.com/search/professors/783?q=${firstName} ${lastName}`;
};

// Popover that lists every [Semester] [Year] a professor taught, shown on hover of the sections count badge
const SectionsPopover = ({ semestersCount, semestersTaught, children }) => {
  if (!semestersCount) return children;

  return (
    <Popover trigger="hover" placement="bottom" isLazy openDelay={150} closeDelay={100}>
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <Portal>
        <PopoverContent
          width="auto"
          minWidth="150px"
          maxWidth="220px"
          bg="rgba(var(--background-secondary-color))"
          borderColor="rgb(var(--background-tertiary-color))"
          onClick={(e) => e.stopPropagation()}
        >
          <PopoverArrow bg="rgba(var(--background-secondary-color))" />
          <PopoverBody className="max-h-48 overflow-y-auto py-2 px-3">
            <div className="text-xs text-tertiary font-semibold mb-1">
              Taught {semestersCount} {semestersCount === 1 ? 'semester' : 'semesters'}
            </div>
            <ul className="space-y-1">
              {sortSemestersDesc(semestersTaught).map(term => (
                <li key={term} className="text-sm text-primary flex items-center gap-1.5">
                  <FiCalendar size={11} className="text-tertiary flex-shrink-0" />
                  {term}
                </li>
              ))}
            </ul>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};

// Memoized average cell with bolder text
const AverageGpaCell = memo(({ averageGpa, color }) => {
  if (averageGpa !== null) {
    return (
      <div
        className="w-full p-2 rounded"
        style={{ backgroundColor: color || 'transparent' }}
      >
        <span className="text-sm font-extrabold text-white">
          {averageGpa?.toFixed(2) || '-'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full p-2 rounded">
      <span className="text-xs text-tertiary">-</span>
    </div>
  );
});

AverageGpaCell.displayName = 'AverageGpaCell';

// Sort header component that shows indicators and handles clicks
const SortHeader = ({ label, field, currentSort, onSort, width = "auto" }) => {
  const isActive = currentSort.field === field;
  const direction = currentSort.direction;

  return (
    <th
      className="py-2 px-2 text-center cursor-pointer hover:bg-background-secondary transition-colors hidden lg:table-cell"
      style={{ width }}
      onClick={() => onSort(field)}
    >
      <div className="text-[11px] text-tertiary font-bold flex items-center justify-center gap-1">
        {label}
        {isActive && (
          <span className="ml-1">
            {direction === 'asc' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
          </span>
        )}
      </div>
    </th>
  );
};

// Show More/Less button component for mobile view
const MobileShowMoreButton = ({
  sortedData,
  visibleData,
  showAll,
  setShowAll,
  initialVisibleCount
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasMoreToShow = sortedData.length > initialVisibleCount;

  // Handle toggling between show all and show less
  const toggleShowAll = () => {
    setIsTransitioning(true);
    setShowAll(prev => !prev);

    // Reset transitioning state after animation completes
    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (!hasMoreToShow) return null;

  return (
    <>
      {/* Show All/Less button - only visible on mobile when there's more data */}
      <div className="md:hidden relative z-10 px-4 pt-4 pb-2">
        <AnimatePresence mode="sync">
          <motion.button
            key={showAll ? "collapse" : "expand"}
            className={`w-full py-2 px-3 text-sm
              transition-all flex items-center justify-center gap-2 rounded-lg
              ${isTransitioning
                ? 'bg-background-tertiary text-white shadow-md'
                : 'bg-background-secondary text-tertiary hover:text-secondary hover:bg-background-tertiary/50'}`}
            onClick={toggleShowAll}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
          >
            {showAll ? (
              <>
                <FiChevronUp className={isTransitioning ? "text-white" : "text-tertiary"} size={16} />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <FiChevronDown className={isTransitioning ? "text-white" : "text-tertiary"} />
                <span>{sortedData.length - initialVisibleCount} more instructor{sortedData.length - initialVisibleCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Show count info on mobile */}
      {sortedData.length > 0 && (
        <div className="md:hidden text-xs text-tertiary text-center">
          Showing {visibleData.length} of {sortedData.length} instructors
        </div>
      )}
    </>
  );
};

const GpaTable = () => {
  // Get filter state from context
  const {
    searchQuery,
    showSelectedOnly,
    showCurrentSemesterOnly,
    selectedOnTop
  } = useFilterContext();

  // Get data directly from context including the highlight function
  const {
    courseData,
    selectedInstructors,
    refreshGraph,
    defaultGPA,
    curRMP,
    highlightOverviewTab // Get the highlight function from context
  } = useDetailContext();

  // Build a map of professor name -> list of "Season Year" terms they taught,
  // sourced from courseData.instructor (term -> [instructor names])
  const instructorSemesters = useMemo(() => {
    const map = {};
    if (!courseData?.instructor) return map;

    Object.entries(courseData.instructor).forEach(([term, instructors]) => {
      (instructors || []).forEach(name => {
        if (!map[name]) map[name] = [];
        if (!map[name].includes(term)) map[name].push(term);
      });
    });

    return map;
  }, [courseData?.instructor]);

  // Add sorting state
  const [sort, setSort] = useState({ field: 'averageGpa', direction: 'desc' });

  // Show all/less toggle for mobile
  const [showAll, setShowAll] = useState(false);

  // Initial count to show before "Show All"
  const INITIAL_VISIBLE_COUNT = 5;

  // Process professor data from context
  const professorData = useMemo(() => {
    if (!courseData?.gpa || !defaultGPA?.datasets) return [];

    // Extract professor data with their colors from defaultGPA
    return defaultGPA.datasets.map(dataset => {
      // Get GPA data per semester for this professor
      const profGpaData = courseData.gpa[dataset.label] || {};

      // Check if professor teaches in current semester
      // We don't do anything with it yet, maybe can add later if needed
      const isCurrentSemester = courseData?.instructor[CURRENT_SEMESTER]?.includes(dataset.label);

      // Calculate average GPA
      let avgGPA = 0;
      let sectionsCount = 0;

      for (const sem in profGpaData) {
        if (profGpaData[sem][13] > 0) {
          avgGPA += profGpaData[sem][13];
          sectionsCount++;
        }
      }

      const averageGpa = sectionsCount > 0 ? avgGPA / sectionsCount : null;

      // Generate grade distribution data using the utility function
      const gradeData = dataset.data;
      const gradeDistribution = calculateInstructorGradeDistribution(gradeData);
      const hasGradeData = gradeDistribution !== null;

      // RMP rating for this professor (0/undefined means no rating found)
      const rawRating = curRMP?.[dataset.label];
      const rating = typeof rawRating === 'number' && rawRating > 0 ? rawRating : null;

      // Every "Season Year" term this professor taught this course
      const semestersTaught = instructorSemesters[dataset.label] || [];

      // Recency score of the most recent semester taught (higher = more recent), used as a sort tie-breaker
      const mostRecentSemesterScore = semestersTaught.length > 0
        ? Math.max(...semestersTaught.map(getSemesterRecencyScore))
        : null;

      // Distinct number of semesters this professor taught the course (displayed count)
      const semestersTaughtCount = semestersTaught.length;

      return {
        name: dataset.label,
        averageGpa,
        gradeDistribution,
        hasGradeData,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor,
        sectionsCount,
        isCurrentSemester,
        rating,
        semestersTaught,
        mostRecentSemesterScore,
        semestersTaughtCount
      };
    });
  }, [courseData, defaultGPA, curRMP, instructorSemesters]);

  // Get all available semesters
  const semesters = useMemo(() =>
    extractAllSemesters(courseData?.gpa || {}),
    [courseData]
  );

  // Filter professors based on search query and filter options
  const filteredData = useMemo(() => {
    let filtered = professorData.filter(professor =>
      professor.name.toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    // Apply the selected-only filter if enabled and we have a list of selected instructors
    if (showSelectedOnly && selectedInstructors && selectedInstructors.length > 0) {
      filtered = filtered.filter(professor =>
        selectedInstructors.includes(professor.name)
      );
    }

    // Apply the current semester filter if enabled
    if (showCurrentSemesterOnly) {
      filtered = filtered.filter(professor => professor.isCurrentSemester);
    }

    return filtered;
  }, [professorData, searchQuery, showSelectedOnly, selectedInstructors, showCurrentSemesterOnly]);

  // Sort the filtered data based on current sort settings
  const sortedData = useMemo(() => {
    if (!filteredData.length) return [];

    const selectedSet = new Set(selectedOnTop ? selectedInstructors : []);

    return [...filteredData].sort((a, b) => {
      if (selectedSet.size > 0) {
        const aSelected = selectedSet.has(a.name);
        const bSelected = selectedSet.has(b.name);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
      }

      // Always sort current semester instructors to the top if that option is selected
      if (sort.field === 'isCurrentSemester') {
        if (a.isCurrentSemester && !b.isCurrentSemester) return -1;
        if (!a.isCurrentSemester && b.isCurrentSemester) return 1;
      }

      let comparison = 0;

      // Handle null values for proper sorting
      if (sort.field === 'averageGpa') {
        // Sort nulls to the bottom regardless of sort direction
        if (a.averageGpa === null && b.averageGpa !== null) return 1;
        if (a.averageGpa !== null && b.averageGpa === null) return -1;
        if (a.averageGpa === null && b.averageGpa === null) return 0;

        comparison = a.averageGpa - b.averageGpa;
      }
      else if (sort.field === 'name') {
        comparison = b.name.localeCompare(a.name);
      }
      else if (sort.field === 'gradeA') {
        // Sort by percentage of A grades
        const aGrade = a.gradeDistribution?.A || 0;
        const bGrade = b.gradeDistribution?.A || 0;
        comparison = aGrade - bGrade;
      }
      else if (sort.field === 'rating') {
        // Sort nulls (no RMP rating found) to the bottom regardless of sort direction
        if (a.rating === null && b.rating !== null) return 1;
        if (a.rating !== null && b.rating === null) return -1;
        if (a.rating === null && b.rating === null) return 0;

        comparison = a.rating - b.rating;

        // Tie-break 1: average GPA (higher first, nulls sort to the bottom)
        if (comparison === 0) {
          if (a.averageGpa === null && b.averageGpa !== null) return 1;
          if (a.averageGpa !== null && b.averageGpa === null) return -1;
          if (a.averageGpa !== null && b.averageGpa !== null) comparison = a.averageGpa - b.averageGpa;
        }

        // Tie-break 2: most recently taught semester (more recent first)
        if (comparison === 0) {
          comparison = (a.mostRecentSemesterScore ?? -1) - (b.mostRecentSemesterScore ?? -1);
        }
      }
      else if (sort.field === 'semestersCount') {
        comparison = a.semestersTaughtCount - b.semestersTaughtCount;

        // Use average GPA as a tiebreaker when section counts are equal
        if (comparison === 0) {
          // Handle null GPA values
          if (a.averageGpa === null && b.averageGpa !== null) return 1;
          if (a.averageGpa !== null && b.averageGpa === null) return -1;
          if (a.averageGpa !== null && b.averageGpa !== null) {
            comparison = a.averageGpa - b.averageGpa;
          }
        }
      }

      // Apply sort direction
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sort, selectedOnTop, selectedInstructors]);

  // Get visible data based on mobile limitations
  const visibleData = useMemo(() => {
    // On desktop, show all data
    // On mobile, limit by showAll state
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return sortedData; // Always show all on desktop
    }

    return showAll ? sortedData : sortedData.slice(0, INITIAL_VISIBLE_COUNT);
  }, [sortedData, showAll]);


  // Handle selecting a professor
  const handleSelectProfessor = (professorName) => {
    const newSelection = selectedInstructors.includes(professorName)
      ? selectedInstructors.filter(name => name !== professorName)
      : [...selectedInstructors, professorName];

    refreshGraph(newSelection.map(name => ({ value: name, label: name })));

    // Trigger the highlight animation for the Overview tab
    highlightOverviewTab();
  };

  // Handle sorting when a column header is clicked
  const handleSort = (field) => {
    setSort(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Mobile sort options menu with enhanced filter indicators
  const SortOptions = () => (
    <div className="lg:hidden bg-background rounded-t-lg p-3 border-b border-[rgb(var(--background-tertiary-color))]">
      <div className="flex items-center justify-between">
        <span className="text-xs text-tertiary">Sort by:</span>
        <select
          className="bg-background-secondary text-xs p-1 rounded"
          value={`${sort.field}-${sort.direction}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split('-');
            setSort({ field, direction });
          }}
        >
          <option value="isCurrentSemester-desc">Current Semester First</option>
          <option value="name-desc">Name (A-Z)</option>
          <option value="name-asc">Name (Z-A)</option>
          <option value="averageGpa-desc">GPA (High-Low)</option>
          <option value="averageGpa-asc">GPA (Low-High)</option>
          <option value="semestersCount-desc">Semesters (Most-Least)</option>
          <option value="semestersCount-asc">Semesters (Least-Most)</option>
          <option value="gradeA-desc">Grade A% (High-Low)</option>
          <option value="gradeA-asc">Grade A% (Low-High)</option>
          <option value="rating-desc">RMP Rating (High-Low)</option>
          <option value="rating-asc">RMP Rating (Low-High)</option>
        </select>
      </div>

      {/* Improved filter indicators for mobile */}
      {(showSelectedOnly || showCurrentSemesterOnly) && (
        <div className="mt-2 flex flex-wrap gap-2 justify-center">
          {showSelectedOnly && (
            <div className="flex items-center gap-1.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 rounded-full text-xs">
              <FiUser size={12} />
              <span>Selected Only</span>
            </div>
          )}
          {showCurrentSemesterOnly && (
            <div className="flex items-center gap-1.5 bg-green-500/15 text-green-600 dark:text-green-400 px-2 rounded-full text-xs">
              <FiCalendar size={12} />
              <span>{CURRENT_SEMESTER}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="bg-background rounded-lg shadow">
        {/* Mobile sort options - now visible on tablets too */}
        <SortOptions />

        {/* Desktop table view */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="lg:table-header-group hidden">
              <tr className="border-b border-[rgb(var(--background-tertiary-color))]">
                <SortHeader
                  label="Instructor"
                  field="name"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Semesters"
                  field="semestersCount"
                  currentSort={sort}
                  onSort={handleSort}
                  width="5%"
                />
                <SortHeader
                  label="Rating"
                  field="rating"
                  currentSort={sort}
                  onSort={handleSort}
                  width="8%"
                />
                <SortHeader
                  label="Grade Distribution"
                  field="gradeA"
                  currentSort={sort}
                  onSort={handleSort}
                  width="47%"
                />
                <SortHeader
                  label="Average"
                  field="averageGpa"
                  currentSort={sort}
                  onSort={handleSort}
                  width="10%"
                />
              </tr>
            </thead>
            <tbody>
              {visibleData.map((professor) => {
                const isSelected = selectedInstructors.includes(professor.name);

                return (
                  <tr
                    key={professor.name}
                    className={`block lg:table-row border-b border-[rgb(var(--background-secondary-color))] hover:bg-background-secondary transition-colors ${isSelected ? 'bg-background-secondary/20' : ''}`}
                    onClick={() => handleSelectProfessor(professor.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Instructor name - always visible */}
                    <td className="py-3 px-3 lg:px-4 block lg:table-cell">
                      <div className="flex flex-wrap items-center justify-between">
                        {/* Name and Selected badge */}
                        <div className="flex w-full items-center gap-2 mb-1 lg:mb-0">
                          <h3 className="flex-1 font-semibold text-md">{professor.name}</h3>
                          {isSelected && (
                            <span className="bg-background-secondary border border-[rgb(var(--background-tertiary-color))] text-primary text-xs px-2 py-0.5 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>

                        {/* Mobile/tablet stats row */}
                        <div className="flex items-center justify-between w-full lg:hidden">
                          {/* Semesters count - hover to see which semesters/years */}
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-tertiary">Semesters:</span>
                            <SectionsPopover
                              semestersCount={professor.semestersTaughtCount}
                              semestersTaught={professor.semestersTaught}
                            >
                              <span className="text-xs bg-background-secondary px-2 py-1 rounded-md font-medium cursor-default hover:bg-background-tertiary/50 transition-colors">
                                {professor.semestersTaughtCount}
                              </span>
                            </SectionsPopover>
                          </div>

                          {/* RMP Rating - tap to open RMP page */}
                          {professor.rating !== null && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <span className="text-xs text-tertiary">Rating:</span>
                              <a
                                href={getRmpUrl(professor.name, curRMP)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-background-secondary px-2 py-1 rounded-md font-medium hover:bg-background-tertiary/50 transition-colors"
                              >
                                {professor.rating.toFixed(1)}
                              </a>
                            </div>
                          )}

                          {/* Average GPA */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-tertiary">GPA:</span>
                            <div className="inline-block">
                              <div
                                className="px-2 py-1 rounded"
                                style={{
                                  backgroundColor: getColor(professor.averageGpa) || 'transparent',
                                  minWidth: '40px',
                                  textAlign: 'center'
                                }}
                              >
                                <span className="text-xs font-bold text-white">
                                  {professor.averageGpa?.toFixed(2) || '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile/tablet grade distribution bar */}
                      <div className="mt-2 lg:hidden">
                        <div className="flex items-center gap-2">
                          <div className="w-full">
                            <GradeDistributionBar
                              gradeDistribution={professor.hasGradeData ? professor.gradeDistribution : null}
                              showLabels={false}
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Semesters Count - desktop only, hover to see which semesters/years were taught */}
                    <td className="py-2 px-2 text-center hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <SectionsPopover
                          semestersCount={professor.semestersTaughtCount}
                          semestersTaught={professor.semestersTaught}
                        >
                          <span className="text-xs text-tertiary bg-background-secondary px-2 py-1 rounded-md font-medium cursor-default hover:bg-background-tertiary/50 transition-colors">
                            {professor.semestersTaughtCount}
                          </span>
                        </SectionsPopover>
                      </div>
                    </td>

                    {/* RMP Rating - desktop only, click to open RMP page */}
                    <td className="py-2 px-2 text-center hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        {professor.rating !== null ? (
                          <a
                            href={getRmpUrl(professor.name, curRMP)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium px-2 py-1 rounded-md bg-background-secondary w-fit hover:bg-background-tertiary/50 transition-colors"
                          >
                            {professor.rating.toFixed(1)}
                          </a>
                        ) : (
                          <span className="text-xs text-tertiary">-</span>
                        )}
                      </div>
                    </td>

                    {/* Grade Distribution Bar - desktop only */}
                    <td className="py-2 px-2 hidden lg:table-cell">
                      <div className="w-full">
                        <GradeDistributionBar
                          gradeDistribution={professor.hasGradeData ? professor.gradeDistribution : null}
                          showLabels={false}
                        />
                      </div>
                    </td>

                    {/* Average GPA - desktop only */}
                    <td className="py-2 px-2 text-center hidden lg:table-cell">
                      <AverageGpaCell
                        averageGpa={professor.averageGpa}
                        color={getColor(professor.averageGpa)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Mobile Show More/Less Component */}
      <MobileShowMoreButton
        sortedData={sortedData}
        visibleData={visibleData}
        showAll={showAll}
        setShowAll={setShowAll}
        initialVisibleCount={INITIAL_VISIBLE_COUNT}
      />
    </>
  );
};

export default React.memo(GpaTable);
