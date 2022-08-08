// =================================================================
// = script.js
// =  Description   : implementation animation demo
// =  Author        : jtpeller
// =================================================================

// gl vars
var canvas;
var gl;
var program;

// matrices
var projmat;
var mvmat;
var instanceMatrix;

// locations
var mvMatrixLoc;
var projmatloc;
var colorLoc;
var modeloc;

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

// IDs
var torsoId = 0;
var headId = 1;
var head1Id = 1;
var head2Id = 10;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;

// dimensions
var torsoHeight = 5.0;
var torsoWidth = 3.0;
var upperArmHeight = 1.25;
var lowerArmHeight = 2.25;
var upperArmWidth = 1.0;
var lowerArmWidth = 1.0;
var upperLegWidth = 1.0;
var lowerLegWidth = 1.0;
var lowerLegHeight = 1.0;
var upperLegHeight = 2.75;
var headHeight = 2.0;
var headWidth = 2.0;

// colors
var torsoColor = vec4(0.0, 1.0, 1.0, 1.0);
var headColor = vec4(0.9, 0.7, 0.2, 1.0);
var upperArmColor = torsoColor;
var lowerArmColor = headColor;
var upperLegColor = vec4(0.0, 0.0, 1.0, 1.0);
var lowerLegColor = vec4(0.3, 0.3, 0.3, 1.0);
var groundColor = vec4(0.2, 1.0, 0.4, 1.0);

// gl attributes
var numNodes = 10;
var numAngles = 11;
var angle = 0;
var theta = [
    0,      // whole body
    0,      // head (up/down)
    180,    // upper left arm (shoulder)
    0,      // lower left arm (elbow)
    180,    // upper right arm
    0,      // lower right arm
    180,    // upper left leg
    0,      // lower left leg
    180,    // upper right leg
    0,      // lower right leg
    0       // head (neck, left/right)
];
var numVertices = 24;
var stack = [];
var vBuffer;

// init figure
var figure = [];
for (var i = 0; i < numNodes; i++) figure[i] = createNode(null, null, null, null);

var pointsArray = [];

// mouse interaction
var viewer = {
    eye: vec3(0.0, 0.0, 12.0),
    at: vec3(0.0, 0.0, 0.0),
    up: vec3(0.0, 1.0, 0.0),

    // for moving around object; set vals so at origin
    radius: 12,
    theta: 0,
    phi: 0
};

var mouse = {
    prevX: 0,
    prevY: 0,

    leftDown: false,
    rightDown: false,
};

// perspective
var persp = {
    fov: 90.0,         // controlled by the slider
    aspect: 1.0,       // aspect ratio
    near: 0.1,         // near plane
    far: 50,           // far plane
};

// texture stuff
var texSize = 256;
var numChecks = 4;
var image1;
var image2;
var texture1, texture2;
var texCoordsArray = [];
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

// animation stuff
var animate = false;
var countingDown = false;   // count up first
var maxkf = 120;    // maximum kf value
var kf = maxkf / 2;   // keyframe # (body starts 1/2way thru the anim)
var prevangle1 = 0; // previous angle used to map
var prevangle2 = 0; // previous angle used to map
var rngangle1 = 0;  // random angle chosen for head1
var rngangle2 = 0;  // random angle chosen for head2

// extra credit vars
var music;          // music audio tag
var volumeslider;   // controls volume of music
var seekslider;     // slider to control music
var seekInterval;   // updates the seek slider every second.
var currtime;       // displays current time next to seek slider
var totaltime;      // displays music duration next to seek slider
var fovslider;      // field of view slider
var gridslider;     // grid count (numChecks) slider

//-------------------------------------------

function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}

