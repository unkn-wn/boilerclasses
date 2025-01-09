import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  // set initial theme right away
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  const storedTheme = localStorage.getItem('theme')
                  if (storedTheme) {
                    return storedTheme
                  }
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark'
                }

                document.documentElement.classList.add(getInitialTheme());
              })()
            `,
          }}
        />
      </Head>
      <body className='bg-zinc-100 dark:bg-neutral-950'>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
