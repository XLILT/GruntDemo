class A {
	constructor() {
		this.a = 1;
	}

	f() {
		return 1;
	}

	static g() {
		return 2;
	}
};

A.B = 3;

module.exports = A;