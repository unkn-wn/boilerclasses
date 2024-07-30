"use client"

import React, { act, useContext, useEffect, useState } from "react";
import icon from "../public/icon.png"
import { Footer } from "@/components/footer";

import { Button, Loading, LogoText } from "@/components/util";
import { NextUIProvider } from "@nextui-org/system";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import {ServerInfo, ServerResponse} from "../../shared/types"
import { decodeQueryToSearchState, Search, SearchState } from "./search";
import Image from "next/image";

import { useSearchParams } from "next/navigation";
import { AppWrapper, useAPI } from "@/components/wrapper";

const Landing = ({setSearch}: {setSearch: (s: string) => void}) =>
	<><div className="flex-col z-40 grid place-content-center mx-4 h-screen items-center">
		<div className='flex flex-col items-center my-2 gap-6 md:my-4 lg:my-0 lg:mt-4 lg:mb-6'>
			<Image src={icon} alt="logo" onClick={() => setSearch("")} className='my-auto max-h-52 cursor-pointer w-auto' />
			<LogoText onClick={() => setSearch("")} />
		</div>
		<input
			id="landingSearch"
			type="text" autoFocus
			placeholder="I want to take a class about..."
			onChange={(e) => setSearch(e.target.value) }
			className="text-white text-lg md:text-xl bg-neutral-950 w-full pb-2 border-b-2 focus:outline-none focus:border-blue-500 transition duration-300"
		/>

	</div >

	<div className='absolute bottom-0 w-full'>
		<Footer />
	</div></>;

function App() {
	const [initSearch, setInitSearch] = useState<Partial<SearchState>|null>(null);
	const params = useSearchParams();
	const info = useAPI<ServerInfo>("info");

	useEffect(() => {
		if (initSearch==null && params.size>0)
			setInitSearch(decodeQueryToSearchState(params))
	}, [params]);

	return initSearch ?
		(info==null ? <div className="w-full h-screen"><Loading/></div>
			: <Search init={initSearch} info={info.res} />)
		: <Landing setSearch={(s) => setInitSearch({query: s})} />;
}

export default function Main() {
	return <AppWrapper><App/></AppWrapper>;
}
