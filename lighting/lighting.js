// =================================================================
// = script.js
// =  Description   : handles the webgl stuff
// =================================================================

/** GLOBALS **/
// webgl context
var canvas;         // canvas element
var gl;             // gl context

// webgl programs
var program;		// shader programs

// UI elements
var elem = {
	cylbtn: null,
	custombtn: null,
	matbtn1: null,      // turquoise btn
	matbtn2: null,      // jade btn
	shiny: null,        // shininess slider
	lightbtn1: null,    // white light 
	lightbtn2: null,    // purple light
	lightbtn3: null,    // toggle light to eye
	rotatelight: null,	// rotate light bonus
	fov: null,          // fov slider
}

// geometry
var cylinder;   // cylinder SOR
var custom;     // my custom SOR
var shape;      // which shape is currently selected

// material values
var turquoise = {
	ambient: vec4(0.1, 0.18725, 0.1745, 1.0),
	diffuse: vec4(0.396, 0.74151, 0.69102, 1.0),
	specular: vec4(0.297254, 0.30829, 0.306678, 1.0),
	shininess: 10
};

var jade = {
	ambient: vec4(0.135, 0.2225, 0.1575, 1.0),
	diffuse: vec4(0.54, 0.89, 0.63, 1.0),
	specular: vec4(0.316228, 0.316228, 0.316228, 1.0),
	shininess: 10
};

var material = turquoise;     // which material is currently selected

// lighting
var lightateye = false;         // whether or not the light is at the eye
const eyelight = vec4(0.0, 0.0, 0.0, 0.0);
const defaultlight = vec4(2.0, 0.0, 1.0, 1.0);

var light1 = {          // white light
	position: defaultlight,
	ambient: vec4(1.0, 1.0, 1.0, 1.0),
	diffuse: vec4(1.0, 1.0, 1.0, 1.0),
	specular: vec4(1.0, 1.0, 1.0, 1.0),
}

var light2 = {          // purple light
	position: defaultlight,
	ambient: vec4(1.0, 0.0, 1.0, 1.0),
	diffuse: vec4(1.0, 1.0, 1.0, 1.0),
	specular: vec4(1.0, 1.0, 1.0, 1.0),
}
var light = light1;      // which light is currently selected

// perspective() parameters
var persp = {
	fov: 60.0,         // controlled by the slider
	aspect: 1.0,       // aspect ratio
	near: 0.1,         // near plane
	far: 10,           // far plane
};

// matrices
var mvmat, projmat;
var product;            // current product obj

// webgl uniform locations
var loc = {
	mv: null,           // modelViewMatrix
	proj: null,         // projectionMatrix
	ambient: null,      // ambientProduct
	diffuse: null,      // diffuseProduct
	specular: null,     // specularProduct
	light: null,        // lightPosition
	shiny: null,        // shininess
}

// webgl buffers
var buf = {
	nbuf: null,         // normals' buffer
	vnorm: null,        // vNormal in glsl
	vbuf: null,         // vertex buffer  
	vpos: null,         // vPosition in glsl
	ibuf: null,         // indices buffer
	// ibuf doesn't need a ipos bc it is used when doing
	// drawElements
}

// from mousy.js
var mouse = {
	prevX: 0,
	prevY: 0,

	leftDown: false,
	rightDown: false,
};

var viewer = {
	eye: vec3(0.0, 0.0, 3.0),
	at: vec3(0.0, 0.0, 0.0),
	up: vec3(0.0, 1.0, 0.0),

	// for moving around object; set vals so at origin
	radius: null,
	theta: 0,
	phi: 0
};
// end of vars from mousy.js

/* BONUS #1 VARIABLES */
var rotating = false;		// light is not rotating
var lighttheta = 0;			// light rotation angle
var lightthetastep = 0.05;	// how much to rotate each step

