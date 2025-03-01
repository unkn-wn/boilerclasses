import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDetailContext } from '@/context/DetailContext';

const ProfessorComparisonChart = ({ gpaData, selectedProfessors }) => {
  // Get context data to ensure color consistency
  const { defaultGPA } = useDetailContext();

  // State for professor colors retrieved from CSS
  const [professorColors, setProfessorColors] = useState({});

  // Extract colors from defaultGPA and map them to professors
  useEffect(() => {
    if (!gpaData || gpaData.length === 0 || !defaultGPA.datasets) return;

    const colorMap = {};

    // Find matching colors from the context's defaultGPA datasets
    selectedProfessors.forEach((profName) => {
      // Find the professor in the context data
      const contextProf = defaultGPA.datasets.find(dataset => dataset.label === profName);
      if (contextProf) {
        colorMap[profName] = contextProf.backgroundColor;
      }

      // If not found in context, look in local gpaData
      if (!colorMap[profName]) {
        const profData = gpaData.find(prof => prof.name === profName);
        if (profData && profData.backgroundColor) {
          colorMap[profName] = profData.backgroundColor;
        }
      }
    });

    setProfessorColors(colorMap);
  }, [gpaData, selectedProfessors, defaultGPA]);

  // Get data only for selected professors
  const selectedProfessorData = useMemo(() => {
    return gpaData.filter(prof => selectedProfessors.includes(prof.name));
  }, [gpaData, selectedProfessors]);

  // Transform data for the chart
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
      // Reversed order: Spring comes before Fall (instead of Fall before Spring)
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
                return `${parts[0]} '${parts[1].substring(2)}`;
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
            {selectedProfessorData.map((prof) => (
              <Line
                key={prof.name}
                type="monotone"
                dataKey={prof.name}
                stroke={professorColors[prof.name] || prof.backgroundColor}
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

export default React.memo(ProfessorComparisonChart);
