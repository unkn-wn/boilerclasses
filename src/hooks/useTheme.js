import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Initialize state from localStorage, default to dark mode if not set
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme !== null ? (savedTheme === 'true') : true;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => {
      if (typeof window !== 'undefined') {
        const newMode = !prevMode;
        localStorage.setItem('theme', JSON.stringify(newMode));
        return newMode;
      }
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};