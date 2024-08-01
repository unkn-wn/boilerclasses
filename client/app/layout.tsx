import React from "react";
import { Chivo, Inter } from 'next/font/google';
import { GoogleTagManager } from '@next/third-parties/google';
import { Metadata } from "next";
import banner from "../public/banner.png";
import "./style.css";

const chivo = Chivo({ subsets: ['latin'], display: 'swap', variable: "--chivo" });
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: "--inter" });

const desc = "BoilerClasses (Boiler Classes) - Purdue's course catalog with over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more.";
const title="BoilerClasses - Purdue Course Catalog";
const url = process.env.NEXT_PUBLIC_ROOT_URL!;
const domain = new URL(url).host;
const gtmId = process.env.NEXT_PUBLIC_GTM_ID!==undefined && process.env.NEXT_PUBLIC_GTM_ID.length>0
  ? process.env.NEXT_PUBLIC_GTM_ID : null;

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title, description: desc,
  icons: { icon: "/icon-color.png" },
  keywords: [ 'Purdue', 'Purdue University', 'Purdue Courses', 'BoilerClasses', 'Boiler Classes',
    'Boiler', 'Classes', 'BoilerCourses', 'Boiler Class', 'Catalog', 'Catalogue',
    'Purdue Course Search', 'Purdue Course Catalog', 'Boilermakers', "Self-service", "Schedule",
    "Semester", "Calendar" ],
  openGraph: {
    url: "/", type: "website",
    title, description: desc,
    images: [banner.src]
  },
  twitter: {
    card: "summary_large_image",
    title, description: desc,
    images: [banner.src]
  }
};

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${chivo.variable} dark font-body bg-neutral-950 text-white`} >
      <head>
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <meta property="twitter:domain" content={domain} />
        <meta property="twitter:url" content={url} />

        <link rel="canonical" href={url} />

        {gtmId!=null && <GoogleTagManager gtmId={gtmId} />}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}