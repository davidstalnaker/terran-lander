const SCALING_FACTOR = 1; // Pixels / Meter
const MAX_THRUST = 750000; // Newtons
const MIN_THROTTLE = 0.6
const MASS = 25000; // Kilograms

class Lander {
	constructor(landerElem, worldElem) {
		this.landerElem = landerElem;
		this.worldElem = worldElem;
		this.x = 0;
		this.y = 1000; // Meters
		this.vx = 0;
		this.vy = -150;
		this.ay = 0;
		this.thrust = 0;
		this.exploded = false;
		this.stopSimulating = false;
	}

	step(timestep) {
		this.ay = this.getAccelerationGravity() + this.getAccelerationGround();
		if (this.getAccelerationEngines() > 0) {
			this.ay += Math.max(Math.min(this.getAccelerationEngines() + Math.random() - 0.5, MAX_THRUST / MASS), MAX_THRUST / MASS * MIN_THROTTLE)
		}
		console.log([timestep, this.y, this.vy, this.ay, this.getAccelerationToStop()]);
		if (this.exploded || this.ay > 100) {
			this.exploded = true;
			this.stopSimulating = true;
		} else {
			this.vy += this.ay * timestep / 1000;
			this.y = this.y + this.vy * timestep / 1000;
			this.x = this.x + this.vx * timestep / 1000;
			if (Math.abs(this.ay) < 0.01 && this.y < .01 && Math.abs(this.vy) < 3) {
				this.stopSimulating = true;
			}
		}
		this.redraw();
	}

	getAccelerationGravity() {
		return -9.8;
	}

	getAccelerationGround() {
		let springA = -100 * this.y + 9.8;
		if (springA > 0) {
			return Math.max(springA - 20 * this.vy, 0);
		}
		return 0;
	}

	getAccelerationEngines() {
		if (this.vy > .01 || this.y < .01) {
			this.firing = false;
			return 0;
		}

		const maxA = MAX_THRUST / MASS;
		if (!this.firing) {
			if (this.getAccelerationToStop() + 9.8 > maxA * .9) {
				this.firing = true;
				return this.getAccelerationToStop() + 9.8;
			} else {
				return 0;
			}
		} else {
			let idealA = maxA * .9;
			let plannedA = this.getAccelerationToStop() + 9.8;
			let deltaA = idealA - plannedA;
			return plannedA - deltaA;
		}
	}

	getAccelerationToStop() {
		return this.vy * this.vy / (2 * (this.y - 0.1));
	}

	redraw() {
		const worldHeightPx = this.worldElem.clientHeight;
		const worldWidthPx = this.worldElem.clientWidth;
		const worldHeight = worldHeightPx / SCALING_FACTOR;
		const worldWidth = worldWidthPx / SCALING_FACTOR;
		this.landerElem.style.bottom = worldHeightPx - (worldHeight - this.y) / worldHeight * worldHeightPx;
		this.landerElem.style.left = worldWidthPx * 0.5 + SCALING_FACTOR * this.x;
		if (this.exploded) {
			this.landerElem.classList.add('exploded');
		}

		if (this.firing) {
			this.landerElem.classList.add('firing');
		} else {
			this.landerElem.classList.remove('firing');
		}
	}
}

function createChart(elem, title) {
	let chart = new Chart(elem, {
		type: 'line',
		data: {
			datasets: [{
				data: []
			}]
		},
		options: {
			title: {
				display: true,
				text: title
			},
			legend: {
				display: false
			},
			responsive: false,
	        scales: {
	            xAxes: [{
	                type: 'linear',
	                position: 'bottom',
	                ticks: {
	                	suggestedMax: 10
	                },
		            gridLines: {
		            	display: false
		            }
	            }],
	            yAxes: [{
	            	ticks: {
	            		beginAtZero: true
	            	},
		            gridLines: {
		            	display: false
		            }
	            }]
	        },
	        elements: {
	        	point: {
	        		radius: 1
	        	},
	        	line: {
	        		fill: false
	        	}
	        }
		}
	});
	return chart;
}

window.onload = () => {
	let heightChart = createChart(document.getElementById('heightChart'), "Height (m)");
	let velocityChart = createChart(document.getElementById('velocityChart'), "Velocity (m/s)");
	let accelerationChart = createChart(document.getElementById('accelerationChart'), "Acceleration (m/s^2)");

	let l = new Lander(document.querySelector('.lander'), document.querySelector('.world'));

	let startTime = (new Date()).getTime();
	let lastFrameTime = startTime;
	let i = window.setInterval(() => {
		currentTime = (new Date()).getTime();
		timeStep = currentTime - lastFrameTime;
		lastFrameTime = currentTime;
		if (!l.stopSimulating) {
			l.step(timeStep);
			heightChart.data.datasets[0].data.push({x: (currentTime - startTime) / 1000, y: l.y});
			heightChart.update();
			velocityChart.data.datasets[0].data.push({x: (currentTime - startTime) / 1000, y: l.vy});
			velocityChart.update();
			accelerationChart.data.datasets[0].data.push({x: (currentTime - startTime) / 1000, y: l.ay});
			accelerationChart.update();
		} else {
			window.clearInterval(i);
		}
	}, 33);

};
