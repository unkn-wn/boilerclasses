"use client"

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { gradeGPA, CourseInstructor, InstructorGrade, Grade } from "../../shared/types";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

const graphColors = [
  "#87CEFA", "#98FB98", "#FFA07A", "#FFE4B5", "#F0E68C", "#FF6347", "#FFD700", "#B0E0E6", "#00FA9A", "#FF4500", "#BDB76B", "#8FBC8F", "#FF69B4", "#FA8072", "#FFDAB9", "#FFE4E1", "#F0FFF0", "#FFEC8B", "#FFE4C4", "#D2B48C", "#DDA0DD", "#FFD700", "#FFEBCD",
];

export const Graph = ({grades,title}: { grades: [string, InstructorGrade][], title:string }) => {
	const allLetterGrades: Grade[]=[...new Set(grades.flatMap(x=>Object.entries(x[1].grade)
		.filter(([k,v])=>k in gradeGPA && v>0).map(([k,v])=>k) as Grade[]))];
	allLetterGrades.sort((a,b) => gradeGPA[b]!-gradeGPA[a]!
		-(a=="E"?0.1:0)+(b=='E'? 0.1:0)-(a=="A+"?0.1:0)+(b=='A+'? 0.1:0));

	const datasets = grades.map((x,i) => {
		const d = allLetterGrades.map(g=>x[1].grade[g] ?? 0);
		const tot = d.reduce((a,b)=>a+b);

		return {
			backgroundColor: graphColors[i%graphColors.length],
			label: x[0],
			data: d.map(y=>100*y/tot),
			barPercentage: 1
		};
	});

	return <div className="md:mt-4 mt-2 mb-4 w-full h-96 bg-zinc-900 mx-auto p-4 rounded-xl">
		<div className="h-full w-full mb-4">
			<Bar
				options={{
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'top',
							labels: {
								color: "white",
							}
						},
						tooltip: {
							callbacks: {
								title(ctx) {return ctx.map(x=>x.dataset.label!);},
								label(ctx) {return `${allLetterGrades[ctx.parsed.x]}: ${ctx.parsed.y.toFixed(0)}%`;}
							},
							intersect: false
						},
						title: {
							display: true,
							text: title,
							color: "white"
						},
					},
					scales: {
						y: {
							title: {
								display: true,
								text: '% of Students',
								color: "white"
							},
							grid: {
								color: "#d1d5db"
							},
							ticks: {
								color: "#d1d5db"
							}
						},
						x: {
							grid: {
								color: "#d1d5db"
							},
							ticks: {
								color: "#d1d5db"
							}
						}
					}
				}} data={{
					labels: allLetterGrades, datasets
				}} />
		</div>
	</div>;
}


export default Graph;