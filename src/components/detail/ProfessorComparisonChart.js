import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useDetailContext } from '@/components/detail/context/DetailContext';

const ProfessorComparisonChart = () => {
  // Get all needed data from context
  const { courseData, selectedInstructors, defaultGPA } = useDetailContext();

  // State for processed professor data
  const [professorData, setProfessorData] = useState([]);
  // State for professor colors retrieved from context
  const [professorColors, setProfessorColors] = useState({});
  // Toggle individual average lines
  const [showIndividualAvgs, setShowIndividualAvgs] = useState(true);

  // Process the data from context
  useEffect(() => {
    if (!courseData?.gpa || !defaultGPA?.datasets) return;

    // Extract professor data with their colors from defaultGPA
    const processedData = defaultGPA.datasets?.map(dataset => {
      // Get GPA data per semester for this professor
      const profGpaData = courseData.gpa[dataset.label] || {};

      // Get all semesters this professor has taught
      const profSemesters = Object.keys(profGpaData);

      // Calculate average GPA
      let totalGpa = 0;
      let semesterCount = 0;
      const gpas = [];

      profSemesters.forEach(semester => {
        if (profGpaData[semester] && profGpaData[semester][13] > 0) {
          totalGpa += profGpaData[semester][13];
          semesterCount++;
          gpas.push({
            term: semester,
            value: profGpaData[semester][13]
          });
        }
      });

      const averageGpa = semesterCount > 0 ? totalGpa / semesterCount : null;

      return {
        name: dataset.label,
        averageGpa,
        gpas,
        backgroundColor: dataset.backgroundColor
      };
    }) || [];

    setProfessorData(processedData);
  }, [courseData, defaultGPA]);

  // Extract colors from defaultGPA and map them to professors
  useEffect(() => {
    if (!professorData || professorData.length === 0 || !defaultGPA?.datasets) return;

    const colorMap = {};

    // Find matching colors from the context's defaultGPA datasets
    selectedInstructors.forEach((profName) => {
      // Find the professor in the context data
      const contextProf = defaultGPA.datasets.find(dataset => dataset.label === profName);
      if (contextProf) {
        colorMap[profName] = contextProf.backgroundColor;
      }

      // If not found in context, look in local professorData
      if (!colorMap[profName]) {
        const profData = professorData.find(prof => prof.name === profName);
        if (profData && profData.backgroundColor) {
          colorMap[profName] = profData.backgroundColor;
        }
      }
    });

    setProfessorColors(colorMap);
  }, [professorData, selectedInstructors, defaultGPA]);

  // Get data only for selected professors
  const selectedProfessorData = useMemo(() => {
    return professorData.filter(prof => selectedInstructors.includes(prof.name));
  }, [professorData, selectedInstructors]);

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

  // Calculate domain for Y axis to ensure all reference lines are visible
  // IMPORTANT: Always calculate this, regardless of whether we'll use it or not
  const yDomain = useMemo(() => {
    let minY = 2.0; // Default minimum
    let maxY = 4.0; // Default maximum

    // Check if we need to adjust min/max for averages
    if (selectedProfessorData.length > 0) {
      selectedProfessorData.forEach(prof => {
        if (prof.averageGpa !== null) {
          minY = Math.min(minY, Math.floor(prof.averageGpa * 10) / 10);
          maxY = Math.max(maxY, Math.ceil(prof.averageGpa * 10) / 10);
        }
      });

      // Add padding
      minY = Math.max(1.5, minY - 0.1);
      maxY = Math.min(4.0, maxY + 0.1);
    }

    return [minY, maxY];
  }, [selectedProfessorData]);

  // Check if we have professors to display AFTER calculating all hooks
  // This ensures hooks are always called in the same order
  if (selectedProfessorData.length === 0) {
    return (
      <div className="bg-background p-6 rounded-lg shadow text-center">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">GPA Trends</h3>
        </div>
        <p className="text-tertiary font-bold">No instructors selected</p>
        <p className="text-xs text-tertiary">Select instructors to compare their GPAs.</p>
      </div>
    );
  }

  // Now render the chart since we know we have data
  return (
    <div className="bg-background p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">GPA Trends</h3>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show-averages"
            checked={showIndividualAvgs}
            onChange={() => setShowIndividualAvgs(!showIndividualAvgs)}
            className="mr-1"
          />
          <label htmlFor="show-averages" className="text-sm text-tertiary cursor-pointer">
            Show averages
          </label>
        </div>
        <div className="text-sm text-tertiary">
          {selectedProfessorData.length} instructor{selectedProfessorData.length !== 1 ? 's' : ''} selected
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
              domain={yDomain}
              tick={{ fill: 'rgb(var(--text-tertiary-color))', fontSize: 11 }}
              tickCount={5}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgb(var(--background-color))', borderColor: 'rgba(var(--text-tertiary-color), 0.2)' }}
              labelStyle={{ color: 'rgb(var(--text-primary-color))' }}
              formatter={(value, name) => [value?.toFixed(2) || '-', name]}
            />
            <Legend
              formatter={(value) => {
                const prof = selectedProfessorData.find(p => p.name === value);
                if (!prof) return value;

                const color = professorColors[value] || prof.backgroundColor;
                return (
                  <span style={{ color: 'rgb(var(--text-primary-color))' }}>
                    {value}
                    {prof.averageGpa && (
                      <span style={{ color }} className="ml-1">
                        (Avg: {prof.averageGpa.toFixed(2)})
                      </span>
                    )}
                  </span>
                );
              }}
            />

            {/* Add individual average reference lines - no labels */}
            {showIndividualAvgs && selectedProfessorData.map((prof) => {
              if (!prof.averageGpa) return null;
              const color = professorColors[prof.name] || prof.backgroundColor;
              return (
                <ReferenceLine
                  key={`avg-${prof.name}`}
                  y={prof.averageGpa}
                  stroke={color}
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                  ifOverflow="extendDomain"
                />
              );
            })}

            {/* Data lines */}
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
        <div>Total GPA avgerages are shown in the legend.</div>
        <div>Higher values indicate higher average GPAs.</div>
      </div>
    </div>
  );
};

export default React.memo(ProfessorComparisonChart);
