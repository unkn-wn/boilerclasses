// Component that renders a bar chart for displaying grade distribution data
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

import React, { useState, useEffect } from 'react';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

const Graph = ({ data, scheduler = false }) => {

	const [chartColors, setChartColors] = useState({
		textColor: '0, 0, 0', // Default fallback
		textSecondaryColor: '200, 200, 200', // Default fallback
	});

	const [profData, setProfData] = useState(data);


	/**
	 * Needed to set profdata to data for some reason
	 */
	useEffect(() => {
		setProfData(data);
	}, [data]);

	// Function to fetch CSS variables
	const getCSSVariable = (variable) => {

		return getComputedStyle(document.documentElement)
			.getPropertyValue(variable)
			.trim();
	};

	// Update colors when component mounts or theme changes
	useEffect(() => {

		const updateColors = () => {
			setChartColors({
				textColor: getCSSVariable('--text-color'),
				textSecondaryColor: getCSSVariable('--text-tertiary-color'),
			});
			setProfData({
				...data,
				datasets: data.datasets.map(dataset => ({
					...dataset,
					backgroundColor: `rgb(${getCSSVariable(dataset.backgroundColor.replace('rgb(var(', '').replace('))', ''))})`
				}))
			});

		};


		// Update colors initially
		updateColors();

		// Listen for theme changes (assuming a `themeChange` event is dispatched)
		window.addEventListener('themeChange', updateColors);

		return () => {
			window.removeEventListener('themeChange', updateColors);
		};
	}, [data]);


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
									color: `rgb(${chartColors.textColor})`,
								}
							},
							title: {
								display: true,
								text: chartTitle,
								color: `rgb(${chartColors.textColor})`,
							},
						},
						scales: {
							y: {
								title: {
									display: true,
									text: '% of Students',
									color: `rgb(${chartColors.textColor})`,
								},
								grid: {
									color: `rgb(${chartColors.textSecondaryColor})`,
								}
							},
							x: {
								grid: {
									color: `rgb(${chartColors.textSecondaryColor})`,
								}
							}
						}
					}} data={profData}
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