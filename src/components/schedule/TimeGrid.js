
import React from 'react';
import { TIMES, DAYS } from './utils/constants';

const TimeGrid = ({ children }) => {
  return (
    <div className="pl-16 relative flex flex-row overflow-auto h-full">
      {DAYS.map((day, dayIndex) => (
        <div key={day} className="flex-1 relative">
          {/* Time Grid Lines */}
          {TIMES.map((time, timeIndex) => (
            <div
              key={`${day}-${time}`}
              className="h-8 border-b border-zinc-600"
            >
              {dayIndex === 0 && (
                <div className="absolute -left-16 w-16 text-right pr-2 -translate-y-4 text-tertiary">
                  {time}
                </div>
              )}
            </div>
          ))}
          {children?.(day, dayIndex)}
        </div>
      ))}
    </div>
  );
};

export default TimeGrid;