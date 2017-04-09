const WORLD_HEIGHT = 200;
const MAX_THRUST = .2;
const MASS = 1;

class Lander {
	constructor(elem) {
		this.elem = elem;
		this.x = 0;
		this.y = 500;
		this.vx = 0;
		this.vy = -10;
		this.exploded = false;
	}

	step() {
		let a = this.getAccelerationGravity() + Math.min(this.getAccelerationEngines(), MAX_THRUST * MASS);
		console.log([this.y, this.vy, a, this.getAccelerationToStop()]);
		if (this.exploded || a > 100) {
			this.exploded = true;
			this.y = 0;
			this.vy = 0;
			this.vx = 0;
		} else {
			this.vy += a;
			this.y = this.y + this.vy;
			this.x = this.x + this.vx;
			if (a == 0 && Math.abs(this.vy) < .01) {
				this.vy = 0;
			}
		}
		this.redraw();
	}

	getAccelerationGravity() {
		if (this.y < .01) {
			if (this.y < -.01 && this.vy < -.01) {
				return 1000;
			} else {
				return 0;
			}
		} else {
			return -.1;
		}
	}

	getAccelerationEngines() {
		if (this.vy > .01 || this.y < .01) {
			this.firing = false;
			return 0;
		}

		const maxA = MAX_THRUST * MASS;
		if (!this.firing) {
			if (this.getAccelerationToStop() > maxA * .9 -.1) {
				this.firing = true;
				return this.getAccelerationToStop() +.1;
			} else {
				return 0;
			}
		} else {
			return this.getAccelerationToStop() +.1;
		}
	}

	getAccelerationToStop() {
		return this.vy * this.vy / (2 * this.y);
	}

	redraw() {
		const worldHeightPx = this.elem.parentElement.clientHeight;
		const worldWidthPx = this.elem.parentElement.clientWidth;
		const scalingFactor = worldHeightPx / WORLD_HEIGHT;
		const worldWidth = worldWidthPx / scalingFactor;
		this.elem.style.bottom = worldHeightPx - (WORLD_HEIGHT - this.y) / WORLD_HEIGHT * worldHeightPx;
		this.elem.style.left = worldWidthPx * 0.5 + scalingFactor * this.x;
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

	window.setInterval(() => l.step(), 33);

};