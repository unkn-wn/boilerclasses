"use client"

import { useContext } from "react";
import { Anchor } from "./util";
import { IconBrandGithubFilled, IconInfoCircleFilled } from "@tabler/icons-react";
import { AppCtx } from "./wrapper";
import { twMerge } from "tailwind-merge";

function InfoModal() {
	return <div className="pt-5 flex flex-col gap-3" >
		<p>Thank you for trying BoilerClasses! We're powered by <b>Next.js (and React, Tailwind, etc) and Apache Lucene (for full-text search)</b>. Our data comes directly from the Purdue catalog, which is backed by Ellucian's  very slow and clunky Banner Self Service. If you'd like a taste, you can download everything <Anchor target="_blank" href="/api/data" >here.</Anchor> It's not complicated.</p>

		<p>Check us out on <Anchor target="_blank" href='https://github.com/unkn-wn/boilerclasses' >
			<IconBrandGithubFilled className="self-center" />
			Github
		</Anchor> for more details. Currently, we only support West Lafayette and a small selection of recent semesters. We'd love to hear your <Anchor href="https://forms.gle/jtpLPbXm4X4RFoNh6" target="_blank" >feedback</Anchor>!</p>
	</div>;
}

export const Footer = ({ className }: { className?: string }) => {
	const ctx = useContext(AppCtx);
	return (
		<div className={twMerge('grid justify-center py-5', className)} >
			<h1 className='mx-2 text-gray-400 text-sm text-center break-words'>
				<span className='flex items-center justify-center'>
					<Anchor target="_blank" onClick={() => ctx.open({ type: "other", modal: <InfoModal /> })} className="items-center align-middle" >
						<IconInfoCircleFilled />
						BoilerClasses
					</Anchor>
				</span>
				is an unofficial catalog for Purdue courses <br className='hidden md:block' /> made by Purdue students.
			</h1>
		</div>
	);
};