function initNodes(Id) {

    var m = mat4();

    switch (Id) {

        case torsoId:

            m = rotate(theta[torsoId], 0, 1, 0);
            figure[torsoId] = createNode(m, torso, null, headId);
            break;

        case headId:
        case head1Id:
        case head2Id:
            m = translate(0.0, torsoHeight, 0.0);
            m = mult(m, rotate(theta[head1Id], 1, 0, 0))
            m = mult(m, rotate(theta[head2Id], 0, 1, 0));
            figure[headId] = createNode(m, head, leftUpperArmId, null);
            break;


        case leftUpperArmId:
            m = translate(-(torsoWidth + upperArmWidth), 0.9 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[leftUpperArmId], 1, 0, 0));
            figure[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId);
            break;

        case rightUpperArmId:

            m = translate(torsoWidth + upperArmWidth, 0.9 * torsoHeight, 0.0);
            m = mult(m, rotate(theta[rightUpperArmId], 1, 0, 0));
            figure[rightUpperArmId] = createNode(m, rightUpperArm, leftUpperLegId, rightLowerArmId);
            break;

        case leftUpperLegId:

            m = translate(-(torsoWidth + upperLegWidth), 0.1 * upperLegHeight, 0.0);
            m = mult(m, rotate(theta[leftUpperLegId], 1, 0, 0));
            figure[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId);
            break;

        case rightUpperLegId:

            m = translate(torsoWidth + upperLegWidth, 0.1 * upperLegHeight, 0.0);
            m = mult(m, rotate(theta[rightUpperLegId], 1, 0, 0));
            figure[rightUpperLegId] = createNode(m, rightUpperLeg, null, rightLowerLegId);
            break;

        case leftLowerArmId:

            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(theta[leftLowerArmId], 1, 0, 0));
            figure[leftLowerArmId] = createNode(m, leftLowerArm, null, null);
            break;

        case rightLowerArmId:

            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(theta[rightLowerArmId], 1, 0, 0));
            figure[rightLowerArmId] = createNode(m, rightLowerArm, null, null);
            break;

        case leftLowerLegId:

            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(theta[leftLowerLegId], 1, 0, 0));
            figure[leftLowerLegId] = createNode(m, leftLowerLeg, null, null);
            break;

        case rightLowerLegId:

            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(theta[rightLowerLegId], 1, 0, 0));
            figure[rightLowerLegId] = createNode(m, rightLowerLeg, null, null);
            break;

    }

}

