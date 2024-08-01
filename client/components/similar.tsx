import { useContext } from "react";
import { CourseContext } from "./clientutil";
import { useAPI } from "./wrapper";
import { ServerSearch } from "../../shared/types";
import { Collapse } from "react-collapse";
import { Card } from "./card";

export function SimilarCourses() {
	const cc = useContext(CourseContext);
	const ret = useAPI<ServerSearch["results"],string>("similar", {data: cc.id});

	return <Collapse isOpened={ret!=null && ret.res.length>0} key={ret!=null ? 1 : 0} >
		<div className="flex flex-col" >
			<h2 className="font-extrabold font-display text-2xl mb-2" >Similar Courses</h2>
			<div className="flex flex-row flex-nowrap overflow-x-scroll w-full bg-zinc-900 rounded-md p-3 gap-3" >
				{ret!=null && ret.res.map(c =>
					<Card {...c} key={c.id} {...cc.info} className="flex-shrink-0 basis-96 bg-zinc-700" />
				)}
			</div>
		</div>
	</Collapse>;
}