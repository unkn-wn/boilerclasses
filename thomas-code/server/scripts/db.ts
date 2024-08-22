import { RMPInfo } from "../../shared/types";

export type DBCourse = {
	id: number,
	subject: string, course: number, name: string,
	data: string //Course
};

export type DBInstructor = {
	id: number,
	//stored in separate columns so i can query rmp quickly w/o all data w/o using extract
	name: string,
	rmp: RMPInfo|null,
	data: string //Instructor (rmp is duplicated :/, but its fine)
};

export type DBTerm = {
	id: string,
	purdue_id: string,
	name: string,
	last_updated: number
};

export type DBSubject = { abbr: string, name: string };
export type DBAttribute = { id: string, name: string };
export type DBSchedType = { name: string };