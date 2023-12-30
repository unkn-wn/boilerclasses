import '@/styles/globals.css'

import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { CacheProvider } from '@chakra-ui/next-js';
import {  MultiSelectTheme } from 'chakra-multiselect'
import { Analytics } from '@vercel/analytics/react';
import Head from "next/head";

const theme = extendTheme({
  components: {
    MultiSelect: MultiSelectTheme
  }
})

export default function App({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Analytics />
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
      </Head>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}