// ============================================== INITIALIZE WEBGL
window.onload = function init() {
	console.info(`trace: init()`)

	// context and other setup
	canvas = document.getElementById('gl-canvas');
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert('WebGL is unavailable');
		return; // do nothing else if gl is undef
	}

	// set up elements
	elem.cylbtn = document.querySelector('#cyl-btn');
	elem.custombtn = document.querySelector('#custom-btn');
	elem.matbtn1 = document.querySelector('#mat1-btn');
	elem.matbtn2 = document.querySelector('#mat2-btn');
	elem.shiny = document.querySelector('#shiny-slider');
	elem.lightbtn1 = document.querySelector('#light1-btn');
	elem.lightbtn2 = document.querySelector('#light2-btn');
	elem.lightbtn3 = document.querySelector('#light3-btn');
	elem.fov = document.querySelector('#fov-slider');
	elem.fov.value = persp.fov;

	// bonus elements
	elem.rotatelight = document.querySelector('#rotate-btn');

	// gl context attributes
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.12, 0.12, 0.15, 1.0);  // white bkgd color
	gl.enable(gl.DEPTH_TEST);

	// init aspect, radius, etc.
	persp.aspect = canvas.width / canvas.height;

	//
	// load shaders and init attr buffers
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// get uniform locations
	loc.mv = gl.getUniformLocation(program, "modelViewMatrix");
	loc.proj = gl.getUniformLocation(program, "projectionMatrix");
	loc.ambient = gl.getUniformLocation(program, "ambientProduct");
	loc.diffuse = gl.getUniformLocation(program, "diffuseProduct");
	loc.specular = gl.getUniformLocation(program, "specularProduct");
	loc.light = gl.getUniformLocation(program, "lightPosition");
	loc.shiny = gl.getUniformLocation(program, "shininess");

	// create geometry for cylinder
	cylinder = surfaceGenerator(generatrixCylinder, derivativeCylinder, -1, 1);
    console.log(cylinder.indices);
	
	// create geometry for my custom shape
	// i use 0.905 instead of 1 to cut off a bit of weird geometry.
	custom = surfaceGenerator(generatrixCustom, derivativeCustom, -1, .905);
	
	shape = cylinder;           // default to cylinder

	// initialize buffers
	buf.nbuf = gl.createBuffer();       // normals buffer
	buf.vnorm = gl.getAttribLocation(program, 'vNormal'); // where normals are stored
	buf.vbuf = gl.createBuffer();       // vertices buffer
	buf.vpos = gl.getAttribLocation(program, 'vPosition');  // where verts are stored.
	buf.ibuf = gl.createBuffer();       // indices buffer
	
	// set each of the proper shape/material/light
	setShape(shape);
	setMat(material);
	setLight(light);

	// print to console requirements
	console.log(`cylinder minmax box: ${cylinder.minmax*2}, 2, ${cylinder.minmax*2}`);
	console.log(`custom minmax box: ${custom.minmax*2}, 2, ${custom.minmax*2}`);
	console.log(`initial eye/at/up: eye: ${viewer.eye}, at: ${viewer.at}, up: ${viewer.up}`)
	console.log(`initial persp args: fov: ${persp.fov}, aspect: ${persp.aspect}, near: ${persp.near}, far: ${persp.far}`)
	console.log(`initial light pos: ${light.position}`)

	// event listeners
	initListeners();

	console.info(`trace: leaving init(), beginning render() loop`)
	render();
}

/**
 * render() -- renders the shapes appropriately
 */
function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// rotate the light
	if (rotating) {
		// compute a rotation matrix
		roty = rotateY(0.5);	// change by .5 each time
		light.position = multMatrixByVector(roty, light.position);
	}
	
	// compute the matrices
	mvmat = lookAt(viewer.eye, viewer.at, viewer.up);
	projmat = perspective(persp.fov, persp.aspect, persp.near, persp.far);

	// send in the matrices
	gl.uniformMatrix4fv(loc.mv, false, flatten(mvmat));
	gl.uniformMatrix4fv(loc.proj, false, flatten(projmat));

	// send in light stuff
	gl.uniform4fv(loc.light, light.position)
	gl.uniform1f(loc.shininess, elem.shiny.value);

	// draw the elements
	gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
	
	// establish drawing loop
	requestAnimFrame(render);
}


/**
 * setShape() -- sets which shape is being displayed
 */
function setShape(newshape) {
	// update globals
	shape = newshape;
	minmax = shape.minmax;

	// update normals
	gl.bindBuffer(gl.ARRAY_BUFFER, buf.nbuf);
	gl.vertexAttribPointer(buf.vnorm, 4, gl.FLOAT, true, 0, 0);
	gl.enableVertexAttribArray(buf.vnorm);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(shape.normals), gl.STATIC_DRAW);

	// update vertices
	gl.bindBuffer(gl.ARRAY_BUFFER, buf.vbuf);
	gl.vertexAttribPointer(buf.vpos, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(buf.vpos);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(shape.vertices), gl.STATIC_DRAW);

	// update indices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.ibuf);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(shape.indices)), gl.STATIC_DRAW);

	// compute a new viewer
	viewer.radius = 3.0*minmax
	viewer.eye = vec3(0.0, 0.0, viewer.radius);
}

