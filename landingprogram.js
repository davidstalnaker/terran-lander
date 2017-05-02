class LandingProgram {
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
		c.rotAToStop = this.getRotationalAccelerationToStop(c);
		let forceToStop = this.getRotationalAccelerationToStop(c) * INERTIA / (HEIGHT / 2);

		if (Math.abs(c.th) < 0.01 && Math.abs(c.vth) < 0.01) {
			return 0;
		} else if (Math.abs(forceToStop) < RCS_THRUST) {
			return c.th > 0 ? -1 : 1;
		} else {
			return c.vth < 0 ? 1 : -1;
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