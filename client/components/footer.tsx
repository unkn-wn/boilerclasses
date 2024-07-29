import { Title, Text, Anchor, Image, Center, AnchorProps, Group, Stack } from '@mantine/core';
import github from "../public/github.svg"
import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, HTMLAttributes } from "react";

const NextLink: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>&LinkProps&AnchorProps> = (props) =>
	<Anchor component={Link} {...props} > {props.children} </Anchor>;

export const Footer = () => <Stack mt="xs" c="gray" gap={0} >
	<Center>
		<NextLink href="https://github.com/unkn-wn/boilerclasses" target="_blank" rel="noopener noreferrer" >
			<Group align="center" justify="start" gap={8} >
					<Image src={github.src} alt="github" height={20} style={{verticalAlign: "middle"}} />
					BoilerClasses
			</Group>
		</NextLink>
	</Center>
		{/* <Text>&nbsp;(last deployed 1/2/24)</Text> */}
	<Text>is an unofficial catalog for Purdue courses made by Purdue students,
		<Text component="br" display={{ base: 'none', md: 'inline' }}></Text>
		based in <strong>West Lafayette, Indiana</strong>. We'd love to hear your{' '}
		<NextLink href="https://forms.gle/jtpLPbXm4X4RFoNh6" target="_blank" rel="noopener noreferrer" >
			feedback
		</NextLink>!
	</Text>
	{/* Inspired by <Anchor href="https://classes.wtf/" target="_blank" rel="noopener noreferrer" underline={false} style={{ textDecorationStyle: 'dashed', textDecorationThickness: '1px', textUnderlineOffset: '2px' }}>classes.wtf</Anchor><br /> */}
</Stack>;