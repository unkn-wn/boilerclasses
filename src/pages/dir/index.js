import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

import Footer from '@/components/footer';

const Directory = () => {
  const router = useRouter();

  const class_codes = ['AAE', 'AAS', 'ABE', 'AD', 'AFT', 'AGEC', 'AGR', 'AGRY', 'AMST', 'ANSC', 'ANTH', 'ARAB', 'ASAM', 'ASEC', 'ASL', 'ASM', 'ASTR', 'AT', 'BAND', 'BCHM', 'BIOL', 'BME', 'BMS', 'BTNY', 'CAND', 'CDIS', 'CE', 'CEM', 'CGT', 'CHE', 'CHM', 'CHNS', 'CLCS', 'CLPH', 'CM', 'CMPL', 'CNIT', 'COM', 'CPB', 'CS', 'CSR', 'DANC', 'EAPS', 'ECE', 'ECET', 'ECON', 'EDCI', 'EDPS', 'EDST', 'EEE', 'ENE', 'ENGL', 'ENGR', 'ENGT', 'ENTM', 'ENTR', 'EPCS', 'FLM', 'FNR', 'FR', 'FS', 'FVS', 'GER', 'GRAD', 'GREK', 'GS', 'GSLA', 'HDFS', 'HEBR', 'HIST', 'HK', 'HONR', 'HORT', 'HSCI', 'HSOP', 'HTM', 'IDE', 'IDIS', 'IE', 'IET', 'ILS', 'IMPH', 'IPPH', 'IT', 'ITAL', 'JPNS', 'JWST', 'KOR', 'LA', 'LALS', 'LATN', 'LC', 'LING', 'MA', 'MCMP', 'ME', 'MET', 'MFET', 'MGMT', 'MSE', 'MSL', 'MUS', 'NRES', 'NS', 'NUCL', 'NUPH', 'NUR', 'NUTR', 'OBHR', 'OLS', 'PES', 'PHIL', 'PHPR', 'PHRM', 'PHSC', 'PHYS', 'POL', 'PSY', 'PTGS', 'PUBH', 'REL', 'RUSS', 'SA', 'SCI', 'SCLA', 'SFS', 'SLHS', 'SOC', 'SPAN', 'STAT', 'SYS', 'TDM', 'TECH', 'THTR', 'TLI', 'VCS', 'VIP', 'VM', 'WGSS']
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCodes = class_codes.filter(code =>
    code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Purdue Subject Directory - BoilerClasses</title>
        <meta name="title" content="Purdue Subject Directory - BoilerClasses" />
        <meta name="description" content="BoilerClasses (Boiler Classes) - Purdue's course catalog with over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more." />
        <meta name="keywords" content={`Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers, ${class_codes.join(', ')}`} />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <link rel="canonical" href="https://boilerclasses.com/dir" />

      </Head>
      <div className='m-10'>
        <button onClick={() => router.back()} className='text-white text-xl'>&lt;</button>
        <h1 className='font-bold text-white text-3xl mb-4'>All Subjects Directory</h1>
        <input
          type="text"
          placeholder="Filter subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mb-4 p-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:border-zinc-500"
        />

        <div className="grid gap-4 grid-cols-4">
          {filteredCodes.map((code) => (
            <Link key={code} href={`/dir/${code}`}
              className="p-6 bg-zinc-900 rounded-md shadow-md text-lg font-semibold text-white underline decoration-dotted underline-offset-4 hover:scale-[1.05] transition cursor-pointer">
              <p className='text-center'>{code}</p>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </>
  )

}

export default Directory;