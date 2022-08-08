// =================================================================
// = geometry.js
// =  Description   : handles the geometry
// =================================================================

// steps
var dt = 60;        // # points for each generatrix
var dtheta = 100;   // # evaluations around y-axis

// ============================================== SURFACE GENERATION
/**
 * surfaceGenerator() -- handles 'surface construction' as described
 *  in the assignment PDF. 
 * @param generatrix        f(t) for this SOR
 * @param derivative        f'(t) for this SOR
 */
function surfaceGenerator(generatrix, derivative, a, b) {
	let result = {
		// stuff from vertsAndNormals
		vertices: [],       // generated vertices
		normals: [],        // arr of normal vectors
		minmax: 0,
		// stuff from triangulation
		indices: [],            // triangulation indices
		triangleCount: 0,  // subdivisions
	}

	// compute vertices and normals
	var temp = vertsAndNormals(generatrix, derivative, a, b);
	result.vertices = temp.vertices;
	result.normals = temp.normals;
	result.minmax = temp.minmax;

	// now, compute the indices for the triangulation
	result.indices = triangulation(result.vertices);

	return result;
}

/**
 * vertsAndNormals() -- computes the normals and vertices for a given
 *  parametric geometry.
 * @param generatrix 	the generatrix function f(t)
 * @param derivative	derivative of f(t); f'(t)
 * @param a				starting point for t
 * @param b 			ending point for t
 */
function vertsAndNormals(generatrix, derivative, a, b) {
	let result = {
		vertices: [],   	// generated vertices
		normals: [],    	// arr of normal vectors
		minmax: 0       	// minmax for the given parametric geometry
	}

	// adjustable step sizes (for t and theta)
	var tstep = Math.abs(a-b)/dt;
	var thetastep = 360/dtheta;

	// loop thru t, where t is in the interval: [-1, 1]
	for (let t = a; t <= b; t += tstep) {
		var val = generatrix(t);

		// along the way, figure out the largest value
		// for a cylinder, this should always be 1.0
		result.minmax = Math.max(result.minmax, val);

		// this vector will be the vector to be moved thru theta
		var g = vec4(val, t, 0.0, 1.0);

		// now, loop thru theta, from 0 to 360 degrees
		for (let theta = 0; theta < 360; theta += thetastep) {
			var roty = rotateY(theta);        // rotation matrix
			var vertex = multMatrixByVector(roty, g);

			// compute normals
			var cos = Math.cos(radians(theta));     // cos(theta)
			var der = derivative(t);                // derivative
			var der2 = der == 0 ? 0 : -der          // eliminate negative zeros (thanks JS)
			var sin = Math.sin(radians(theta));     // sin(theta)
			var vector = vec4(cos, der2, sin, 0);   // vector to be normalized
			var normal = normalize(vector, true);   // exact unit normal

			// add everything to the results obj
			result.vertices.push(vertex);   // add calculated vertex
			result.normals.push(normal);    // add exact normal
		}
	}
	return result;
}

/**
 * triangulation() -- computes the triangulation indices
 */
function triangulation() {
	var indices = [];
	var makeTriangle = [1, 0, 2, 2, 1, 3];

	// loop thru every point
	for (let t = 0; t < dt; t++) { 
		for (let theta = 0; theta < dtheta; theta++) {
			// quad computes the indices for each of the vertices
			// of the triangles to be made
			let quad = [
				dtheta * (t)     +  theta,
				dtheta * (t)     + (theta + 1) % dtheta,
				dtheta * (t + 1) +  theta,
				dtheta * (t + 1) + (theta + 1) % dtheta
			]

			// add which indices go where
			for (let k = 0; k < makeTriangle.length; k++) {
				indices.push(quad[makeTriangle[k]])
			}
		}
	}

	return indices;
}

// ============================================== GEOMETRY FUNCTIONS
/**
 * generatrixCylinder() -- generates a cylinder.
 *  Note: this is f(t) for the cylinder
 *  f(t) = 1.0
 *  @param t		number in which to evaluate f at
 */
function generatrixCylinder(t) {
	return 1.0;
}

/**
 * derivativeCylinder() -- 'calculates' the derivative of the cylinder
 *  Derivative of a varant (1.0) is 0
 *  f'(t) = 0.0;
 *  @param t		number in which to evaluate f' at
 */
function derivativeCylinder(t) {
	return 0.0;
}

/**
 * generatrixCustom() -- generates my custom shape
 *  this is the f(t) for my custom SOR
 *  @param t		number in which to evaluate f at
 */
function generatrixCustom(t) {
	return Math.cos(Math.pow(t, 5)) - Math.sin(Math.pow(t, 5));
}

/**
 * derivativeCustom() -- computes the derivative of my custom SOR
 *  i.e. this computes f'(t)
 *  Equation calculated from wolfram alpha
 *  @param t		number in which to evaluate f' at
 */
function derivativeCustom(t) {
	return -5 * Math.pow(t, 4) * (Math.sin(Math.pow(t, 5)) + Math.cos(Math.pow(t, 5)));
}

// ============================================== GEOMETRY UTILS
/**
 * multMatrixByVector() -- handles multiplying a matrix by a vector
 */
function multMatrixByVector(matrix, vector) {
	let newVector = [];     // calculated result

	// loop over rows
	for (let i = 0; i < matrix.length; i++) {
		let newVectorValue = 0;     // start with 0 for the new value of each index

		// loop over the vector. vector.length must be equal to matrix.length
		for (let j = 0; j < vector.length; j++) {
			// value is the sum of the products of each value
			newVectorValue += matrix[i][j] * vector[j];
		}
		newVector.push(newVectorValue);
	}
	return newVector;
}
