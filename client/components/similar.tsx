import { useContext } from "react";
import { useAPI } from "./wrapper";
import { ServerSearch } from "../../shared/types";
import { Collapse } from "react-collapse";
import { Card } from "./card";

export function SimilarCourses({id}: {id: number}) {
	const ret = useAPI<ServerSearch["results"],number>("similar", {data: id});

	return <Collapse isOpened={ret!=null && ret.res.length>0} key={ret!=null ? 1 : 0} >
		<div className="flex flex-col" >
			<h2 className="font-extrabold font-display text-2xl mb-2" >Similar Courses</h2>
			<div className="flex flex-row flex-nowrap overflow-x-scroll w-full bg-zinc-900 rounded-md p-3 gap-3" >
				{ret!=null && ret.res.map(c =>
					<Card {...c} key={c.course.id} course={c.course} className="flex-shrink-0 basis-96 bg-zinc-700 max-w-[80dvw]" />
				)}
			</div>
		</div>
	</Collapse>;
}