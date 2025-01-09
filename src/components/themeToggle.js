import React, { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme === 'dark';
      }
      // dark theme by default
      return true;
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // handle system theme changes if no localstorage preference
    const handleSystemThemeChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    const themeChangeEvent = new CustomEvent('themeChange', {
      detail: { theme: isDarkMode ? 'dark' : 'light' }
    });
    window.dispatchEvent(themeChangeEvent);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [isDarkMode]);

  // toggle theme and update localstorage
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
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
        <SunIcon fontSize={[18, 24]} color={`rgb(var(--text-color))`} /> :
        <MoonIcon fontSize={[18, 24]} color={`rgb(var(--text-color))`} />
      }
    </button>
  );
};

export default ThemeToggle;