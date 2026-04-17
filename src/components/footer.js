import React from 'react';
import Link from 'next/link';

import {
    Image
} from '@chakra-ui/react'


const Footer = () => {
    return (
        <div className='grid justify-center py-5 relative gap-3'>
            <h1 className='mx-2 text-tertiary text-sm text-center break-words'>
                <span className='flex items-center justify-center gap-2 mb-0.5'>
                    <a href='https://github.com/unkn-wn/boilerclasses' target="_black" rel="noopener noreferrer" className='text-tertiary flex items-center gap-1 underline decoration-dashed decoration-1 underline-offset-2'>
                        <Image src="https://icones.pro/wp-content/uploads/2021/06/icone-github-grise.png" alt="" boxSize={4} />
                        BoilerClasses
                    </a>
                    <span className='text-tertiary'>·</span>
                    <span>Sponsored by</span>
                    <a href='https://www.mechanize.work/' target='_blank' rel='noopener noreferrer' className='text-tertiary flex items-center gap-1'>
                        <span
                            aria-hidden
                            className='inline-block h-3.5 shrink-0 bg-current'
                            style={{
                                aspectRatio: '8981 / 9287',
                                WebkitMaskImage: 'url(/mechanize.svg)',
                                maskImage: 'url(/mechanize.svg)',
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center',
                            }}
                        />
                        <span className='underline decoration-dashed decoration-1 underline-offset-2'>Mechanize</span>
                    </a>
                </span>
                An <Link href={`/dir`}>unofficial catalog</Link> for Purdue courses made by Purdue students. We'd love to hear your <a href="https://forms.gle/jtpLPbXm4X4RFoNh6" target="_black" rel="noopener noreferrer" className='underline decoration-dashed decoration-1 underline-offset-2'>feedback</a>!
                {/* Inspired by <a href='https://classes.wtf/' target='_blank' rel='noopener noreferrer' className='underline decoration-dashed decoration-1 underline-offset-2'>classes.wtf</a><br /> */}
            </h1>
        </div>
    );
};

export default Footer;
