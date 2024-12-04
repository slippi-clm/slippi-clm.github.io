try {
	const data = require('./data.json');
	if (!data.updatedAt) {
		throw "data has no updated at field";
	}
	const now = Date.now() / 1000;
	const sinceLast = (now - data.updatedAt) / 60;
	const isNotNum  = !Object.is(typeof sinceLast, 'number');
	const isBadNum  = sinceLast < 0;
	const isTooLong = sinceLast > 35;
	if (isNotNum || isBadNum || isTooLong) {
		process.exit(1);
	}
	process.exit();
} catch (e) {
	console.error(e);
	process.exit(1);
}
