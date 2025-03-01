// Component showing detailed GPA data when a professor row is expanded
import React, { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getColor } from '@/lib/gpaUtils';

// Memorize the tooltip component to prevent re-renders
const GpaTooltipContent = memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const gpaValue = payload[0].value;
    return (
      <div className="p-3 rounded-lg bg-background-secondary text-primary">
        <p className="text-sm text-tertiary mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <span className="font-medium">GPA:</span>
          <div
            className="px-3 py-1 rounded min-w-[48px] text-center"
            style={{
              backgroundColor: getColor(gpaValue),
            }}
          >
            <span className="text-white font-bold">
              {gpaValue?.toFixed(2) || '-'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
});

const GpaExpandedView = ({ professor, semesters }) => {
  return (
    <tr className="bg-background-secondary/10">
      <td colSpan={Math.min(semesters.length, 8) + 2} className="py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={professor.gpas}>
                <XAxis
                  dataKey="term"
                  tick={{ fill: 'rgb(var(--text-tertiary-color))', fontSize: 10 }}
                  angle={0}
                  textAnchor="middle"
                  height={40}
                />
                <YAxis
                  domain={[2, 4]}
                  tick={{ fill: 'rgb(var(--text-tertiary-color))', fontSize: 10 }}
                />
                <Tooltip content={<GpaTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls={true}
                  animationDuration={500}
                  name="GPA"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {professor.semesterData.map((data, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <div
                  className="w-full p-2 rounded mb-1"
                  style={{
                    backgroundColor: data.color || getColor(data.gpa),
                  }}
                >
                  <span className="text-sm font-bold text-white">
                    {data.gpa?.toFixed(2) || '-'}
                  </span>
                </div>
                <div className="flex flex-col text-[10px] text-tertiary">
                  <span>{data.shortSemester.split(" ")[0]}</span>
                  <span>{data.shortSemester.split(" ")[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default GpaExpandedView;
