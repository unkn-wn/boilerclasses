// Component handling metadata, SEO, and Open Graph data for course detail pages
import React from 'react';
import Head from 'next/head';
import { useDetailContext } from './context/DetailContext';
import { stripCourseCode } from '@/lib/utils';

const DetailPageHead = () => {
  const { courseData, sem } = useDetailContext();

  // Safety check to make sure courseData is available
  if (!courseData) {
    return null;
  }

  // Format the course code for display
  const formattedCourseCode = stripCourseCode(courseData.courseCode);

  return (
    <Head>
      <title>{`${courseData.subjectCode} ${formattedCourseCode}: ${courseData.title} | BoilerClasses`}</title>
      <meta name="title" content={`${courseData.subjectCode} ${formattedCourseCode}: ${courseData.title} | BoilerClasses`} />
      <meta name="description" content={`Course ${courseData.subjectCode} ${formattedCourseCode} Purdue: ${courseData.description}`} />
      <meta name="keywords" content={`Purdue, Course, ${courseData.subjectCode} ${formattedCourseCode}, ${courseData.subjectCode} ${courseData.courseCode}, ${courseData.title}, ${courseData.description ? courseData.description.split(' ').join(', ') : ''}`} />
      <meta name='og:locality' content='West Lafayette' />
      <meta name='og:region' content='IN' />
      <meta name='og:postal-code' content='47906' />
      <meta name='og:postal-code' content='47907' />

      <meta property="og:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
      <meta property="og:type" content="website" />
      <meta name="og:title" content={`${courseData.subjectCode} ${formattedCourseCode}: ${courseData.title} | BoilerClasses`} />
      <meta name="og:description" content={`${courseData.description || 'No description available'}`} />
      <meta property="og:image" content={
        `https://boilerclasses.com/api/og?` +
        `sub=${encodeURIComponent(courseData.subjectCode)}` +
        `&course=${encodeURIComponent(formattedCourseCode)}` +
        `&title=${encodeURIComponent(courseData.title)}` +
        `&credits=${encodeURIComponent(courseData.credits ? courseData.credits[1] : '')}` +
        `&prof=${encodeURIComponent(courseData.instructor && courseData.instructor[sem] && courseData.instructor[sem][0] ? courseData.instructor[sem][0] : 'TBA')}` +
        `&sem=${encodeURIComponent(sem || '')}`
      } />

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="boilerclasses.com" />
      <meta property="twitter:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
      <meta name="twitter:title" content={`${courseData.subjectCode} ${formattedCourseCode}: ${courseData.title} | BoilerClasses`} />
      <meta name="twitter:description" content={`${courseData.description || 'No description available'}`} />
      <meta property="twitter:image" content={
        `https://boilerclasses.com/api/og?` +
        `sub=${encodeURIComponent(courseData.subjectCode)}` +
        `&course=${encodeURIComponent(formattedCourseCode)}` +
        `&title=${encodeURIComponent(courseData.title)}` +
        `&credits=${encodeURIComponent(courseData.credits ? courseData.credits[1] : '')}` +
        `&prof=${encodeURIComponent(courseData.instructor && courseData.instructor[sem] && courseData.instructor[sem][0] ? courseData.instructor[sem][0] : 'TBA')}` +
        `&sem=${encodeURIComponent(sem || '')}`
      } />

      <link rel="canonical" href={`https://boilerclasses.com/detail/${courseData.detailId}`} />
    </Head>
  );
};

export default DetailPageHead;