/**
 * setMat() -- callback when the user changes the material
 *  
 */
function setMat(mat) {
	material = mat;
	product = computeProduct(material, light);
	sendProperties(product);
}

/**
 * setLight() -- callback when the user changes the light
 */
function setLight(color) {
	light = color;
	product = computeProduct(material, light);
	sendProperties(product);
}

/**
 * sendProperties() -- sends in the ambient/diffuse/specular
 *  properties to the gl context (as well as shininess).
 *  it also updates the shininess slider
 */
function sendProperties(prod) {
	gl.uniform4fv(loc.ambient, flatten(prod.ambient))
	gl.uniform4fv(loc.diffuse, flatten(prod.diffuse))
	gl.uniform4fv(loc.specular, flatten(prod.specular))
	gl.uniform1f(loc.shiny, prod.shininess);
	elem.shiny.value = prod.shininess;  // for when the material is updated
}

/**
 * computeProduct() -- computes the product for the given
 *  material and light
 */
function computeProduct(mat, light) {
	var result = {
		ambient: null,
		diffuse: null,
		specular: null,
		shininess: null
	}

	result.ambient = mult(mat.ambient, light.ambient);
	result.diffuse = mult(mat.diffuse, light.diffuse);
	result.specular = mult(mat.specular, light.specular);
	result.shininess = mat.shininess;   // update shininess of product

	return result;
}

