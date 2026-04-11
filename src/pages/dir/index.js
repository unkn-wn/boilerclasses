import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';

import Footer from '@/components/footer';
import SearchBar from '@/components/SearchBar';

const Directory = () => {
  const router = useRouter();

  const class_codes = ["AAE", "AAS", "ABE", "ACCT", "AD", "AFT", "AGEC", "AGR", "AGRY", "AMST", "ANSC", "ANTH", "ARAB", "ARCH", "ASAM", "ASEC", "ASL", "ASM", "ASTR", "AT", "BAND", "BCHM", "BIOL", "BME", "BMS", "BTNY", "BUS", "CAND", "CCE", "CDIS", "CE", "CEM", "CGT", "CHE", "CHM", "CHNS", "CIT", "CLCS", "CLPH", "CM", "CMGT", "CMPL", "CNIT", "COM", "CPB", "CS", "CSCI", "CSR", "DANC", "DCTC", "DSB", "EAPS", "ECE", "ECET", "ECON", "EDCI", "EDPS", "EDST", "EEE", "ENE", "ENGL", "ENGR", "ENGT", "ENTM", "ENTR", "EPCS", "EXPL", "FIN", "FLM", "FNR", "FR", "FS", "FVS", "GEP", "GER", "GRAD", "GREK", "GS", "GSLA", "HDFS", "HEBR", "HER", "HETM", "HHS", "HIST", "HK", "HONR", "HORT", "HSCI", "HSOP", "HTM", "IBE", "IDE", "IDIS", "IE", "IET", "ILS", "IMPH", "IPPH", "INT", "IT", "ITAL", "JPNS", "JWST", "KOR", "LA", "LALS", "LATN", "LC", "LING", "MA", "MATH", "MCMP", "ME", "MET", "MFET", "MGMT", "MIS", "MKTG", "MSE", "MSL", "MSPE", "MUS", "NRES", "NS", "NUCL", "NUPH", "NUR", "NUTR", "OBHR", "OLS", "OPP", "PES", "PHIL", "PHPR", "PHRM", "PHSC", "PHYS", "POL", "PSY", "PTGS", "PUBH", "QM", "REAL", "REG", "REL", "RPMP", "RUSS", "SA", "SCI", "SCLA", "SCOM", "SFS", "SLHS", "SOC", "SPAN", "STAT", "STRT", "SYS", "TCM", "TDM", "TECH", "THTR", "TLI", "VCS", "VIP", "VM", "WGSS"]
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCodes = class_codes.filter(code =>
    code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Purdue Subject Directory | BoilerClasses</title>
        <meta name="title" content="Purdue Subject Directory | BoilerClasses" />
        <meta name="description" content="BoilerClasses (Boiler Classes) - Purdue's course catalog with over 13000 Purdue University courses. Find geneds, grades, prerequisites, schedules, and more." />
        <meta name="keywords" content={`Purdue, Purdue Univesity, Purdue Courses, BoilerClasses, Boiler Classes, Boiler, Classes, BoilerCourses, Boiler Class, Catalog, Catalogue, Purdue Course Search, Purdue Course Catalog, Boilermakers, ${class_codes.join(', ')}`} />
        <meta name='og:locality' content='West Lafayette' />
        <meta name='og:region' content='IN' />
        <meta name='og:postal-code' content='47906' />
        <meta name='og:postal-code' content='47907' />

        <link rel="canonical" href="https://boilerclasses.com/dir" />

      </Head>
      <div className='m-10'>
        <button onClick={() => router.back()} className='text-primary text-xl'>&lt;</button>
        <h1 className='font-bold text-primary text-3xl mb-4'>All Subjects Directory</h1>
        <SearchBar
          placeholder="Filter subjects..."
          value={searchQuery}
          onChange={setSearchQuery}
          className='mb-4'
        />
        <div className="grid gap-4 grid-cols-4">
          {filteredCodes.map((code) => (
            <Link key={code} href={`/dir/${code}`}
              className="p-6 bg-background rounded-md shadow-md text-lg font-semibold text-primary underline decoration-dotted underline-offset-4 hover:scale-[1.05] transition cursor-pointer">
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