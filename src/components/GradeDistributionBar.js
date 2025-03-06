import React from 'react';

/**
 * A reusable component that displays a grade distribution as a stacked bar chart
 * @param {object} gradeDistribution - Object containing grade percentages {A: 45, B: 30, ...}
 * @param {boolean} showLabels - Whether to show the header labels
 */
const GradeDistributionBar = ({ gradeDistribution, showLabels = true }) => {
  // Define grade colors aligned with getColor colorstops
  const gradeColors = {
    A: 'bg-green-500', // Green from 4.0 GPA
    B: 'bg-yellow-500', // Yellow from 3.25 GPA
    C: 'bg-red-600', // Red from 2.25 GPA
    D: 'bg-red-800', // Darker red - blend toward 1.0 GPA color
    F: 'bg-red-950'  // Darkest red from 1.0 GPA
  };

  // If we don't have distribution data, show the empty state
  if (!gradeDistribution) {
    return (
      <div className="w-full flex flex-col">
        {showLabels && (
          <div className="flex justify-between mb-1 text-xs text-tertiary">
            <span>Grade Distribution</span>
          </div>
        )}
        <div className="w-full h-6 bg-background-secondary rounded-md flex items-center justify-center">
          <span className="text-[11px] text-tertiary font-medium">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Only show these labels if showLabels is true */}
      {showLabels && (
        <div className="flex justify-between mb-1 text-xs text-tertiary">
          <span>Grade Distribution</span>
          <span>% of Students</span>
        </div>
      )}

      {/* Stacked bar chart */}
      <div className="flex w-full h-6 rounded-md overflow-hidden bg-background-secondary/30">
        {Object.entries(gradeDistribution).map(([grade, percentage]) => (
          percentage > 0 && (
            <div
              key={grade}
              className={`h-full ${gradeColors[grade]} flex items-center justify-center text-[10px] text-white font-bold`}
              style={{ width: `${percentage}%` }}
            >
              {percentage >= 8 ? grade : ''}
            </div>
          )
        ))}
      </div>

      {/* Legend - keep this regardless of showLabels */}
      <div className="flex justify-between mt-1 text-[10px] text-tertiary">
        {Object.entries(gradeDistribution).map(([grade, percentage]) => (
          <div key={grade} className="flex items-center">
            <div className={`w-2 h-2 ${gradeColors[grade]} mr-1 rounded-sm`}></div>
            <span>{grade}: {percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeDistributionBar;
