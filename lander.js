const SCALING_FACTOR = 1; // Pixels / Meter
const MAX_THRUST = 750000; // Newtons
const MIN_THROTTLE = 0.6;
const RCS_THRUST = 75000; // Newtons 
const MASS = 25000; // Kilograms
const HEIGHT = 70; // Meters
const RADIUS = 1.85; // Meters
const INERTIA = MASS / 12 * (3 * RADIUS ** 2 + HEIGHT ** 2);

class Lander {
	constructor(landerElem, worldElem, landingController) {
		this.landerElem = landerElem;
		this.rcsLeftElem = landerElem.querySelector('.lander-rcs-left');
		this.rcsRightElem = landerElem.querySelector('.lander-rcs-right');
		this.worldElem = worldElem;
		this.landingController = landingController;
		this.log = [];
		this.c = {
			x: 0,
			y: 1000,
			th: 1,
			vx: 0,
			vy: -100,
			vth: 0,
			ax: 0,
			ay: 0,
			ath: 0,
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
		    this.getAccelerationEnginesY();
		this.c.ax = this.getAccelerationEnginesX();
		this.c.ath = this.getRotationalAcceleration();
		this.c.vx += this.c.ax * timestep / 1000;
		this.c.vy += this.c.ay * timestep / 1000;
		this.c.vth += this.c.ath * timestep / 1000;
		this.c.x += this.c.vx * timestep / 1000;
		this.c.y += this.c.vy * timestep / 1000;
		this.c.th += this.c.vth * timestep / 1000;
		this.log.push(this.c);
		this.c = Object.assign({}, this.c);
		if (this.c.exploded || this.c.ay > 100) {
			this.c.exploded = true;
			this.stopSimulating = true;
			console.log(this.log);
		} else if (Math.abs(this.c.ay) < 0.01 && this.c.y < .01 && Math.abs(this.c.vy) < 3) {
			this.stopSimulating = true;
			console.log(this.log);
		}
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

	getAccelerationEnginesX() {
		return this.getActualThrottle() * MAX_THRUST / MASS * Math.sin(this.c.th);
	}

	getAccelerationEnginesY() {
		return this.getActualThrottle() * MAX_THRUST / MASS * Math.cos(this.c.th);
	}

	getActualThrottle() {
		let requestedThrottle = this.landingController.getThrottle(this.c);
		this.c.requestedThrottle = requestedThrottle;
		if (requestedThrottle <= 0) {
			this.c.throttle = 0;
			return 0;
		} else {
			let actualThrottle = Math.max(Math.min(requestedThrottle, 1), MIN_THROTTLE);
			this.c.throttle = actualThrottle;
			return actualThrottle;
		}
	}

	getRotationalAcceleration() {
		let throttle = this.landingController.getRcsThrottle(this.c);
		this.c.rcsThrottle = throttle;
		let torque = throttle * RCS_THRUST * HEIGHT / 2;
		return torque / INERTIA;
	}

	redraw() {
		const worldHeightPx = this.worldElem.clientHeight;
		const worldWidthPx = this.worldElem.clientWidth;
		const worldHeight = worldHeightPx / SCALING_FACTOR;
		const worldWidth = worldWidthPx / SCALING_FACTOR;
		this.landerElem.style.bottom = worldHeightPx - (worldHeight - this.c.y) / worldHeight * worldHeightPx;
		this.landerElem.style.left = worldWidthPx * 0.5 + SCALING_FACTOR * this.c.x;
		this.landerElem.style.transform = 'rotate(' + this.c.th + 'rad)';
		if (this.c.exploded) {
			this.landerElem.classList.add('exploded');
		}

		if (this.c.firing) {
			this.landerElem.classList.add('firing');
		} else {
			this.landerElem.classList.remove('firing');
		}

		if (this.c.rcsThrottle < -0.1) {
			this.rcsLeftElem.classList.remove('firing');
			this.rcsRightElem.classList.add('firing');
		} else if (this.c.rcsThrottle > 0.1) {
			this.rcsLeftElem.classList.add('firing');
			this.rcsRightElem.classList.remove('firing');
		} else {
			this.rcsLeftElem.classList.remove('firing');
			this.rcsRightElem.classList.remove('firing');
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

	getRcsThrottle(c) {
		let forceToStop = this.getRotationalAccelerationToStop(c) * INERTIA / (HEIGHT / 2);

		if (Math.abs(c.th) > .04 && Math.abs(forceToStop) < RCS_THRUST) {
			return c.th > 0 ? -1 : 1;
		} else {
			return forceToStop / RCS_THRUST;
		}

	}

	getRotationalAccelerationToStop(c) {
		return c.vth * c.vth / (2 * c.th);
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
		{ title: 'Rotation (rad)', value: (c) => c.th },
		{ title: 'Rotational Velocity (rad/s)', value: (c) => c.vth },
		{ title: 'Rotational Acceleration (rad/s^2)', value: (c) => c.ath },
		{ title: 'Height (m)', value: (c) => c.y },
		{ title: 'Velocity (m/s)', value: (c) => c.vy },
		{ title: 'Acceleration (m/s^2)', value: (c) => c.exploded ? undefined: c.ay }
		// { title: 'Requested Throttle Position', value: (c) => c.requestedThrottle },
		// { title: 'Throttle Position', value: (c) => c.throttle }
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
