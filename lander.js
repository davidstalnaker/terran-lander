const SCALING_FACTOR = 1; // Pixels / Meter
const MAX_THRUST = 750000; // Newtons
const MASS = 25000; // Kilograms

class Lander {
	constructor(elem) {
		this.elem = elem;
		this.x = 0;
		this.y = 1000; // Meters
		this.vx = 0;
		this.vy = -200;
		this.exploded = false;
	}

	step(timestep) {
		let a = this.getAccelerationGravity() + Math.max(Math.min(this.getAccelerationEngines(), MAX_THRUST / MASS), 0)
		console.log([timestep, this.y, this.vy, a, this.getAccelerationToStop()]);
		if (this.exploded || a > 100) {
			this.exploded = true;
			this.y = 0;
			this.vy = 0;
			this.vx = 0;
		} else {
			this.vy += a * timestep / 1000;
			this.y = this.y + this.vy * timestep / 1000;
			this.x = this.x + this.vx * timestep / 1000;
			if (a == 0 && this.y < .01 && Math.abs(this.vy) < 1) {
				this.vy = 0;
				this.y = 0;
			}
		}
		this.redraw();
	}

	getAccelerationGravity() {
		if (this.y < .01) {
			if (this.vy < -1) {
				return 1000;
			} else {
				return 0;
			}
		} else {
			return -9.8;
		}
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
			return this.getAccelerationToStop() + 9.8;
		}
	}

	getAccelerationToStop() {
		return this.vy * this.vy / (2 * this.y);
	}

	redraw() {
		const worldHeightPx = this.elem.parentElement.clientHeight;
		const worldWidthPx = this.elem.parentElement.clientWidth;
		const worldHeight = worldHeightPx / SCALING_FACTOR;
		const worldWidth = worldWidthPx / SCALING_FACTOR;
		this.elem.style.bottom = worldHeightPx - (worldHeight - this.y) / worldHeight * worldHeightPx;
		this.elem.style.left = worldWidthPx * 0.5 + SCALING_FACTOR * this.x;
		if (this.exploded) {
			this.elem.classList.add('exploded');
		}

		if (this.firing) {
			this.elem.classList.add('firing');
		} else {
			this.elem.classList.remove('firing');
		}
	}
}

window.onload = () => {
	let l = new Lander(document.querySelector('.lander'));

	let startTime = (new Date()).getTime();
	let lastFrameTime = startTime;
	let i = window.setInterval(() => {
		currentTime = (new Date()).getTime();
		timeStep = currentTime - lastFrameTime;
		lastFrameTime = currentTime;
		if (!l.exploded && l.y != 0) {
			l.step(timeStep);
		} else {
			window.clearInterval(i);
		}
	}, 33);

};