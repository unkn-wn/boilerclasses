// Table component that displays GPA data for all professors across semesters
import React, { memo, useState, useMemo } from 'react';
import { getColor } from '@/lib/gpaUtils';
import GradeDistributionBar from '@/components/GradeDistributionBar';
import { useDetailContext } from './context/DetailContext';
import { extractAllSemesters } from '@/lib/utils';

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

const GpaTable = ({ searchQuery = '', localSelectMode = false }) => {
  // Get data directly from context instead of props
  const {
    courseData,
    selectedInstructors,
    refreshGraph,
    defaultGPA
  } = useDetailContext();

  // Local state for selections when in localSelectMode
  const [localSelectedInstructors, setLocalSelectedInstructors] = useState(selectedInstructors);

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

      // Generate grade distribution data
      const gradeData = dataset.data;

      // Check if there's any meaningful grade data
      const hasGradeData = gradeData && gradeData.some(val => val > 0);

      let gradeDistribution = null;
      if (hasGradeData) {
        const sampleDistribution = {
          'A': Math.round((gradeData[0] + gradeData[1] + gradeData[2]) * 10) || 0,
          'B': Math.round((gradeData[3] + gradeData[4] + gradeData[5]) * 10) || 0,
          'C': Math.round((gradeData[6] + gradeData[7] + gradeData[8]) * 10) || 0,
          'D': Math.round((gradeData[9] + gradeData[10] + gradeData[11]) * 10) || 0,
          'F': Math.round(gradeData[12] * 10) || 0
        };

        // Only normalize if there's actual data
        const total = Object.values(sampleDistribution).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
          gradeDistribution = Object.fromEntries(
            Object.entries(sampleDistribution).map(([grade, value]) =>
              [grade, Math.round((value / total) * 100)]
            )
          );
        }
      }

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

  // Handle selecting a professor
  const handleSelectProfessor = (professorName) => {
    if (localSelectMode) {
      // Update local state when in localSelectMode (for modals)
      setLocalSelectedInstructors(prev => {
        const newSelection = prev.includes(professorName)
          ? prev.filter(name => name !== professorName)
          : [...prev, professorName];

        // Also update the context for visualization
        refreshGraph(newSelection.map(name => ({ value: name, label: name })));

        return newSelection;
      });
    } else {
      // Direct context update (for inline usage)
      const newSelection = selectedInstructors.includes(professorName)
        ? selectedInstructors.filter(name => name !== professorName)
        : [...selectedInstructors, professorName];

      refreshGraph(newSelection.map(name => ({ value: name, label: name })));
    }
  };

  // Get current selection based on mode
  const currentSelection = localSelectMode ? localSelectedInstructors : selectedInstructors;

  return (
    <div className="overflow-x-auto bg-background rounded-lg shadow">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgb(var(--background-tertiary-color))]">
            <th className="text-left py-3 px-4 font-semibold">Instructor</th>
            <th className="py-2 px-2 text-center" style={{ width: "10%" }}>
              <div className="text-[11px] text-tertiary font-bold">Average</div>
            </th>
            <th className="py-2 px-2 text-center" colSpan={2} style={{ width: "55%" }}>
              <div className="text-[11px] text-tertiary font-bold">Grade Distribution</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((professor) => {
            const isSelected = currentSelection.includes(professor.name);

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

                {/* Average GPA */}
                <td className="py-2 px-2 text-center">
                  <AverageGpaCell
                    averageGpa={professor.averageGpa}
                    color={getColor(professor.averageGpa)}
                  />
                </td>

                {/* Grade Distribution Bar - now using the enhanced component */}
                <td className="py-2 px-2" colSpan={2}>
                  <div className="w-full">
                    <GradeDistributionBar
                      gradeDistribution={professor.hasGradeData ? professor.gradeDistribution : null}
                      showLabels={false}
                    />
                  </div>
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
