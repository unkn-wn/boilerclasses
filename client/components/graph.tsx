"use client"

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { gradeGPA, Instructor, InstructorGrade } from "../../shared/types";

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

export const Graph = ({grades}: { grades: [Instructor, InstructorGrade][] }) => {
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
						title: {
							display: true,
							text: 'Average Grades by Instructor',
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
								color: "gray"
							}
						},
						x: {
							grid: {
								color: "gray"
							}
						}
					}
				}} data={{
					datasets: grades.map((x,i) => {
						const letterGrades = Object.entries(x[1].grade)
							.filter(([k,v]) => k in gradeGPA);
						const tot = letterGrades.reduce((a,b) => a+b[1], 0);

						return {
							backgroundColor: graphColors[i%graphColors.length],
							label: x[0].name,
							data: tot==0 ? [] : letterGrades.map(x => ({
								x: x[0], y: 100*x[1]/tot
							}))
						};
					})
				}} />
		</div>
	</div>;
}


export default Graph;