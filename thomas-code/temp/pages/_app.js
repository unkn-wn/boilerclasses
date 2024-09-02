import '@/styles/globals.css'

import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { CacheProvider } from '@chakra-ui/next-js';
import { MultiSelectTheme } from 'chakra-multiselect'
import Head from "next/head";
import Script from 'next/script';

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
      </Head>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}
