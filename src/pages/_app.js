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
      </Head>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}