function traverse(Id) {
    if (Id == null) return;
    stack.push(mvmat);
    mvmat = mult(mvmat, figure[Id].transform);
    figure[Id].render();
    if (figure[Id].child != null) traverse(figure[Id].child);
    mvmat = stack.pop();
    if (figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {
    instanceMatrix = mult(mvmat, translate(0.0, 0.5 * torsoHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(torsoWidth, torsoHeight, torsoWidth / 2));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(torsoColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function head() {
    instanceMatrix = mult(mvmat, translate(0.0, 0.5 * headHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(headColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperArm() {
    instanceMatrix = mult(mvmat, translate(1.8, 0.5 * upperArmHeight - 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(upperArmColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerArm() {
    instanceMatrix = mult(mvmat, translate(1.8, 0.5 * lowerArmHeight - 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(lowerArmColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperArm() {
    instanceMatrix = mult(mvmat, translate(-1.8, 0.5 * upperArmHeight - 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(upperArmColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerArm() {
    instanceMatrix = mult(mvmat, translate(-1.8, 0.5 * lowerArmHeight - 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(lowerArmColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftUpperLeg() {
    instanceMatrix = mult(mvmat, translate(3.1, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(upperLegColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function leftLowerLeg() {
    instanceMatrix = mult(mvmat, translate(3.1, 0.5 * lowerLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(lowerLegColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightUpperLeg() {
    instanceMatrix = mult(mvmat, translate(-3.1, 0.5 * upperLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(upperLegColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

function rightLowerLeg() {
    instanceMatrix = mult(mvmat, translate(-3.1, 0.5 * lowerLegHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth))
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(lowerLegColor));
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);
}

// modified quad for texture mapping
function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    texCoordsArray.push(texCoord[3]);
}

function cube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

// code pulled from textureCubev4
function configureTexture() {
    // set up the images
    image1 = new Uint8Array(4 * texSize * texSize);
    image2 = new Uint8Array(4 * texSize * texSize);

    // checkerboard texture
    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j < texSize; j++) {
            var patchx = Math.floor(i / (texSize / numChecks));
            var patchy = Math.floor(j / (texSize / numChecks));
            if (patchx % 2 ^ patchy % 2) c = 255;
            else c = 128;       // this was modified for a better look
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image1[4 * i * texSize + 4 * j] = c;
            image1[4 * i * texSize + 4 * j + 1] = c;
            image1[4 * i * texSize + 4 * j + 2] = c;
            image1[4 * i * texSize + 4 * j + 3] = 255;
        }
    }

    // sine texture
    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j < texSize; j++) {
            image2[4 * i * texSize + 4 * j] = 127 + 127 * Math.sin(0.1 * i * j);
            image2[4 * i * texSize + 4 * j + 1] = 127 + 127 * Math.sin(0.1 * i * j);
            image2[4 * i * texSize + 4 * j + 2] = 127 + 127 * Math.sin(0.1 * i * j);
            image2[4 * i * texSize + 4 * j + 3] = 255;
        }
    }

    texture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

window.onload = function init() {
    // various inits to DOM
    speedslider = document.getElementById('speed-slider');
    speedslider.value = maxkf;

    music = document.getElementById('music');       // audio tag
    music.load();

    volumeslider = document.getElementById('volume-slider');
    volumeslider.value = volumeslider.max;

    seekslider = document.getElementById('seek-slider');
    seekslider.value = 0;

    currtime = document.getElementById('current-time');
    totaltime = document.getElementById('total-time');

    fovslider = document.getElementById('fov-slider');
    fovslider.value = persp.fov;
    gridslider = document.getElementById('grid-slider');
    gridslider.value = numChecks;

    // gl init
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.33, 0.7, 0.8, 1.0);  // color other than white/black
    gl.enable(gl.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // init matrices
    instanceMatrix = mat4();
    projmat = perspective(persp.fov, persp.aspect, persp.near, persp.far);
    mvmat = lookAt(viewer.eye, viewer.at, viewer.up);    // compute mv

    // init locations
    mvMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projmatloc = gl.getUniformLocation(program, "projectionMatrix")
    colorLoc = gl.getUniformLocation(program, "color");
    modeloc = gl.getUniformLocation(program, "mode")

    // send values
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(mvmat));
    gl.uniformMatrix4fv(projmatloc, false, flatten(projmat));
    gl.uniform4fv(colorLoc, flatten(torsoColor));

    cube();

    // init vbuffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // initialize listeners
    initListeners();

    for (i = 0; i < numNodes; i++)
        initNodes(i);

    // init textures
    initTextures();

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    projmat = perspective(persp.fov, persp.aspect, persp.near, persp.far);
    gl.uniformMatrix4fv(projmatloc, false, flatten(projmat));

    // animate
    if (animate) {
        animatefigure();
    }

    // draw
    gl.uniform1i(modeloc, 1);
    traverse(torsoId);

    // ground plane
    instanceMatrix = mult(mvmat, translate(0.0, -0.5 * (torsoHeight + upperLegHeight + lowerLegHeight) + 0.5, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(20, 1, 20));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform4fv(colorLoc, flatten(groundColor));
    gl.uniform1i(modeloc, 2);
    for (var i = 0; i < 6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4);

    requestAnimFrame(render);
}

function initTextures() {
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configureTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(gl.getUniformLocation(program, "Tex0"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(gl.getUniformLocation(program, "Tex1"), 1);
}

function initListeners() {
    /* ANIMATION LISTENERS */

    // play button
    document.getElementById('play-anim').onclick = function () {
        console.info('playing animation');
        animate = true;
    }

    // pause button
    document.getElementById('pause-anim').onclick = function () {
        console.info('pausing animation');
        animate = false;
    }

    // stop button
    document.getElementById('stop-anim').onclick = function () {
        console.info('stopping animation (resets to default)');
        animate = false;

        // reset to default
        kf = maxkf / 2;
        prevangle1 = 0; prevangle2 = 0; rngangle1 = 0; rngangle2 = 0;
        theta = [0, 0, 180, 0, 180, 0, 180, 0, 180, 0, 0];
        for (var i = 0; i < numNodes; i++) {
            initNodes(i);
        }
    }

    // speed slider
    speedslider.oninput = function () {
        maxkf = this.value;
        if (kf > maxkf) {
            kf = maxkf - 1;
        }
    }

    /* MUSIC LISTENERS */
    // play button
    document.getElementById('play').onclick = function () {
        console.info('playing music');
        music.play();

        // update the seek slider every second
        seekInterval = setInterval(updateSeek, 1000);   // update slider every second
    }

    // pause button
    document.getElementById('pause').onclick = function () {
        console.info('pausing music');
        music.pause();
    }

    // stop button
    document.getElementById('stop').onclick = function () {
        console.info('stopping music (resets to beginning)');
        music.pause();
        seekslider.value = 0;
        music.currentTime = 0;      // reset to beginning of the file
        displayTime(currtime, 0);
        clearInterval(seekInterval);
    }

    // volume slider
    volumeslider.oninput = function () {
        music.volume = this.value / 100;
    }

    // seek slider
    seekslider.onchange = function () {
        time = music.duration * (seekslider.value / seekslider.max);
        music.currentTime = time;
        displayTime(currtime, time);
    }

    // music-ended listener
    music.addEventListener('ended', function () {
        console.log('song finished');
        this.currentTime = 0;
        document.getElementById('stop').onclick;
    })

    /* OTHER LISTENERS */
    // fov slider
    fovslider.oninput = function () {
        persp.fov = this.value;
    }

    // grid count slider
    gridslider.oninput = function () {
        numChecks = this.value;
        initTextures();
    }

    // ========================== Camera control via mouse ============================================
    // There are 4 event listeners: onmouse down, up, leave, move
    
    // on onmousedown event
    // check if left/right button not already down
    // if just pressed, flag event with mouse.leftdown/rightdown and stores current mouse location
    canvas.onmousedown = function (event) {
        if (event.button == 0 && !mouse.leftDown) {
            mouse.leftDown = true;
            mouse.prevX = event.clientX;
            mouse.prevY = event.clientY;
        }
        else if (event.button == 2 && !mouse.rightDown) {
            mouse.rightDown = true;
            mouse.prevX = event.clientX;
            mouse.prevY = event.clientY;
        }
    };

    // onmouseup event
    // set flag for left or right mouse button to indicate that mouse is now up
    canvas.onmouseup = function (event) {
        // Mouse is now up
        if (event.button == 0) {
            mouse.leftDown = false;
        }
        else if (event.button == 2) {
            mouse.rightDown = false;
        }

    };

    // onmouseleave event
    // if mouse leaves canvas, then set flags to indicate that mouse button no longer down.
    // This might not actually be the case, but it keeps input from the mouse when outside of app
    // from being recorded/used.
    // (When re-entering canvas, must re-click mouse button.)
    canvas.onmouseleave = function () {
        // Mouse is now up
        mouse.leftDown = false;
        mouse.rightDown = false;
    };

    // onmousemove event -- Move the camera based on mouse movement.
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
                }
                else {
                    viewer.theta += 0.01 * deltaX;
                    viewer.phi -= 0.01 * deltaY;
                }

                // Wrap the angles
                var twoPi = 6.28318530718;
                if (viewer.theta > twoPi) {
                    viewer.theta -= twoPi;
                }
                else if (viewer.theta < 0) {
                    viewer.theta += twoPi;
                }

                if (viewer.phi > twoPi) {
                    viewer.phi -= twoPi;
                }
                else if (viewer.phi < 0) {
                    viewer.phi += twoPi;
                }

            } // end mouse.leftdown
            else if (mouse.rightDown) {
                console.log("onmousemove and rightDown is true");

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
            mvmat = lookAt(vec3(viewer.eye), viewer.at, viewer.up);

            mouse.prevX = currentX;
            mouse.prevY = currentY;
        } // end if button down
    };
}

/**
 * animatefigure() -- animates the figure using kf
 */
function animatefigure() {
    // compute new angles and whatnot
    var armangle = computeArms(kf);
    var legangle = computeLegs(kf);


    // each animation is: update theta value, then call initNodes on that id
    theta[leftUpperArmId] = armangle;
    theta[rightUpperArmId] = -armangle;
    theta[leftUpperLegId] = -legangle;
    theta[rightUpperLegId] = legangle;

    initNodes(leftUpperArmId);
    initNodes(rightUpperArmId);
    initNodes(leftUpperLegId);
    initNodes(rightUpperLegId);

    // update head
    if (!countingDown) {
        var head1angle = computeHead1(kf);
        var head2angle = computeHead2(kf);

        theta[head1Id] = head1angle;
        theta[head2Id] = head2angle;

        initNodes(head1Id);
        initNodes(head2Id);
    }

    // each iteration of the render loop will cause the frame value to update
    if (!countingDown) {
        kf++;
    } else {
        kf--;
    }

    // loop kf from 0 to maxkf, then from maxkf to 0 (and so on)
    if (kf > maxkf) {
        countingDown = true;
    }
    if (kf < 0) {
        countingDown = false;

        // compute a new head1 and head2 angle
        prevangle1 = rngangle1;
        prevangle2 = rngangle2;
        rngangle1 = rng(-10, 40);       // up/down
        rngangle2 = rng(-45, 90);      // left/right
        console.log('prevangle1', prevangle1, 'prevangle2', prevangle2, 'rngangle1', rngangle1, 'rngangle2', rngangle2);
    }
}

// given a keyframe value, this will compute new theta angles for the arms
function computeArms(kf) {
    var c = 140;
    var d = 230;
    return c + ((d - c) / maxkf) * (kf)
}

// computes new leg angles
function computeLegs(kf) {
    // legs travel between 140 and 220 degrees
    var c = 140;
    var d = 230;
    return c + ((d - c) / maxkf) * (kf)
}

// head 1 (up/down); maps from its current angle to the new angle.
function computeHead1(kf) {
    var c = prevangle1;
    var d = rngangle1;
    return c + ((d - c) / maxkf) * (kf)
}

// head 2 (left/right); maps from its current angle to the new angle.
function computeHead2(kf) {
    var c = prevangle2;
    var d = rngangle2;
    return c + ((d - c) / maxkf) * (kf)
}

// rngs b/w min and max
function rng(min, max) {
    return Math.floor(Math.random() * max) + min
}

// updates the seek. used in an interval
function updateSeek() {
    seekpos = 0;
    var time = music.currentTime;
    var dur = music.duration;
    if (!isNaN(dur)) {
        seekpos = time * (seekslider.max / dur);
        console.log(seekpos);
        seekslider.value = seekpos; // show to user
        displayTime(currtime, time);
        displayTime(totaltime, dur);
    }
}

// used to format a time and place it in the desired element.
function displayTime(elem, time) {
    var mins = Math.floor(time / 60);
    var secs = Math.floor(time - mins * 60);

    // handle if secs < 10 (so it displays :02, not :2)
    if (secs < 10) {
        secs = "0" + secs;
    }

    elem.innerText = `${mins}:${secs}`;
}
