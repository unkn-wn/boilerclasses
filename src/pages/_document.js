import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head> 
        <title>
          BoilerClasses
        </title>
      </Head>
      <body  className='bg-black'>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
