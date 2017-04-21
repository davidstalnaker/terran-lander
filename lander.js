const SCALING_FACTOR = 1; // Pixels / Meter
const MAX_THRUST = 750000; // Newtons
const MIN_THROTTLE = 0.6
const MASS = 25000; // Kilograms

class Lander {
	constructor(landerElem, worldElem, landingController) {
		this.landerElem = landerElem;
		this.worldElem = worldElem;
		this.landingController = landingController;
		this.log = [];
		this.c = {
			x: 0,
			y: 1000,
			vx: 0,
			vy: -150,
			ax: 0,
			ay: 0,
			thrust: 0,
			exploded: false,
			firing: false,
			stopSimulating: false
		};
	}

	step(timestep) {
		this.c.timestep = timestep;
		this.c.ay =
		    this.getAccelerationGravity() +
		    this.getAccelerationGround() +
		    this.getAccelerationEngines();
		if (this.exploded || this.c.ay > 100) {
			this.exploded = true;
			this.stopSimulating = true;
		} else {
			this.c.vy += this.c.ay * timestep / 1000;
			this.c.y = this.c.y + this.c.vy * timestep / 1000;
			this.c.x = this.c.x + this.c.vx * timestep / 1000;
			if (Math.abs(this.c.ay) < 0.01 && this.c.y < .01 && Math.abs(this.c.vy) < 3) {
				this.stopSimulating = true;
				console.log(this.log);
			}
		}
		this.log.push(this.c);
		this.c = Object.assign({}, this.c);
		this.redraw();
	}

	getAccelerationGravity() {
		return -9.8;
	}

	getAccelerationGround() {
		let springA = -100 * this.c.y + 9.8;
		if (springA > 0) {
			return Math.max(springA - 20 * this.c.vy, 0);
		}
		return 0;
	}

	getAccelerationEngines() {
		let requestedThrottle = this.landingController.getThrottle(this.c);
		this.c.requestedThrottle = requestedThrottle;
		if (requestedThrottle <= 0) {
			this.c.throttle = 0;
			return 0;
		} else {
			let actualThrottle = Math.max(Math.min(requestedThrottle, 1), MIN_THROTTLE);
			this.c.throttle = actualThrottle;
			return actualThrottle * MAX_THRUST / MASS;
		}
	}

	redraw() {
		const worldHeightPx = this.worldElem.clientHeight;
		const worldWidthPx = this.worldElem.clientWidth;
		const worldHeight = worldHeightPx / SCALING_FACTOR;
		const worldWidth = worldWidthPx / SCALING_FACTOR;
		this.landerElem.style.bottom = worldHeightPx - (worldHeight - this.c.y) / worldHeight * worldHeightPx;
		this.landerElem.style.left = worldWidthPx * 0.5 + SCALING_FACTOR * this.c.x;
		if (this.c.exploded) {
			this.landerElem.classList.add('exploded');
		}

		if (this.c.firing) {
			this.landerElem.classList.add('firing');
		} else {
			this.landerElem.classList.remove('firing');
		}
	}
}

class LandingController {
	getThrottle(c) {
		const maxA = MAX_THRUST / MASS;
		let onGroundOrGoingUp = c.vy > .01 || c.y < .01;
		let shouldStartFiring = this.getAccelerationToStop(c) + 9.8 > maxA * 0.9;
		if (onGroundOrGoingUp || !(c.firing || shouldStartFiring)) {
			c.firing = false;
			return 0;
		} else {
			c.firing = true;
			return this.getAdjustedThrottle(c);
		}
	}

	getAccelerationToStop(c) {
		return c.vy * c.vy / (2 * (c.y - 0.1));
	}

	getAdjustedThrottle(c) {
		const maxA = MAX_THRUST / MASS;
		let idealA = maxA * .9;
		let plannedA = this.getAccelerationToStop(c) + 9.8;
		let deltaA = idealA - plannedA;
		let adjustedA = plannedA - deltaA;
		return adjustedA * MASS / MAX_THRUST;
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

function createCharts(specs) {
	let charts = [];
	let telemetryContainer = document.querySelector('.telemetry');
	for (let spec of specs) {
		let chartElem = document.createElement('canvas');
		chartElem.classList.add('telemetry-chart');
		chartElem.setAttribute('height', '200');
		chartElem.setAttribute('width', '300');
		telemetryContainer.appendChild(chartElem);
		charts.push({
			chart: createChart(chartElem, spec.title),
			value: spec.value
		});
	}
	return charts;
}

function updateCharts(charts, c, time) {
	for (let chart of charts) {
		chart.chart.data.datasets[0].data.push({ x: time, y: chart.value(c) });
		chart.chart.update();
	}
}

window.onload = () => {
	let charts = createCharts([
		{ title: 'Height (m)', value: (c) => c.y },
		{ title: 'Velocity (m/s)', value: (c) => c.vy },
		{ title: 'Acceleration (m/s^2)', value: (c) => c.ay },
		{ title: 'Requested Throttle Position', value: (c) => c.requestedThrottle },
		{ title: 'Throttle Position', value: (c) => c.throttle }
	]);

	let l = new Lander(
		document.querySelector('.lander'),
		document.querySelector('.world'),
		new LandingController());

	let startTime = (new Date()).getTime();
	let lastFrameTime = startTime;
	let i = window.setInterval(() => {
		currentTime = (new Date()).getTime();
		timeStep = currentTime - lastFrameTime;
		lastFrameTime = currentTime;
		if (!l.stopSimulating) {
			l.step(timeStep);
			updateCharts(charts, l.c, (currentTime - startTime) / 1000);
		} else {
			window.clearInterval(i);
		}
	}, 33);

};
