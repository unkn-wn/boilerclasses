import '@/styles/globals.css'

import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { CacheProvider } from '@chakra-ui/next-js';
import { MultiSelectTheme } from 'chakra-multiselect'
import Head from "next/head";

const theme = extendTheme({
  components: {
    MultiSelect: MultiSelectTheme
  }
})

export default function App({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Head>
        <title>BoilerClasses</title>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-48L6TGYD2L`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-48L6TGYD2L', {
              page_path: window.location.pathname,
            });`
          }}
        />
        <meta name="description" content="A more user-friendly course catalog for Purdue students with blazing-fast search. From 8000+ classes offered, find more engaging geneds, discover classes more aligned with your interests, and delve into specialized offerings. The all-in-one access provides related links for each course, including RateMyProfessor reviews, in one centralized platform." />
        <meta name="keywords" content="Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler, Classes, BoilerCourses" />
      </Head>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}
