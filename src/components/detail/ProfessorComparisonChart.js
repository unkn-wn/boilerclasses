import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDetailContext } from '@/components/detail/context/DetailContext';
import { getColor } from '@/lib/gpaUtils';

const ProfessorComparisonChart = () => {
  // Get all needed data from context
  const { courseData, selectedInstructors, defaultGPA } = useDetailContext();

  // State for processed professor data
  const [professorData, setProfessorData] = useState([]);
  // State for professor colors retrieved from context
  const [professorColors, setProfessorColors] = useState({});

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

  // No professors selected - show informative message
  if (selectedProfessorData.length === 0) {
    return (
      <div className="bg-background p-6 rounded-lg shadow text-center">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Instructor GPA Comparison</h3>
        </div>
        <p className="text-tertiary mb-2">No instructors selected</p>
        <p className="text-sm text-tertiary">Select instructors from the GPA table to compare their GPAs.</p>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Instructor GPA Comparison</h3>
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
              domain={[2, 4]}
              tick={{ fill: 'rgb(var(--text-tertiary-color))', fontSize: 11 }}
              tickCount={5}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgb(var(--background-color))', borderColor: 'rgba(var(--text-tertiary-color), 0.2)' }}
              labelStyle={{ color: 'rgb(var(--text-primary-color))' }}
              formatter={(value, name) => [value?.toFixed(2) || '-', name]}
            />
            <Legend
              formatter={(value) => <span style={{ color: 'rgb(var(--text-primary-color))' }}>{value}</span>}
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

      <div className="mt-4 pt-3 border-t border-background-secondary/30 text-sm text-tertiary flex justify-end">
        <div>Higher values indicate higher average GPAs.</div>
      </div>
    </div>
  );
};

export default React.memo(ProfessorComparisonChart);
