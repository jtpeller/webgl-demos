// webgl variables
var canvas;
var gl;

// arrays
var vertices = [];      // vertices for shapes
var colors = [];    // color for each vertex.

// explosion variables
var explodeFactor = 0.5;
var loc;
var delay = 20;             // redraw rate


// PROGRAM START
window.onload = function init() {
    // setup webgl
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // define the object
    vertices = [
        // heptagram
        vec2( 0.00,  0.00 ),    // fixed pt for the fan
        vec2( 0.00,  0.50 ),    // pt 1
        vec2( 0.15,  0.30 ),    // pt 2
        vec2( 0.40,  0.30 ),    // pt 3
        vec2( 0.35,  0.05 ),    // pt 4
        vec2( 0.50, -0.15 ),    // pt 5
        vec2( 0.30, -0.25 ),    // pt 6
        vec2( 0.25, -0.48 ),    // pt 7
        vec2( 0.00, -0.35 ),    // pt 8
        vec2(-0.25, -0.48 ),    // pt 9
        vec2(-0.30, -0.25 ),    // pt 10
        vec2(-0.50, -0.15 ),    // pt 11
        vec2(-0.35,  0.05 ),    // pt 12
        vec2(-0.40,  0.30 ),    // pt 13
        vec2(-0.15,  0.30 ),    // pt 14
        vec2( 0.00,  0.50 ),    // pt 15

        // outer parts
        // part 1
        vec2( 0.00,  0.50 ),    // pt 16
        vec2( 0.15,  0.30 ),    // pt 17
        vec2( 0.40,  0.30 ),    // pt 18
        
        // part 2
        vec2( 0.40,  0.30 ),    // pt 19
        vec2( 0.35,  0.05 ),    // pt 20
        vec2( 0.50, -0.15 ),    // pt 21

        // part 3
        vec2( 0.50, -0.15 ),    // pt 22
        vec2( 0.30, -0.25 ),    // pt 23
        vec2( 0.25, -0.48 ),    // pt 24
        
        // part 4
        vec2( 0.25, -0.48 ),    // pt 25
        vec2( 0.00, -0.35 ),    // pt 26
        vec2(-0.25, -0.48 ),    // pt 27
        
        // part 5
        vec2(-0.25, -0.48 ),    // pt 28
        vec2(-0.30, -0.25 ),    // pt 29
        vec2(-0.50, -0.15 ),    // pt 30
        
        // part 6
        vec2(-0.50, -0.15 ),    // pt 31
        vec2(-0.35,  0.05 ),    // pt 32
        vec2(-0.40,  0.30 ),    // pt 33
        
        // part 7
        vec2(-0.40,  0.30 ),    // pt 34
        vec2(-0.15,  0.30 ),    // pt 35
        vec2( 0.00,  0.50 ),    // pt 36
    ];
    var core_count = 16;

    // colors
    for (var i = 0; i < core_count; i++) {
        colors.push(vec3(0.0, 0.0, 0.0));
    };

    // part 1 is red
    for (var i = core_count; i < core_count + 3; i++) {
        colors.push(vec3(1.0, 0.0, 0.0));
    }

    // part 2 is orange
    for (var i = core_count + 3; i < core_count + 6; i++) {
        colors.push(vec3(1.0, 0.5, 0.0));
    }

    // part 3 is yellow
    for (var i = core_count + 6; i < core_count + 9; i++) {
        colors.push(vec3(1.0, 1.0, 0.0));
    }

    // part 4 is green
    for (var i = core_count + 9; i < core_count + 12; i++) {
        colors.push(vec3(0.0, 1.0, 0.0));
    }

    // part 5 is cyan
    for (var i = core_count + 12; i < core_count + 15; i++) {
        colors.push(vec3(0.0, 1.0, 1.0));
    }

    // part 6 is blue
    for (var i = core_count + 15; i < core_count + 18; i++) {
        colors.push(vec3(0.0, 0.0, 1.0));
    }

    // part 7 is purple
    for (var i = core_count + 18; i < core_count + 21; i++) {
        colors.push(vec3(1.0, 0.0, 1.0));
    }
    /* total colors: 8, 1 per part, and 1 for the core */

    // log vertices & colors
    //console.log("Input vertices and colors:");
    //console.log("vertices", vertices);
    //console.log("colors", colors);

    // webgl configs
    gl.viewport(0, 0, canvas.width, canvas.height); // set viewport
    gl.clearColor(1.0, 1.0, 1.0, 1.0);              // white bkgd

    // Define shaders to use  
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // load buffers for GPU
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    // color pointer
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // vertex buffer
    var vbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // vertex variable
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // explode factor location
    loc = gl.getUniformLocation(program, 'explodeFactor');

    render();
};

// render loop
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);    // clear the screen 

    // heptagram
    gl.uniform1f(loc, 0.5);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 16);

    // render the triangles
    gl.uniform1f(loc, explodeFactor);
    gl.drawArrays( gl.TRIANGLES, 16, 21);

    explodeFactor += 0.004; // increment the factor for next iteration
    console.log("explodeFactor", explodeFactor);

    // re-render after delay
    requestAnimFrame(render);

    // reset explode factor if it's greater than some max value
    if (explodeFactor > 1.65) {
        explodeFactor = 0.5;
    }
}
