import React, { memo, useMemo, useState } from 'react';
import { getColor, calculateInstructorGradeDistribution } from '@/lib/gpaUtils';
import GradeDistributionBar from '@/components/GradeDistributionBar';
import { useDetailContext } from './context/DetailContext';
import { extractAllSemesters } from '@/lib/utils';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { CURRENT_SEMESTER } from '@/hooks/useSearchFilters';

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

const GpaTable = ({ searchQuery = '' }) => {
  // Get data directly from context including the highlight function
  const {
    courseData,
    selectedInstructors,
    refreshGraph,
    defaultGPA,
    highlightOverviewTab // Get the highlight function from context
  } = useDetailContext();

  // Add sorting state
  const [sort, setSort] = useState({ field: 'averageGpa', direction: 'desc' });

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

      return {
        name: dataset.label,
        averageGpa,
        gradeDistribution,
        hasGradeData,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor,
        sectionsCount,
        isCurrentSemester
      };
    });
  }, [courseData, defaultGPA]);

  // Get all available semesters
  const semesters = useMemo(() =>
    extractAllSemesters(courseData?.gpa || {}),
    [courseData]
  );

  // Filter professors based on search query
  const filteredData = useMemo(() => {
    return professorData.filter(professor =>
      professor.name.toLowerCase().includes((searchQuery || '').toLowerCase())
    );
  }, [professorData, searchQuery]);

  // Sort the filtered data based on current sort settings
  const sortedData = useMemo(() => {
    if (!filteredData.length) return [];

    return [...filteredData].sort((a, b) => {
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
      else if (sort.field === 'sectionsCount') {
        comparison = a.sectionsCount - b.sectionsCount;
      }

      // Apply sort direction
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sort]);

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

  // Mobile sort options menu
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
          <option value="sectionsCount-desc">Sections (Most-Least)</option>
          <option value="sectionsCount-asc">Sections (Least-Most)</option>
          <option value="gradeA-desc">Grade A% (High-Low)</option>
          <option value="gradeA-asc">Grade A% (Low-High)</option>
        </select>
      </div>
    </div>
  );

  return (
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
                label="Sections"
                field="sectionsCount"
                currentSort={sort}
                onSort={handleSort}
                width="5%"
              />
              <SortHeader
                label="Grade Distribution"
                field="gradeA"
                currentSort={sort}
                onSort={handleSort}
                width="55%"
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
            {sortedData.map((professor) => {
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
                      <div className="flex items-center gap-2 mb-1 lg:mb-0">
                        <h3 className="font-semibold text-md">{professor.name}</h3>
                        {isSelected && (
                          <span className="bg-background-secondary border border-[rgb(var(--background-tertiary-color))] text-primary text-xs px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>

                      {/* Mobile/tablet stats row */}
                      <div className="flex items-center justify-between w-full lg:hidden">
                        {/* Sections count */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-tertiary">Sections:</span>
                          <span className="text-xs bg-background-secondary px-2 py-1 rounded-md font-medium">
                            {professor.sectionsCount}
                          </span>
                        </div>

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

                  {/* Sections Count - desktop only */}
                  <td className="py-2 px-2 text-center hidden lg:table-cell">
                    <div className="flex justify-center">
                      <span className="text-xs text-tertiary bg-background-secondary px-2 py-1 rounded-md font-medium">
                        {professor.sectionsCount}
                      </span>
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
  );
};

export default React.memo(GpaTable);
