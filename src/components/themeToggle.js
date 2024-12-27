import React, { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';


const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const theme = isDarkMode ? 'dark' : 'light';

    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    const themeChangeEvent = new CustomEvent('themeChange', { detail: { theme } });
    window.dispatchEvent(themeChangeEvent);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="fixed top-4 right-4 z-50 
                 p-3 rounded-full 
                 bg-gray-300 dark:bg-gray-700 
                 text-gray-800 dark:text-gray-200
                 shadow-lg hover:shadow-xl
                 border border-gray-400 dark:border-gray-600
                 hover:bg-gray-400 dark:hover:bg-gray-600
                 transition-all duration-300
                 flex items-center justify-center
                 w-12 h-12"
    >
      {isDarkMode ? 
          <SunIcon fontSize={[18, 24]} color={`rgb(var(--text-color))`} />
       : 
          <MoonIcon fontSize={[18, 24]} color={`rgb(var(--text-color))`} />
       }
    </button>
  );
};

export default ThemeToggle;