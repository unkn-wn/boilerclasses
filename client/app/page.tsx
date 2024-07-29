"use client"

import React from "react";
import icon from "../public/icon.png"
import { Center, Container, createTheme, Flex, Image, MantineProvider, Stack, TextInput, Title } from "@mantine/core";
import { Footer } from "@/components/footer";

import "@mantine/core/styles.layer.css";
import "./style.css"

const theme = createTheme({
	colors: {
		dark: ["#f8f9fa", "#f1f3f5", "#e9ecef", "#dee2e6",
			"#ced4da", "#adb5bd", "#868e96", "#181a1c", "#101112", "#000000"]
	},
	fontFamily: 'var(--inter), sans-serif',
	headings: { fontFamily: 'var(--chivo), sans-serif' },
});

type SearchState = {
	query: string,
	creditMin?: number, creditMax?: number
	attributes: string[],
	minCourse?: number, maxCourse?: number,
	subjects: string[],
	scheduleType: string[]
}

//construction in progress

export default async function App({searchParams}: {searchParams: Record<string,string>}) {
  return (
    <MantineProvider theme={theme} forceColorScheme="dark" >
			<Container>
				<Stack gap="md" justify="space-between" h="100vh" py={50} align="center" >
					<Stack gap="md" justify="end" flex={0.7} >
						<Center><Image src={icon.src} maw={300} alt="icon" ></Image></Center>
						<Center><Title order={1} size={70} >BoilerClasses</Title></Center>
						<TextInput
							styles={{input: {borderBottom: "1px solid white", fontSize: "1.3rem",
								padding: "0 10px"}}}
							variant="unstyled"
							size="md"
							placeholder="Course name or keywords"
						/>
					</Stack>
					<Footer/>
				</Stack>
			</Container>
    </MantineProvider>
  )
}
