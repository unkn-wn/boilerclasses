import React from "react"
import { Chivo, Inter } from 'next/font/google'

const chivo = Chivo({ subsets: ['latin'], display: 'swap', variable: "--chivo" });
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: "--inter" });

const desc = "BoilerClasses (Boiler Classes) - Purdue's course catalog with over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more.";
const title="BoilerClasses - Purdue Course Catalog";

export const metadata = {
  icons: { icon: "/icon-color.png" }
};

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${chivo.variable}`} >
      <head>
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={desc} />
        <meta name="keywords" content="Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers" />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <meta property="og:url" content="https://boilerclasses.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BoilerClasses - Purdue Course Catalog" />
        <meta property="og:description" content="BoilerClasses (Boiler Classes) is a Purdue course catalog containing 8000+ Purdue courses and courses. Find geneds, grades, prerequisites, and more." />
        <meta property="og:image" content="https://opengraph.b-cdn.net/production/documents/a3f504c0-3442-4320-8fc3-f850a5bd1582.png?token=oOcg3vK9F6YcqVmHSegc9vJczzLuo4Oq-yrDM01kKtQ&height=776&width=1200&expires=33246633286" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="boilerclasses.com" />
        <meta property="twitter:url" content="https://boilerclasses.com/" />
        <meta name="twitter:title" content="BoilerClasses - Purdue Course Catalog" />
        <meta name="twitter:description" content="BoilerClasses (Boiler Classes) is a Purdue course catalog containing 8000+ Purdue courses and courses. Find geneds, grades, prerequisites, and more." />
        <meta name="twitter:image" content="https://opengraph.b-cdn.net/production/documents/a3f504c0-3442-4320-8fc3-f850a5bd1582.png?token=oOcg3vK9F6YcqVmHSegc9vJczzLuo4Oq-yrDM01kKtQ&height=776&width=1200&expires=33246633286" />

        <link rel="canonical" href="https://boilerclasses.com/" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}