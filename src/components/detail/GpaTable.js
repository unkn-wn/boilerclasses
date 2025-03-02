// Table component that displays GPA data for all professors across semesters
import React, { useState, useCallback, memo } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getColor } from '@/lib/gpaUtils';

// Memoized table cell component to reduce re-renders
const GpaCell = memo(({ gpa, color }) => {
  if (gpa !== null) {
    return (
      <div
        className="w-full p-2 rounded"
        style={{ backgroundColor: color || 'transparent' }}
      >
        <span className="text-xs font-bold text-white">
          {gpa?.toFixed(2) || '-'}
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

GpaCell.displayName = 'GpaCell';

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

const GpaTable = ({ gpaData, semesters, selectedInstructors, searchQuery, onSelectProfessor }) => {

  // Filter professors based on search query - recalculated only when search changes
  const filteredData = React.useMemo(() => {
    return gpaData.filter(professor =>
      professor.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [gpaData, searchQuery]);

  return (
    <div className="overflow-x-auto bg-background rounded-lg shadow">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgb(var(--background-tertiary-color))]">
            <th className="text-left py-3 px-4 font-semibold">Instructor</th>
            <th className="py-2 px-2 text-center border-r border-[rgb(var(--background-tertiary-color))]">
              <div className="text-[11px] text-tertiary font-bold">
                <span>Average</span>
              </div>
            </th>
            {semesters.slice(0, 7).map((semester, i) => (
              <th key={i} className="py-2 px-2 text-center">
                <div className="flex flex-col text-[10px] text-tertiary font-medium">
                  <span>{semester.split(" ")[0]}</span>
                  <span>'{semester.split(" ")[1].substring(2, 4)}</span>
                </div>
              </th>
            ))}
            {semesters.length > 7 && (
              <th className="text-center py-2 px-2">
                <div className="text-[10px] text-tertiary font-medium">More</div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((professor) => {
            const isSelected = selectedInstructors.includes(professor.name);

            return (
              <React.Fragment key={professor.name}>
                <tr
                  className={`border-b border-[rgb(var(--background-secondary-color))] hover:bg-background-secondary transition-colors ${isSelected ? 'bg-background-secondary/20' : ''}`}
                  onClick={() => onSelectProfessor && onSelectProfessor(professor.name)}
                  style={{ cursor: onSelectProfessor ? 'pointer' : 'default' }}
                >
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

                  {/* Average GPA column */}
                  <td className="py-2 px-2 text-center border-r border-[rgb(var(--background-tertiary-color))]">
                    <AverageGpaCell averageGpa={professor.averageGpa} color={getColor(professor.averageGpa)} />
                  </td>

                  {/* Semester GPA columns */}
                  {professor.semesterData.slice(0, 7).map((data, i) => (
                    <td key={i} className="py-2 px-2 text-center">
                      <GpaCell gpa={data.gpa} color={getColor(data.gpa)} />
                    </td>
                  ))}

                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(GpaTable);
