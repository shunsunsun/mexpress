var anova = function(x) {
	// Perform an ANOVA.
	// The input object 'x' should be an array (groups/samples) of arrays (data points).
	if (!Array.isArray(x)) {
		return false;
	}
	var subArrayTest = x.map(function(x) {
		return Array.isArray(x);
	});
	if (!subArrayTest.every(function(x) { return x; })) {
		return false;
	}
	
	var m = x.length;
	var n = x.reduce(function(accumulator, currentValue) {
		return accumulator + currentValue.length;
	}, 0);
	var df1 = m - 1;
	var df2 = n - 1;
	var f = fStatistic(x, m, n);
	var p = fDistribution(f, df1, df2);
	return p;
};

var countNull = function(x) {
	var nullCount = 0;
	for (var i = 0; i < x.length; i++) {
		if (x[i] === null | x[i] === 'null') {
			nullCount += 1;
		}
	}
	return nullCount;
};

var degreesOfFreedom = function(x, y) {
	// Calculate the number of degrees of freedom using Welch's formula.
	var nx = x.length;
	var ny = y.length;
	var xVar = variance(x);
	var yVar = variance(y);
	var numerator = Math.pow((xVar / nx + yVar / ny), 2);
	var denominator = (Math.pow(xVar / nx, 2) / (nx - 1)) + (Math.pow(yVar / ny, 2) / (ny - 1));
	var df = numerator / denominator;
	return df;	
};

var fDistribution = function(f, df1, df2) {
	// Calculate a p value based on:
	// - a number of degrees of freedom
	// - an F statistic
	// - the F distribution.
	// The p value is calculated using a numerical approximation:
	// Abramowitz, M and Stegun, I. A. (1970), Handbook of Mathematical
	// Functions With Formulas, Graphs, and Mathematical Tables, NBS Applied
	// Mathematics Series 55, National Bureau of Standards, Washington, DC.
	// p 932: function 26.2.19
	// p 949: function 26.6.13
	var a1 = 0.049867347;
	var a2 = 0.0211410061;
	var a3 = 0.0032776263;
	var a4 = 0.0000380036;
	var a5 = 0.0000488906;
	var a6 = 0.000005383;
	var x = (f - (df2 / (df2 - 2))) /
			((df2 / (df2 - 2)) * Math.sqrt((2 * (df1 + df2 - 2)) / (df1 * (df2 - 4))));
	var p = 2 * (1 / (2 * Math.pow(1 + a1 * x + a2 * Math.pow(x, 2) + a3 * Math.pow(x, 3) +
		a4 * Math.pow(x, 4) + a5 * Math.pow(x, 5) + a6 * Math.pow(x, 6), 16)));
	return p;
};

var fStatistic = function(x, m, n) {
	// Calculate the F statistic for m samples and n data points.
	var means = x.map(function(x) {
		return mean(x);
	});
	var overallMean = mean(means);
	var sse = sumSquaredErrors(x);
	var sst = sumSquaredTreatment(overallMean, means);
	var mse = sse / (n - m);
	var mst = sst / (m - 1);
	var f = mst / mse;
	return f;
};

var isNumber = function(x) {
	return !isNaN(x);
};

var makeNumeric = function(x) {
	if (x === null) {
		return null;
	} else if (isNumber(x)) {
		return +x;
	} else {
		return null;
	}
};

var mean = function(x) {
	// Calculate the mean of an array of numeric values.
	x = x.map(makeNumeric);
	var n = x.length;
	var sum = 0;
	for (var i = 0; i < n; i++) {
		sum += +x[i];
	}
	var m = sum / n;
	return m;
};

var median = function(x) {
	// Calculate the median of an array of numeric values.
	return quantile(x, 0.5);
};

var pearsonCorrelation = function(x, y) {
	// Calculate the Pearson correlation coefficient between two arrays.
	var c;

	// Check if the arrays have the same length.
	if (x.length !== y.length) {
		return 'failed';
	}

	// Check if there are any missing values and remove them from both arrays if there are.
	var newX = [];
	var newY = [];
	for (c in y) {
		if (!isNaN(y[c]) && !isNaN(x[c])) {
			newY.push(+y[c]);
			newX.push(+x[c]);
		}
	}
	if (newY.length > 10) {
		// There are enough x and y values to calculate the correlation value.
		var n = newY.length;
		var xSum = 0;
		var ySum = 0;
		var xSquaredSum = 0;
		var ySquaredSum = 0;
		var xyProd = 0;
		for (c in newY) {
			xSum += newX[c];
			xSquaredSum += Math.pow(newX[c], 2);
			ySum += newY[c];
			ySquaredSum += Math.pow(newY[c], 2);
			xyProd += newX[c]*newY[c];
		}
		var numerator = xyProd - xSum*ySum / n;
		var denominator = Math.sqrt(xSquaredSum - Math.pow(xSum, 2) / n) *
			(Math.sqrt(ySquaredSum - Math.pow(ySum, 2) / n));
		var r = numerator / denominator;

		// Calculate the significance of the correlation value.
		// 1. Calculate the t statistic.
		var df = newY.length - 2;
		var t = Math.abs(r / (Math.sqrt((1 - Math.pow(r, 2)) / df)));

		// 2. Look up the p value in the t distribution.
		var p = tDistribution(df, t);
		return {
			r: r,
			p: p
		};
	} else {
		return 'failed';
	}	
};

