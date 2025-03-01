// Component that renders a bar chart for displaying grade distribution data
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Graph = ({ data, scheduler = false }) => {
  // Get chart title based on scheduler prop
  const chartTitle = scheduler ? '% Grade Distribution Across All Instructors' : '% Grade Distribution';

  // Transform Chart.js data format to Recharts format
  const transformedData = useMemo(() => {
    if (!data || !data.labels || !data.datasets) return [];

    return data.labels.map((label, index) => {
      const dataPoint = { grade: label };

      data.datasets.forEach(dataset => {
        // Add each instructor's data with their name as the key
        dataPoint[dataset.label] = dataset.data[index];
      });

      return dataPoint;
    });
  }, [data]);

  // Get number of instructors in the dataset
  const instructorCount = data?.datasets?.length || 0;

  // If no data, show empty state
  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div className="h-full w-full bg-background mx-auto p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{chartTitle}</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-tertiary font-bold">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background mx-auto p-4 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{chartTitle}</h3>
        {instructorCount > 0 && (
          <div className="text-sm text-tertiary">
            {instructorCount} instructor{instructorCount !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      <div className="h-full">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={transformedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--text-tertiary-color), 0.2)" />
            <XAxis
              dataKey="grade"
              tick={{ fill: 'rgb(var(--text-tertiary-color))' }}
              height={40}
            />
            <YAxis
              label={{
                value: '% of Students',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'rgb(var(--text-tertiary-color))' }
              }}
              tick={{ fill: 'rgb(var(--text-tertiary-color))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(var(--background-color))',
                borderColor: 'rgba(var(--text-tertiary-color), 0.2)'
              }}
              labelStyle={{ color: 'rgb(var(--text-primary-color))' }}
              formatter={(value, name) => [`${value}%`, name]}
							cursor={{ fill: 'rgba(var(--background-tertiary-color))' }}
            />
            <Legend
              formatter={(value) => <span style={{color: 'rgb(var(--text-primary-color))'}}>{value}</span>}
            />
            {data.datasets.map((dataset) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={dataset.backgroundColor}
                animationDuration={750}
								radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Graph;