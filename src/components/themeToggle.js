import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme} 
      className="fixed top-4 right-4 z-50 p-2 rounded-full 
                 bg-gray-200 dark:bg-gray-800 
                 hover:bg-gray-300 dark:hover:bg-gray-700 
                 transition-colors"
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;