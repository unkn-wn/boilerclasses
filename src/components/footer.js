import React from 'react';

import {
    Image
} from '@chakra-ui/react'

const Footer = () => {
    return (
        <div className='grid justify-center py-5'>
            <p className='text-gray-700 text-sm text-center break-words'>
                <div className='flex items-center justify-center'>
                    <a href='https://github.com/unkn-wn/boilerclasses' target="_black" rel="noopener noreferrer" className='text-gray-500 flex items-center gap-1'>
                        <Image src="https://icones.pro/wp-content/uploads/2021/06/icone-github-grise.png" alt="" boxSize={4} />
                        BoilerClasses
                    </a>
                </div>
                is an unofficial catalogue for Purdue courses made by Purdue students. <br />
                We'd love to hear your <a href="https://forms.gle/jtpLPbXm4X4RFoNh6" target="_black" rel="noopener noreferrer" className='text-gray-500'>feedback! </a>
                Inspired by <a href='https://classes.wtf/' target='_blank' rel='noopener noreferrer' className='text-gray-500'>classes.wtf</a><br />
            </p>
        </div>
    );
};

export default Footer;
