const SCALING_FACTOR = 1; // Pixels / Meter
const MAX_THRUST = 750000; // Newtons
const MIN_THROTTLE = 0.6;
const RCS_THRUST = 75000; // Newtons 
const MASS = 25000; // Kilograms
const HEIGHT = 70; // Meters
const RADIUS = 1.85; // Meters
const INERTIA = MASS / 12 * (3 * RADIUS ** 2 + HEIGHT ** 2);

class Lander {
	constructor(landerElem, worldElem, landingProgram) {
		this.landerElem = landerElem;
		this.rcsLeftElem = landerElem.querySelector('.lander-rcs-left');
		this.rcsRightElem = landerElem.querySelector('.lander-rcs-right');
		this.worldElem = worldElem;
		this.landingProgram = landingProgram;
		this.log = [];
		this.c = {
			x: 0,
			y: 500,
			th: 1,
			vx: 0,
			vy: -50,
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
		let requestedThrottle = this.landingProgram.getThrottle(this.c);
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
		let throttle = this.getRotationalThrottle();
		this.c.rcsThrottle = throttle;
		let torque = throttle * RCS_THRUST * HEIGHT / 2;
		return torque / INERTIA;
	}

	getRotationalThrottle() {
		this.c.requestedRcsThrottle = this.landingProgram.getRcsThrottle(this.c);
		if (this.c.requestedRcsThrottle < -0.1) {
			return -1;
		} else if (this.c.requestedRcsThrottle > 0.1) {
			return 1;
		} else {
			return 0;
		}
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


