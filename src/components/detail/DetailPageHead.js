// Component handling metadata, SEO, and Open Graph data for course detail pages
import React from 'react';
import Head from 'next/head';
import { stripCourseCode } from '@/pages/detail/[id]';
import { useDetailContext } from '@/context/DetailContext';

const DetailPageHead = ({ courseData }) => {
  const { sem } = useDetailContext();

  return (
    <Head>
      <title>{`${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}: ${courseData.title} | BoilerClasses`}</title>
      <meta name="title" content={`${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}: ${courseData.title} | BoilerClasses`} />
      <meta name="description" content={`Course ${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)} Purdue: ${courseData.description}`} />
      <meta name="keywords" content={`Purdue, Course, ${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}, ${courseData.subjectCode} ${courseData.courseCode}, ${courseData.title}, ${courseData.description.split(' ')}`} />
      <meta name='og:locality' content='West Lafayette' />
      <meta name='og:region' content='IN' />
      <meta name='og:postal-code' content='47906' />
      <meta name='og:postal-code' content='47907' />

      <meta property="og:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
      <meta property="og:type" content="website" />
      <meta name="og:title" content={`${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}: ${courseData.title} | BoilerClasses`} />
      <meta name="og:description" content={`${courseData.description}`} />
      <meta property="og:image" content={
        "https://boilerclasses.com/api/og?" +
        'sub=' + encodeURIComponent(courseData.subjectCode) +
        '&course=' + encodeURIComponent(stripCourseCode(courseData.courseCode)) +
        '&title=' + encodeURIComponent(courseData.title) +
        '&credits=' + encodeURIComponent(courseData.credits[1]) +
        '&prof=' + encodeURIComponent(courseData.instructor[sem][0]) +
        '&sem=' + encodeURIComponent(sem)
      } />

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="boilerclasses.com" />
      <meta property="twitter:url" content={`https://boilerclasses.com/detail/${courseData.detailId}`} />
      <meta name="twitter:title" content={`${courseData.subjectCode} ${stripCourseCode(courseData.courseCode)}: ${courseData.title} | BoilerClasses`} />
      <meta name="twitter:description" content={`${courseData.description}`} />
      <meta property="twitter:image" content={
        "https://boilerclasses.com/api/og?" +
        'sub=' + encodeURIComponent(courseData.subjectCode) +
        '&course=' + encodeURIComponent(stripCourseCode(courseData.courseCode)) +
        '&title=' + encodeURIComponent(courseData.title) +
        '&credits=' + encodeURIComponent(courseData.credits[1]) +
        '&prof=' + encodeURIComponent(courseData.instructor[sem][0]) +
        '&sem=' + encodeURIComponent(sem)
      } />

      <link rel="canonical" href={`https://boilerclasses.com/detail/${courseData.detailId}`} />
    </Head>
  );
};

export default DetailPageHead;
