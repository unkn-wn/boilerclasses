import React from 'react';

/**
 * A reusable component that displays a grade distribution as a stacked bar chart
 * @param {object} gradeDistribution - Object containing grade percentages {A: 45, B: 30, ...}
 */
const GradeDistributionBar = ({ gradeDistribution }) => {
  if (!gradeDistribution) return null;

  // Define grade colors
  const gradeColors = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    F: 'bg-red-500'
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-xs text-tertiary">
        <span>Grade Distribution</span>
        <span>% of Students</span>
      </div>

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

      {/* Legend */}
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
