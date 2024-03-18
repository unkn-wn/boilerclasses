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
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-48L6TGYD2L`}
        />
        <Script
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