function initListeners() {
	console.info(`trace: initListeners()`)

	/* mouse listeners */

	// on onmousedown event
	// check if left/right button not already down
	// if just pressed, flag event with mouse.leftdown/rightdown and stores current mouse location
	canvas.onmousedown = function (event) {
		//console.info(`trace: mouse down event occurred`);
		if (event.button == 0 && !mouse.leftDown) {
			mouse.leftDown = true;
			mouse.prevX = event.clientX;
			mouse.prevY = event.clientY;
		} else if (event.button == 2 && !mouse.rightDown) {
			mouse.rightDown = true;
			mouse.prevX = event.clientX;
			mouse.prevY = event.clientY;
		}
	};

	// onmouseup event
	// set flag for left or right mouse button to indicate that mouse is now up
	canvas.onmouseup = function (event) {
		//console.info(`trace: mouse up event occurred`);
		// Mouse is now up
		if (event.button == 0) {
			mouse.leftDown = false;
		} else if (event.button == 2) {
			mouse.rightDown = false;
		}
	};

	// onmouseleave event
	// if mouse leaves canvas, then set flags to indicate that mouse button no longer down.
	// This might not actually be the case, but it keeps input from the mouse when outside of app
	// from being recorded/used.
	// (When re-entering canvas, must re-click mouse button.)
	canvas.onmouseleave = function () {
	   // console.info(`trace: mouseleave event occurred`);
		// Mouse is now up
		mouse.leftDown = false;
		mouse.rightDown = false;
	};

	// onmousemove event
	// Move the camera based on mouse movement.
	// Record the change in the mouse location
	// If left mouse down, move the eye around the object based on this change
	// If right mouse down, move the eye closer/farther to zoom
	// If changes to eye made, then update modelview matrix
	canvas.onmousemove = function (event) {
		// only record changes if mouse button down
		if (mouse.leftDown || mouse.rightDown) {
			// Get changes in x and y at this point in time
			var currentX = event.clientX;
			var currentY = event.clientY;

			// calculate change since last record
			var deltaX = event.clientX - mouse.prevX;
			var deltaY = event.clientY - mouse.prevY;

			// Compute camera rotation on left click and drag
			if (mouse.leftDown) {
				// Perform rotation of the camera
				if (viewer.up[1] > 0) {
					viewer.theta -= 0.01 * deltaX;
					viewer.phi -= 0.01 * deltaY;
				} else {
					viewer.theta += 0.01 * deltaX;
					viewer.phi -= 0.01 * deltaY;
				}

				// Wrap the angles
				var twoPi = 6.28318530718;
				if (viewer.theta > twoPi) {
					viewer.theta -= twoPi;
				} else if (viewer.theta < 0) {
					viewer.theta += twoPi;
				}
				if (viewer.phi > twoPi) {
					viewer.phi -= twoPi;
				} else if (viewer.phi < 0) {
					viewer.phi += twoPi;
				}
			} else if (mouse.rightDown) {
				// Perform zooming; don't get too close           
				viewer.radius -= 0.01 * deltaX;
				viewer.radius = Math.max(0.1, viewer.radius);
			}

			// Recompute eye and up for camera
			var threePiOver2 = 4.71238898;
			var piOver2 = 1.57079632679;

			// pre-compute this value
			var r = viewer.radius * Math.sin(viewer.phi + piOver2);

			// eye on sphere with north pole at (0,1,0)
			// assume user init theta = phi = 0, so initialize to pi/2 for "better" view
			viewer.eye = vec3(r * Math.cos(viewer.theta + piOver2), viewer.radius * Math.cos(viewer.phi + piOver2), r * Math.sin(viewer.theta + piOver2));

			//add vector (at - origin) to move 
			for (k = 0; k < 3; k++)
				viewer.eye[k] = viewer.eye[k] + viewer.at[k];

			// modify the up vector
			// flip the up vector to maintain line of sight cross product up to be to the right
			// true angle is phi + pi/2, so condition is if angle < 0 or > pi

			if (viewer.phi < piOver2 || viewer.phi > threePiOver2) {
				viewer.up = vec3(0.0, 1.0, 0.0);
			} else {
				viewer.up = vec3(0.0, -1.0, 0.0);
			}

			// Recompute the view
			//console.log(viewer);
			mvmat = lookAt(vec3(viewer.eye), viewer.at, viewer.up);

			mouse.prevX = currentX;
			mouse.prevY = currentY;
		} // end if button down

	};
	/* end of mouse listeners */

	// cylinder button
	elem.cylbtn.onclick = function() {
		console.info(`trace: cylbtn callback`);
		setShape(cylinder);
	}

	// custom button
	elem.custombtn.onclick = function() {
		console.info(`trace: custombtn callback`);
		setShape(custom);
	}

	// material 1 (turquoise) button
	elem.matbtn1.onclick = function() {
		console.info(`trace: matbtn1 (turquoise) callback`);
		setMat(turquoise);
	}

	// material 2 (turquoise) button
	elem.matbtn2.onclick = function() {
		console.info(`trace: matbtn2 (jade) callback`);
		setMat(jade)
	}

	// light button 1 (white light) button
	elem.lightbtn1.onclick = function() {
		console.info(`trace: lightbtn1 (white) callback`);
		setLight(light1);
	}

	// light button 2 (purple light) button
	elem.lightbtn2.onclick = function() {
		console.info(`trace: lightbtn2 (purple) callback`);
		setLight(light2);
	}

	// light button 3 (light @ eye) button
	elem.lightbtn3.onclick = function() {
		if (lightateye) {   // move light away from eye
			console.info(`trace: moving light away from eye`);
			light1.position = defaultlight;
			light2.position = defaultlight;
			light.position = defaultlight;
			lightateye = false;     // light no longer at eye
		} else {            // move light to eye
			console.info(`trace: moving light to eye`);
			light1.position = eyelight;
			light2.position = eyelight;
			light.position = eyelight;
			lightateye = true;      // light now at eye
		}
		
	}

	// shininess listener
	elem.shiny.oninput = function() {
		product.shininess = elem.shiny.value;
		console.log('product shininess', product.shininess);
	}

	// fov listener
	elem.fov.oninput = function() {
		persp.fov = elem.fov.value;
		// perspective projection will be recomputed in render
	}

	// rotate light
	elem.rotatelight.onclick = function() {
		console.info(`trace: rotate light callback`);

		// we can only rotate if the light is not at eye
		if (rotating == false && lightateye == false) {
			rotating = true;
		} else {		// otherwise, reset
			rotating = false;
			if (lightateye) {
				light1.position = eyelight;
				light2.position = eyelight;
				light.position = eyelight;
			} else {
				light1.position = defaultlight;
				light2.position = defaultlight;
				light.position = defaultlight;
			}
		}
	}
	
	console.info(`trace: leaving initListeners()`)
}