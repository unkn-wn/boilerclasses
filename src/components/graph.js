import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

const Graph = (props) => {
	const { data } = props;

	return (
		<>
			<div className="h-full w-full bg-zinc-900 mx-auto p-4 rounded-xl">
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
								text: 'Grade Distribution',
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
					}} data={data}
				// {
				//   {
				//     labels,
				//     datasets: [{
				//       label: 'test1',
				//       data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
				//       backgroundColor: 'rgba(53, 162, 235, 0.5)',
				//     }]
				//   }
				// }
				/>
			</div>
		</>
	)
}

export default Graph;


// util functions for graph and gpa

// Helper to sanitize description
export const sanitizeDescription = (data) => {
	if (data.description && data.description.startsWith("<a href=")) {
		data.description = "No Description Available";
	}
};

// Helper to collect all professors
export const collectAllProfessors = (instructors) => {
	const allProfs = [];
	for (const semester in instructors) {
		for (const instructor of instructors[semester]) {
			if (!allProfs.includes(instructor)) {
				allProfs.push(instructor);
			}
		}
	}
	return allProfs;
};

// Helper to calculate GPA and grade distributions
export const calculateGradesAndGPA = (profs, gpaData, colors) => {
	const grades = [];
	const gpa = {};
	let colorIndex = 0;

	for (const instructor of profs) {
		let avgGPA = 0;
		let avgGradeDist = Array(13).fill(0);
		const color = colors[colorIndex++ % colors.length];

		if (!gpaData[instructor]) {
			gpa[instructor] = [0, "#ffffff"];
			grades.push({
				label: instructor,
				data: avgGradeDist,
				backgroundColor: "#ffffff",
			});
			continue;
		}

		let semesterCount = 0;
		for (const sem in gpaData[instructor]) {
			avgGPA += gpaData[instructor][sem][13];
			avgGradeDist = avgGradeDist.map(
				(val, i) => val + gpaData[instructor][sem][i]
			);
			semesterCount++;
		}

		avgGradeDist = avgGradeDist.map((val) =>
			Math.round((val / semesterCount) * 100) / 100
		);

		gpa[instructor] = [
			Math.round((avgGPA / semesterCount) * 100) / 100,
			color,
		];
		grades.push({
			label: instructor,
			data: avgGradeDist,
			backgroundColor: color,
		});
	}
	return { grades, gpa };
};


import { graphColors } from '@/lib/utils';
export const averageAllData = (grades) => {

	const avg = Array(13).fill(0);
	for (const grade of grades) {
		grade.data.forEach((val, i) => {
			avg[i] += val;
		});
	}

	const avgData = [{
		label: "Average",
		data: avg.map((val) => Math.round(val / grades.length * 100) / 100),
		backgroundColor: graphColors[Math.floor(Math.random() * graphColors.length)],
	}];

	return avgData;

}