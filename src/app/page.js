'use client' // 


// CourseCatalog.js

import React, { useState } from 'react';

const CourseCatalog = () => {
  // Dummy data array
  const dummyData = [
    { id: 1, title: 'Introduction to Tailwind CSS', instructor: 'John Doe', description: 'Learn the basics of Tailwind CSS and build beautiful user interfaces.' },
    { id: 2, title: 'React Fundamentals', instructor: 'Jane Smith', description: 'Explore the fundamentals of React and build dynamic web applications.' },
    // Add more dummy data as needed
  ];

  // State for search input
  const [searchTerm, setSearchTerm] = useState('');

  // Filter courses based on search term
  const filteredCourses = dummyData.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Course Catalog</h1>

      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search for courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-black w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 transition duration-300"
        />
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map(course => (
          <div key={course.id} className="bg-white p-6 rounded-md shadow-md">
            <h2 className="text-lg font-semibold mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <p className="text-blue-500">Instructor: {course.instructor}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseCatalog;


