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

const Graph = ({ data, scheduler = false }) => {

	const chartTitle = scheduler ? '% Grade Distribution Across All Instructors' : '% Grade Distribution';

	return (
		<>
			<div className="h-full w-full bg-background mx-auto p-4 rounded-xl">
				<Bar
					options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								position: 'top',
								labels: {
									color: `rgb(var(--text-color))`,
								}
							},
							title: {
								display: true,
								text: chartTitle,
								color: `rgb(var(--text-color))`
							},
						},
						scales: {
							y: {
								title: {
									display: true,
									text: '% of Students',
									color: `rgb(var(--text-color))`
								},
								grid: {
									color: `rgb(var(--text-color-secondary))`
								}
							},
							x: {
								grid: {
									color: `rgb(var(--text-color-secondary))`
								}
							}
						}
					}} data={data}
				// { 				(example dataset for testing)
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