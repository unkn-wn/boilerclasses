// Table component that displays GPA data for all professors across semesters
import React, { memo, useMemo, useState } from 'react';
import { getColor, calculateInstructorGradeDistribution } from '@/lib/gpaUtils';
import GradeDistributionBar from '@/components/GradeDistributionBar';
import { useDetailContext } from './context/DetailContext';
import { extractAllSemesters } from '@/lib/utils';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

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
      className="py-2 px-2 text-center cursor-pointer hover:bg-background-secondary transition-colors"
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
  // Get data directly from context instead of props
  const {
    courseData,
    selectedInstructors,
    refreshGraph,
    defaultGPA
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

      // Calculate average GPA
      let avgGPA = 0;
      let semesterCount = 0;

      for (const sem in profGpaData) {
        if (profGpaData[sem][13] > 0) {
          avgGPA += profGpaData[sem][13];
          semesterCount++;
        }
      }

      const averageGpa = semesterCount > 0 ? avgGPA / semesterCount : null;

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
        backgroundColor: dataset.backgroundColor
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
        comparison = a.name.localeCompare(b.name);
      }
      else if (sort.field === 'gradeA') {
        // Sort by percentage of A grades
        const aGrade = a.gradeDistribution?.A || 0;
        const bGrade = b.gradeDistribution?.A || 0;
        comparison = aGrade - bGrade;
      }

      // Apply sort direction
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sort]);

  // Handle selecting a professor - simplified to always use context
  const handleSelectProfessor = (professorName) => {
    const newSelection = selectedInstructors.includes(professorName)
      ? selectedInstructors.filter(name => name !== professorName)
      : [...selectedInstructors, professorName];

    refreshGraph(newSelection.map(name => ({ value: name, label: name })));
  };

  // Handle sorting when a column header is clicked
  const handleSort = (field) => {
    setSort(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="overflow-x-auto bg-background rounded-lg shadow">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgb(var(--background-tertiary-color))]">
            <SortHeader
              label="Instructor"
              field="name"
              currentSort={sort}
              onSort={handleSort}
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
                className={`border-b border-[rgb(var(--background-secondary-color))] hover:bg-background-secondary transition-colors ${isSelected ? 'bg-background-secondary/20' : ''}`}
                onClick={() => handleSelectProfessor(professor.name)}
                style={{ cursor: 'pointer' }}
              >
                {/* Instructor name */}
                <td className="py-2 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-md">{professor.name}</h3>
                      {isSelected && (
                        <span className="bg-background-secondary border border-[rgb(var(--background-tertiary-color))] text-primary text-xs px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Grade Distribution Bar */}
                <td className="py-2 px-2">
                  <div className="w-full">
                    <GradeDistributionBar
                      gradeDistribution={professor.hasGradeData ? professor.gradeDistribution : null}
                      showLabels={false}
                    />
                  </div>
                </td>

                {/* Average GPA */}
                <td className="py-2 px-2 text-center">
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
  );
};

export default React.memo(GpaTable);
