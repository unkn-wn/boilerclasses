import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, HTMLAttributes } from "react";
import { Anchor } from "./util";
import Image from "next/image";
import github from "../public/github.svg"

export const Footer = () => {
	return (
		<div className='grid justify-center py-5'>
			<h1 className='mx-2 text-gray-400 text-sm text-center break-words'>
				<span className='flex items-center justify-center'>
					<Anchor target="_blank" href='https://github.com/unkn-wn/boilerclasses' >
						<Image src={github} alt="" width={12} />
						BoilerClasses
					</Anchor>
					{/* <p>&nbsp;(last deployed 1/2/24)</p> */}
				</span>
				is an unofficial catalog for Purdue courses made by Purdue students, <br className='hidden md:block' />
				based in <strong>West Lafayette, Indiana</strong>. We'd love to hear your <Anchor href="https://forms.gle/jtpLPbXm4X4RFoNh6" target="_blank" >feedback</Anchor>!
				{/* Inspired by <a href='https://classes.wtf/' target='_blank' rel='noopener noreferrer' className='underline decoration-dashed decoration-1 underline-offset-2'>classes.wtf</a><br /> */}
			</h1>
		</div>
	);
};