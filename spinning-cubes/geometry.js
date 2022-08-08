// ============================================================================
// = geometry.js
// =  Description   : Create the cube and colors as in the "cube" program.
// ============================================================================

var points = [];
var colors = [];

// generates a cube with each side a different color
function colorCube() {
	quad(1, 0, 3, 2);
	quad(2, 3, 7, 6);
	quad(3, 0, 4, 7);
	quad(6, 5, 1, 2);
	quad(4, 5, 6, 7);
	quad(5, 4, 0, 1);
}

// creates a quadrilateral, and then builds the cube
// inside points
function quad(a, b, c, d) {
	var vertices = [
		vec3(-0.5, -0.5, 0.5),
		vec3(-0.5, 0.5, 0.5),
		vec3(0.5, 0.5, 0.5),
		vec3(0.5, -0.5, 0.5),
		vec3(-0.5, -0.5, -0.5),
		vec3(-0.5, 0.5, -0.5),
		vec3(0.5, 0.5, -0.5),
		vec3(0.5, -0.5, -0.5)
	];

	var vertexColors = [
		[0.0, 0.0, 0.0, 1.0],  // black
		[1.0, 0.0, 0.0, 1.0],  // red
		[1.0, 1.0, 0.0, 1.0],  // yellow
		[0.0, 1.0, 0.0, 1.0],  // green
		[0.0, 0.0, 1.0, 1.0],  // blue
		[1.0, 0.0, 1.0, 1.0],  // magenta
		[1.0, 0.6, 0.0, 1.0],  // orange (this one changed from white)
		[0.0, 1.0, 1.0, 1.0]   // cyan
	];

	var indices = [a, b, c, a, c, d];
	//console.log("indices = ", indices);

	for (var i = 0; i < indices.length; ++i) {
		points.push(vertices[indices[i]]);
		colors.push(vertexColors[a]);
	}
}
