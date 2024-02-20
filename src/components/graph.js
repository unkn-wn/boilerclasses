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
import { labels } from '@/lib/utils';

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
			<div className="lg:mt-6 md:mt-4 mt-2 mb-8 w-full h-96 bg-gray-800 mx-auto p-4 rounded-xl">
				<div className="h-full w-full mb-4">
					<Bar
						options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: {
									position: 'top',
									labels: {
										color: "white"
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

			</div>
		</>
	)
}


export default Graph;