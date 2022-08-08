// ============================================================================
// = CSE470 HW 2 -- Spinning Cubes
// =  Written by    : Jeremy Pellerino
// =  Date          : February 08, 2022
// =  Due           : February 28, 2022
// =  Description   : Primary js code file. Send the cube and colors to the GPU
// =                  once. Handles listeners, rendering, and more.
// ============================================================================

/** GLOBALS **/
// document/context variables
var canvas;         // canvas element
var gl;             // gl context
var slider;         // scaling slider
var checkbox;       // the checkbox for if rotate random randomizes angles and speeds
var counter;        // counts the number of cubes

// scaling n rotation stuff
var NumVertices = 36;   // number of vertices for the cube
var scale_factor;       // the scaling factor
var scale_matrix;       // the scaling matrix
var axis = [1, 1, 1];   // the axis of rotation for rotate()

/* LOCATION VARIABLES */
var thetaLoc;       // location of theta in glsl
var scaleLoc;       // location of scaling matrix in glsl
var offsetLoc;      // location of offset
var rotationLoc;    // location of rotation

/* iTH CUBE DATA */
var offset = [];    // offset[i] holds the x/y/z offsets of the ith cube
var angles = [];    // angles[i] holds just the rotation angle of the ith cube
var speeds = [];    // speeds[i] holds just the speed of the ith cube

window.onload = function init() {
	// get context values
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available"); }

	slider = document.getElementById("slider");
	slider.value = 10;

	checkbox = document.getElementById("checkbox");
	checkbox.checked = false;

    counter = document.getElementById("counter");

	colorCube();        // initializes points and colors

	// set some gl context stuff
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.enable(gl.DEPTH_TEST);


	//
	//  Load shaders and initialize attribute buffers
	//
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

    // get all uniform locations
	scaleLoc = gl.getUniformLocation(program, "smat");
	offsetLoc = gl.getUniformLocation(program, "offset");
	rotationLoc = gl.getUniformLocation(program, "rot");

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	// event listeners for buttons
	document.getElementById("x-button").onclick = function () {
		console.log("trace: user clicked Rotate x");
		axis = [1, 0, 0];
	};
	document.getElementById("y-button").onclick = function () {
		console.log("trace: user clicked Rotate y");
		axis = [0, 1, 0];
	};
	document.getElementById("z-button").onclick = function () {
		console.log("trace: user clicked Rotate z");
		axis = [0, 0, 1];
	};
	document.getElementById("r-button").onclick = function () {
		console.log("trace: user clicked Rotate random");
		if (checkbox.checked) {
			console.log("trace: checkbox is checked... randomizing speeds and angles!");
			for (var i = 0; i < angles.length; i++) {
				angles[i] = generateAngle();
				speeds[i] = generateSpeed();
			}
			console.log(
				"angles = ", angles, 
				"\nspeeds = ", speeds);
		}

		// generate axis
		axis = generateAxis();

		console.log("axis: ", axis);
	};
	document.getElementById("clear-button").onclick = function () {
		console.log("trace: cleared all cubes");
		offset = [];
		angles = [];
		speeds = [];
        counter.innerText = 0;
	}

	// event listener for the canvas
	canvas.addEventListener("mousedown", function (e) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

		// get where was clicked inside the canvas
        // using event is deprecated
        // clientX and clientY cause issues if the page is scrolled in any direction
        // using pageX and pageY fixes this scrolling issue.
		var screenx = e.pageX - canvas.offsetLeft;
		var screeny = e.pageY - canvas.offsetTop;

		var xpos = 2 * screenx / canvas.width - 1;
		var ypos = 2 * (canvas.height - screeny) / canvas.height - 1;

		// the z-coord of the cube's center is assigned via a random number
        // zpos has a range of [-0.5, 1] to avoid as many clips as possible.
		var zpos = Math.random() * 1.5 - 0.5;

		let t = vec3(xpos, ypos, zpos);

		// now, save the values
		speeds.push(generateSpeed());
		angles.push(generateAngle());
		offset.push(t);

		console.log("Canvas was clicked!",
			"\n offset = ", t,
			"\n angle  = ", angles[angles.length - 1],
			"\n speed  = ", speeds[speeds.length - 1]
		);

        // update the counter
        counter.innerText = +counter.innerText + 1;
	});

	// event listener for range slider
	slider.oninput = function () {
		scale_factor = slider.value / 100;
        scale_matrix = mat4(
            vec4(scale_factor, 0.0, 0.0, 0.0),
            vec4(0.0, scale_factor, 0.0, 0.0),
            vec4(0.0, 0.0, scale_factor, 0.0),
            vec4(0.0, 0.0, 0.0, 1.0)
        );
	};

	slider.oninput();	// force update to the value

	console.log("trace: about to call render() for the first time");
	render();
}

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// send the scaling matrix
	gl.uniformMatrix4fv(scaleLoc, false, flatten(scale_matrix));

	for (var i = 0; i < offset.length; i++) {
		// send the offset information in a loop
		gl.uniform3fv(offsetLoc, flatten(offset[i]));

		// send the rotation stuff
		// compute the rotation matrix from the angle in angles
		angles[i] += speeds[i];
		var rotmat = rotate(angles[i], axis);
		gl.uniformMatrix4fv(rotationLoc, false, flatten(rotmat))

		// signal for a draw
		gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
	}

	// request to draw again
	requestAnimFrame(render);
}

// generate angle in [0, 360]
function generateAngle() {
	return Math.random() * 360;
}

// generate a speed in [-1,1), used as the delta between frames
function generateSpeed() {
	return (Math.random() * 2 - 1);
}

// generate an axis
function generateAxis() {
	// this possible_axis array helps alleviate a problem on axis
	// if you pass axis=[0,0,0], then normalize will throw an error, thinking
	// that axis is of length 0. make sure to only generate from these values
	var newaxis = [
		1-Math.random(),		// interval (0,1] to avoid [0,0,0] axis
		1-Math.random(),
		1-Math.random(),
	];

	return newaxis;
}