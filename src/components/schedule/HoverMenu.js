import React, { useState } from 'react';


/*
* Component used for:
* Export as ICS/ PDF
*/
const HoverMenu = ({ children, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="inline-block">
        {children}
      </div>

      {/* Invisible bridge to maintain hover */}
      <div className="absolute h-1 w-full left-0 bottom-0 translate-y-full" />

      <div
        className={`
          absolute left-0 top-full w-48 rounded-md bg-background-secondary border border-zinc-700 shadow-lg z-50
          transition-all duration-200 ease-in-out origin-top-left mt-1
          ${isOpen ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0 pointer-events-none'}
        `}
      >
        <div className="py-1">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              className="flex w-full items-center px-4 py-2 text-sm text-secondary hover:bg-background-tertiary transition-colors duration-150"
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HoverMenu;