var quantile = function(x, q) {
	// Calculate the q-th quantile of an array of numeric values.
	x = x.map(makeNumeric);
	x = x.sort(function(a,b) {
		return a - b;
	});
	if (x.length === 0) {
		return 0;
	}
	var position = (x.length - 1) * q;
	var base = Math.floor(position);
	var rest = position - base;
	if (x[base] !== undefined) {
		return x[base] + rest * (x[base + 1] - x[base]);
	} else {
		return x[base];
	}
};

var summary = function(x, addQuantile) {
	// Calculate the summary of an array of numeric values. This includes:
	// - minimum & maximum
	// - mean
	// - 25%, 50% (median) and 75% quantiles
	// - the number of null values
	var result = {
		'minimum': Math.min.apply(Math, x),
		'maximum': Math.max.apply(Math, x),
		'mean': mean(x),
		'median': median(x),
		'null': countNull(x)
	};
	if (addQuantile) {
		result['quantile 25%'] = quantile(x, 0.25);
		result['quantile 75%'] = quantile(x, 0.75);
	}
	return result;
};

var sumSquaredErrors = function(data) {
	var means = data.map(function(x) {
		return mean(x);
	});
	var se = [];
	for (var i=0; i < data.length; i++) {
		var seSample = data[i].map(function(x) {
			return Math.pow(x - means[i], 2);
		});
		seSample = seSample.reduce(function(accumulator, currentValue) {
			return accumulator + currentValue;
		}, 0);
		se.push(seSample);
	}
	var sse = se.reduce(function(accumulator, currentValue) {
		return accumulator + currentValue;
	}, 0);
	return sse;
};

var sumSquaredTreatment = function(overallMean, means) {
	var sst = means.reduce(function(accumulator, currentValue) {
		return accumulator + Math.pow(currentValue - overallMean, 2);
	}, 0);
	sst = sst * (means.length - 1);
	return sst;
};

var tDistribution = function(df, t) {
	// Calculate a p value based on:
	// - a number of degrees of freedom
	// - a t value
	// - the t distribution.
	// The p value is calculated using a numerical approximation:
	// Abramowitz, M and Stegun, I. A. (1970), Handbook of Mathematical
	// Functions With Formulas, Graphs, and Mathematical Tables, NBS Applied
	// Mathematics Series 55, National Bureau of Standards, Washington, DC.
	// p 932: function 26.2.19
	// p 949: function 26.7.8
	var a1 = 0.049867347;
	var a2 = 0.0211410061;
	var a3 = 0.0032776263;
	var a4 = 0.0000380036;
	var a5 = 0.0000488906;
	var a6 = 0.000005383;
	var x = t * (1 - 1 / (4 * df)) / Math.sqrt(1 + Math.pow(t, 2) / (2 * df));
	var p = 2 * (1 / (2 * Math.pow(1 + a1 * x + a2 * Math.pow(x, 2) + a3 * Math.pow(x, 3) +
		a4 * Math.pow(x, 4) + a5 * Math.pow(x, 5) + a6 * Math.pow(x, 6), 16)));
	return p;
};

var tTest = function(x, y) {
	// Perform a Welch's t-test.
	var c;

	// Remove missing values.
	x = x.filter(function(a) {
		return a !== null && a !== undefined;
	});
	y = y.filter(function(a) {
		return a !== null && a !== undefined;
	});
	var nx = x.length;
	var ny = y.length;
	if (nx >= 3 && ny >= 3) {
		var xMean = mean(x);
		var yMean = mean(y);
		var xVar = variance(x);
		var yVar = variance(y);
		var t = (xMean - yMean) / (Math.sqrt(xVar / nx + yVar / ny));
		t = Math.abs(t);
		var df = degreesOfFreedom(x, y);
		var answer = tDistribution(df, t);
		return answer;
	} else {
		return NaN;
	}
};

var variance = function(x) {
	// Calculate the variance of an array of numeric values.
	var n = x.length;
	var m = mean(x);
	var diff = 0;
	for (var i = 0; i < n; i++) {
		diff += Math.pow((x[i] - m), 2);
	}
	var v = diff / n;
	return v;
};
