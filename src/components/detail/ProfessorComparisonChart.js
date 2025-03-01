import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Fallback colors in case we can't retrieve CSS variables
const FALLBACK_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

const ProfessorComparisonChart = ({ gpaData, selectedProfessors }) => {
  // State for professor colors retrieved from CSS
  const [professorColors, setProfessorColors] = useState({});

  // Function to get a CSS variable by name
  const getCSSVariable = (variable) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  };

  // Extract colors from datasets and map them to professors
  useEffect(() => {
    if (!gpaData || gpaData.length === 0) return;

    const colorMap = {};

    // Find matching datasets for each selected professor
    selectedProfessors.forEach((profName) => {
      // Find the corresponding professor data
      const profData = gpaData.find(prof => prof.name === profName);

      if (profData && profData.backgroundColor) {
        try {
          // Extract the CSS variable from backgroundColor format "rgb(var(--some-var))"
          const cssVarName = profData.backgroundColor.replace('rgb(var(', '').replace('))', '');
          const colorValue = getCSSVariable(cssVarName);

          // Create full RGB color string
          colorMap[profName] = colorValue ? `rgb(${colorValue})` : null;
        } catch (e) {
          console.log(`Error extracting color for ${profName}:`, e);
        }
      }
    });

    // Assign fallback colors to professors without extracted colors
    selectedProfessors.forEach((profName, index) => {
      if (!colorMap[profName]) {
        colorMap[profName] = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
      }
    });

    setProfessorColors(colorMap);
  }, [gpaData, selectedProfessors]);

  // Get data only for selected professors - always run this hook
  const selectedProfessorData = useMemo(() => {
    return gpaData.filter(prof => selectedProfessors.includes(prof.name));
  }, [gpaData, selectedProfessors]);

  // Always run this hook too, regardless of whether we have data
  const chartData = useMemo(() => {
    if (selectedProfessorData.length === 0) return [];

    // Get all unique semesters across selected professors
    const allSemesters = new Set();
    selectedProfessorData.forEach(prof => {
      prof.gpas?.forEach(gpa => {
        if (gpa?.term) allSemesters.add(gpa.term);
      });
    });

    // Sort semesters chronologically
    const sortedSemesters = Array.from(allSemesters).sort((a, b) => {
      const yearA = parseInt(a.split(" ")[1]);
      const yearB = parseInt(b.split(" ")[1]);
      if (yearA !== yearB) return yearA - yearB;

      const termA = a.split(" ")[0];
      const termB = b.split(" ")[0];
      // Spring comes before Summer, Summer before Fall
      const termOrder = { "Spring": 0, "Summer": 1, "Fall": 2 };
      return termOrder[termA] - termOrder[termB];
    });

    // Create data points for each semester
    return sortedSemesters.map(semester => {
      const dataPoint = { semester };

      selectedProfessorData.forEach(prof => {
        const semesterData = prof.gpas?.find(gpa => gpa?.term === semester);
        dataPoint[prof.name] = semesterData ? semesterData.value : null;
      });

      return dataPoint;
    });
  }, [selectedProfessorData]);

  // Listen for theme changes
  useEffect(() => {
    const updateColors = () => {
      // Re-trigger the color extraction on theme change
      setProfessorColors(prevColors => ({ ...prevColors }));
    };

    window.addEventListener('themeChange', updateColors);
    return () => window.removeEventListener('themeChange', updateColors);
  }, []);

  // No professors selected - show informative message
  if (selectedProfessorData.length === 0) {
    return (
      <div className="bg-background p-6 rounded-lg shadow text-center">
        <p className="text-tertiary mb-2">No professors selected</p>
        <p className="text-sm text-tertiary">Click on professors in the table below to compare their GPAs.</p>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Professor GPA Comparison</h3>
        <div className="text-sm text-tertiary">
          {selectedProfessorData.length} professor{selectedProfessorData.length !== 1 ? 's' : ''} selected
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--text-tertiary-color), 0.2)" />
            <XAxis
              dataKey="semester"
              tick={{ fill: 'rgb(var(--text-tertiary-color))', fontSize: 11 }}
              height={40}
              tickFormatter={(value) => {
                if (!value) return '';
                const parts = value.split(" ");
                return `${parts[0].substring(0, 2)} '${parts[1].substring(2)}`;
              }}
            />
            <YAxis
              domain={[2, 4]}
              tick={{ fill: 'rgb(var(--text-tertiary-color))', fontSize: 11 }}
              tickCount={5}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgb(var(--background-color))', borderColor: 'rgba(var(--text-tertiary-color), 0.2)' }}
              labelStyle={{ color: 'rgb(var(--text-primary-color))' }}
              formatter={(value) => [value?.toFixed(2) || '-', '']}
            />
            <Legend
              formatter={(value) => <span style={{color: 'rgb(var(--text-primary-color))'}}>{value}</span>}
            />
            {selectedProfessorData.map((prof, index) => (
              <Line
                key={prof.name}
                type="monotone"
                dataKey={prof.name}
                stroke={professorColors[prof.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }}
                connectNulls
                animationDuration={750}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-background-secondary/30 text-sm text-tertiary flex justify-between">
        <div>Click on professors in the table below to add or remove them from comparison.</div>
        <div>Higher values indicate higher average GPAs.</div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(ProfessorComparisonChart);
