//Kevin Li Project A: The Master Hand

// I used lots of starter code provided by Professor Jack Tumblin 
// in order to write this WebGL Program

// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variable -- Rotation angle rate (degrees/second)
var ANGLE_STEP = 45.0;
var floatsPerVertex = 7;

// Global vars for mouse click-and-drag for rotation.
var isDrag=false;   
var xMclik=0.0;     
var yMclik=0.0;   
var xMdragTot=0.0;  
var yMdragTot=0.0; 
var move = 0.1;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

// Mouse & Keyboard Event-handlers-------------------------------

  canvas.onmousedown  = function(ev){myMouseDown( ev, gl, canvas) }; 
  
  canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };
            
  canvas.onmouseup =    function(ev){myMouseUp(   ev, gl, canvas)};
            
  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);
  
// End Mouse & Keyboard Event-Handlers-----------------------------------

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.enable(gl.DEPTH_TEST);     
  
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;

//-----------------  

  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
    requestAnimationFrame(tick, canvas);   
                      // Request that the browser re-draw the webpage
  };
  tick();             // start (and continue) animation: draw current image
  
}

function initVertexBuffer(gl) {
//==============================================================================           
  
  makeCylinder();
  makeCube();
  makePenthouse();
  
  var mySiz = (cylVerts.length + cubeVerts.length + pentVerts.length);
  var nn = (mySiz / floatsPerVertex);

  var colorShapes = new Float32Array(mySiz);
    cylStart = 0;             
    for(i=0,j=0; j< cylVerts.length; i++,j++) {
      colorShapes[i] = cylVerts[j];
      }
    cubeStart = i;           
    for(j=0; j< cubeVerts.length; i++, j++) {
      colorShapes[i] = cubeVerts[j];
      }
      PentStart = i;           
    for(j=0; j< pentVerts.length; i++, j++) {
      colorShapes[i] = pentVerts[j];
      }
    
  
  
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; 
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 7, 0);          
  gl.enableVertexAttribArray(a_Position);  
                

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 7, FSIZE * 4);     
                    
  gl.enableVertexAttribArray(a_Color);  
                    // Enable assignment of vertex buffer object's position data
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var ctrColr = new Float32Array([1.0, 0.0, 1.0]); // darker red
 var topColr = new Float32Array([0, 1.0, 1.0]); // redish
 var botColr = new Float32Array([1.0, 0.75, 0.0]); // brighter red
 var capVerts = 16; // # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.1;   // radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them. 

  // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
  // v counts vertices: j counts array elements (vertices * elements per vertex)
  for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {  
    // skip the first vertex--not needed.
    if(v%2==0)
    {       // put even# vertices at center of cylinder's top cap:
      cylVerts[j  ] = 0.0;      // x,y,z,w == 0,0,1,1
      cylVerts[j+1] = 0.0;  
      cylVerts[j+2] = 1.0; 
      cylVerts[j+3] = 1.0;      // r,g,b = topColr[]
      cylVerts[j+4]=ctrColr[0]; 
      cylVerts[j+5]=ctrColr[1]; 
      cylVerts[j+6]=ctrColr[2];
    }
    else {  // put odd# vertices around the top cap's outer edge;
            // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
            //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
      cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);     // x
      cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);     // y
      //  (Why not 2*PI? because 0 < =v < 2*capVerts, so we
      //   can simplify cos(2*PI * (v-1)/(2*capVerts))
      cylVerts[j+2] = 1.0;  // z
      cylVerts[j+3] = 1.0;  // w.
      // r,g,b = topColr[]
      cylVerts[j+4]=topColr[0]; 
      cylVerts[j+5]=topColr[1]; 
      cylVerts[j+6]=topColr[2];     
    }
  }
  // Create the cylinder side walls, made of 2*capVerts vertices.
  // v counts vertices within the wall; j continues to count array elements
  for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
    if(v%2==0)  // position all even# vertices along top cap:
    {   
        cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);   // x
        cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);   // y
        cylVerts[j+2] = 1.0;  // z
        cylVerts[j+3] = 1.0;  // w.
        // r,g,b = topColr[]
        cylVerts[j+4]=topColr[0]; 
        cylVerts[j+5]=topColr[1]; 
        cylVerts[j+6]=topColr[2];     
    }
    else    // position all odd# vertices along the bottom cap:
    {
        cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);   // x
        cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);   // y
        cylVerts[j+2] =-1.0;  // z
        cylVerts[j+3] = 1.0;  // w.
        // r,g,b = topColr[]
        cylVerts[j+4]=botColr[0]; 
        cylVerts[j+5]=botColr[1]; 
        cylVerts[j+6]=botColr[2];     
    }
  }
  // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
  // v counts the vertices in the cap; j continues to count array elements
  for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
    if(v%2==0) {  // position even #'d vertices around bot cap's outer edge
      cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);   // x
      cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);   // y
      cylVerts[j+2] =-1.0;  // z
      cylVerts[j+3] = 1.0;  // w.
      // r,g,b = topColr[]
      cylVerts[j+4]=botColr[0]; 
      cylVerts[j+5]=botColr[1]; 
      cylVerts[j+6]=botColr[2];   
    }
    else {        // position odd#'d vertices at center of the bottom cap:
      cylVerts[j  ] = 0.0;      // x,y,z,w == 0,0,-1,1
      cylVerts[j+1] = 0.0;  
      cylVerts[j+2] =-1.0; 
      cylVerts[j+3] = 1.0;      // r,g,b = botColr[]
      cylVerts[j+4]=botColr[0]; 
      cylVerts[j+5]=botColr[1]; 
      cylVerts[j+6]=botColr[2];
    }
  }
}
//a function that makes a very colorful cube
function makeCube() {
  cubeVerts = new Float32Array([
    // +x face: RED

     1.0, -1.0, -1.0, 1.0,    1.0, 0.0, 0.0,  
     1.0,  1.0, -1.0, 1.0,    1.0, 0.5, 0.0,  
     1.0,  1.0,  1.0, 1.0,    1.0, 1.0, 0.0,  
     
     1.0,  1.0,  1.0, 1.0,    1.0, 0.1, 0.1,  
     1.0, -1.0,  1.0, 1.0,    1.0, 0.5, 0.1,  
     1.0, -1.0, -1.0, 1.0,    1.0, 1.0, 0.1,  

    // +y face: GREEN
    -1.0,  1.0, -1.0, 1.0,    0.0, 1.0, 0.0,  
    -1.0,  1.0,  1.0, 1.0,    0.0, 1.0, 0.5,  
     1.0,  1.0,  1.0, 1.0,    0.0, 1.0, 1.0,  

     1.0,  1.0,  1.0, 1.0,    0.1, 1.0, 0.1,  
     1.0,  1.0, -1.0, 1.0,    0.1, 1.0, 0.5,   
    -1.0,  1.0, -1.0, 1.0,    0.1, 1.0, 1.0,  

    // +z face: BLUE
    -1.0,  1.0,  1.0, 1.0,    0.0, 0.0, 1.0,  
    -1.0, -1.0,  1.0, 1.0,    0.5, 0.0, 1.0,  
     1.0, -1.0,  1.0, 1.0,    1.0, 0.0, 1.0,  

     1.0, -1.0,  1.0, 1.0,    0.1, 0.1, 1.0,  
     1.0,  1.0,  1.0, 1.0,    0.5, 0.1, 1.0,  
    -1.0,  1.0,  1.0, 1.0,    1.0, 0.1, 1.0,  

    // -x face: CYAN
    -1.0, -1.0,  1.0, 1.0,    0.0, 1.0, 1.0,   
    -1.0,  1.0,  1.0, 1.0,    0.25, 1.0, 1.0,   
    -1.0,  1.0, -1.0, 1.0,    0.5, 1.0, 1.0,  
    
    -1.0,  1.0, -1.0, 1.0,    0.1, 1.0, 1.0,  
    -1.0, -1.0, -1.0, 1.0,    0.25, 1.0, 1.0,    
    -1.0, -1.0,  1.0, 1.0,    0.5, 1.0, 1.0,    
    
    // -y face: MAGENTA
     1.0, -1.0, -1.0, 1.0,    1.0, 0.0, 1.0,  
     1.0, -1.0,  1.0, 1.0,    1.0, 0.25, 1.0,  
    -1.0, -1.0,  1.0, 1.0,    1.0, 0.5, 1.0, 

    -1.0, -1.0,  1.0, 1.0,    1.0, 0.1, 1.0,  
    -1.0, -1.0, -1.0, 1.0,    1.0, 0.25, 1.0,  
     1.0, -1.0, -1.0, 1.0,    1.0, 0.5, 1.0,  

     // -z face: YELLOW
     1.0,  1.0, -1.0, 1.0,    1.0, 1.0, 0.0,  
     1.0, -1.0, -1.0, 1.0,    1.0, 1.0, 0.5,  
    -1.0, -1.0, -1.0, 1.0,    1.0, 1.0, 1.0,     

    -1.0, -1.0, -1.0, 1.0,    1.0, 1.0, 0.1,  
    -1.0,  1.0, -1.0, 1.0,    1.0, 1.0, 0.5,  
     1.0,  1.0, -1.0, 1.0,    1.0, 1.0, 0.25,  

    ]);
}

//this function makes a five sided box, which will later represent a crude palm of the hand
function makePenthouse() {
  var p = 1.15
  pentVerts = new Float32Array([

     //Make pentagon box
     //palm side RED
   -0.75,  1.0,  0.0, 1.0,    1.0, 0.0, 0.0,  
    0.75,  1.0,  0.0, 1.0,    1.0, 0.0, 0.5,  
   -0.75, -1.0,  0.0, 1.0,    1.0, 0.5, 0.0,  
     
   -0.75, -1.0,  0.0, 1.0,    1.0, 0.5, 0.1,  
    0.75, -1.0,  0.0, 1.0,    1.0, 0.1, 0.1,  
    0.75,  1.0,  0.0, 1.0,    1.0, 0.1, 0.5,  

    0.75,  1.0,  0.0, 1.0,    1.0, 0.0, 0.0,
    0.75, -1.0,  0.0, 1.0,    1.0, 0.5, 0.0,
      p ,  0.0,  0.0, 1.0,    1.0, 0.0, 0.5,

     //back hand BLUE
   -0.75,  1.0,  0.5, 1.0,    0.0, 0.0, 1.0,  
    0.75,  1.0,  0.5, 1.0,    0.0, 0.0, 1.0,  
   -0.75, -1.0,  0.5, 1.0,    0.0, 0.0, 1.0,  
     
   -0.75, -1.0,  0.5, 1.0,    0.1, 0.1, 1.0,  
    0.75, -1.0,  0.5, 1.0,    0.1, 0.1, 1.0,  
    0.75,  1.0,  0.5, 1.0,    0.1, 0.1, 1.0,  

    0.75,  1.0,  0.5, 1.0,    0.0, 0.0, 1.0,
    0.75, -1.0,  0.5, 1.0,    0.0, 0.0, 1.0,
      p ,  0.0,  0.5, 1.0,    0.0, 0.0, 1.0,

     //pinky side GREEN
   -0.75,  1.0,  0.0, 1.0,    0.0, 1.0, 0.0,          
   -0.75, -1.0,  0.0, 1.0,    0.0, 1.0, 0.0,
   -0.75, -1.0,  0.5, 1.0,    0.0, 1.0, 0.0,

   -0.75,  1.0,  0.5, 1.0,    0.1, 1.0, 0.1,
   -0.75, -1.0,  0.5, 1.0,    0.1, 1.0, 0.1,
   -0.75,  1.0,  0.0, 1.0,    0.1, 1.0, 0.1,

     //side where the fingers are connected CYAN
   -0.75,  1.0,  0.0, 1.0,    0.0, 1.0, 1.0,
    0.75,  1.0,  0.0, 1.0,    0.0, 1.0, 1.0,
   -0.75,  1.0,  0.5, 1.0,    0.0, 1.0, 1.0,

   -0.75,  1.0,  0.5, 1.0,    0.0, 1.0, 1.0,
    0.75,  1.0,  0.0, 1.0,    0.0, 1.0, 1.0,
    0.75,  1.0,  0.5, 1.0,    0.0, 1.0, 1.0,

     //wrist side MAGENTA
   -0.75, -1.0,  0.0, 1.0,    1.0, 0.5, 1.0,
    0.75, -1.0,  0.0, 1.0,    1.0, 0.0, 1.0,
    0.75, -1.0,  0.5, 1.0,    1.0, 0.25, 1.0,

   -0.75, -1.0,  0.0, 1.0,    1.0, 0.2, 1.0,
   -0.75, -1.0,  0.5, 1.0,    1.0, 0.4, 1.0,
    0.75, -1.0,  0.5, 1.0,    1.0, 0.6, 1.0,

     //where the thumb is YELLOW/Orange
     0.75,  1.0,  0.0, 1.0,    1.0, 0.25, 0.0,
     0.75,  1.0,  0.5, 1.0,    1.0, 0.5, 0.0,
      p ,  0.0,  0.0, 1.0,    1.0, 1.0, 0.0,
     
     0.75,  1.0,  0.5, 1.0,    1.0, 0.25, 0.0,
      p,   0.0,  0.0, 1.0,    1.0, 0.5, 0.0,
      p ,  0.0,  0.5, 1.0,    1.0, 0.75, 0.0,
     
     //where the thumb is YELLOW/Orange
     0.75, -1.0,  0.0, 1.0,    1.0, 0.25, 0.0,
     0.75, -1.0,  0.5, 1.0,    1.0, 1.0, 0.0,
      p ,  0.0,  0.0, 1.0,    1.0, 0.75, 0.0,
     
     0.75, -1.0,  0.5, 1.0,    1.0, 1.0, 0.0,
      p ,  0.0,  0.0, 1.0,    1.0, 0.5, 0.0,
      p ,  0.0,  0.5, 1.0,    1.0, 0.25, 0.0,

  ]);
}



function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //set up palm of hand
  modelMatrix.setRotate(140, 0.0, 1.0, 0.0);
  modelMatrix.scale(1, 1, -1);
  modelMatrix.scale(0.3, 0.3, 0.3);
  modelMatrix.translate(0.0, -1.0, 0.0);
  modelMatrix.rotate(60, 1.0, 0.0, 0.0);

  //draw the palm
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      // Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
  gl.drawArrays(gl.TRIANGLES, 
                cylVerts.length/floatsPerVertex + 36, 48);

  //we will retrieve the basic palm axis for all the fingers except the thumb, so we need it 4 times.
  pushMatrix(modelMatrix);
  pushMatrix(modelMatrix);
  pushMatrix(modelMatrix);
  pushMatrix(modelMatrix);


  //-------Draw Thumb Base:
  modelMatrix.translate(1.5,-0.2,0.0);
  modelMatrix.scale(1, 1, -1);
  modelMatrix.scale(0.2,0.25,0.2);
  modelMatrix.rotate(-90, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, -1.0, 0.0, 0.0);
  modelMatrix.translate(0.0, 0.0, 1.0);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.



  //-------Draw Upper Thumb:
  modelMatrix.translate(0.0,0.0, 2.0);
  modelMatrix.scale(0.8,0.8,0.8);
  modelMatrix.rotate(20, 1.0, 0.5, 0.0);
  modelMatrix.rotate(currentAngle * 0.20, -1.0, 0.0, 0.0);
  
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

modelMatrix = popMatrix();

//-------Draw 1st finger Base:
  modelMatrix.setTranslate(-0.30, -0.18, 0.15);
  modelMatrix.scale(0.05, 0.05, 0.05);
  modelMatrix.rotate(-45, 1.0, 1.0, 0.0);
  modelMatrix.rotate(currentAngle * 0.2, 1, 0, 0.0);
  modelMatrix.translate(0.0, 0.1, 0.8);
  
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

//-------Draw 1st finger 2nd joint:

  modelMatrix.translate(0.0, 1.0, 1.0);
  modelMatrix.scale(0.9,1.4,0.9);
  modelMatrix.rotate(-70, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, 1, 0, 0.0);
  modelMatrix.translate(0.0, 0.0, 0.75);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

//-------Draw 1st finger 3rd joint:
  modelMatrix.translate(0.0, 0.75, 1.0);
  modelMatrix.scale(0.9,0.9,0.9);
  modelMatrix.rotate(-70, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, 1.0, 0, 0.0);
  modelMatrix.translate(0.0,0.0,1.0);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

modelMatrix = popMatrix();

//-------Draw 2nd finger Base:
  modelMatrix.translate(0.1, 1, 0.0);
  modelMatrix.scale(0.15, 0.15, 0.15);
  modelMatrix.rotate(-90, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle * 0.2, 1, 0, 0);
  modelMatrix.translate(0.5, -0.3, 0.8);
  
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

//-------Draw 2nd finger 2nd joint:

  modelMatrix.translate(0.0, 1.0, 1.8);
  modelMatrix.scale(0.9,1.4,0.9);
  modelMatrix.rotate(-70, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, 1, 0, 0.0);
  modelMatrix.translate(0.0, 0.0, 0.25);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

//-------Draw 2nd finger 3rd joint:
  modelMatrix.translate(0.0, 0.75, 1.0);
  modelMatrix.scale(0.9,0.9,0.9);
  modelMatrix.rotate(-70, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, 1.0, 0, 0.0);
  modelMatrix.translate(0.0,0.0,1.0);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.


modelMatrix = popMatrix();

//-------Draw 3rd finger Base:
  modelMatrix.translate(-0.25, 1, 0.0);
  modelMatrix.scale(0.15, 0.15, 0.15);
  modelMatrix.rotate(-90, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle * 0.2, 1, 0, 0);
  modelMatrix.translate(0.5, -0.3, 0.8);
  
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

//-------Draw 3rd finger 2nd joint:

  modelMatrix.translate(0.0, 1.0, 1.8);
  modelMatrix.scale(0.9,1.4,0.9);
  modelMatrix.rotate(-70, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, 1, 0, 0.0);
  modelMatrix.translate(0.0, 0.0, 0.25);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

//-------Draw 3rd finger 3rd joint:
  modelMatrix.translate(0.0, 0.75, 1.0);
  modelMatrix.scale(0.9,0.9,0.9);
  modelMatrix.rotate(-70, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, 1.0, 0, 0.0);
  modelMatrix.translate(0.0,0.0,1.0);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

modelMatrix = popMatrix();

//-------Draw 4th finger Base:
  modelMatrix.translate(-0.65, 1, 0.0);
  modelMatrix.scale(0.15, 0.15, 0.15);
  modelMatrix.rotate(-90, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle * 0.2, 1, 0, 0);
  modelMatrix.translate(0.5, -0.3, 0.8);
  
  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

//-------Draw 4th finger 2nd joint:

  modelMatrix.translate(0.0, 1.0, 1.8);
  modelMatrix.scale(0.9,1.4,0.9);
  modelMatrix.rotate(-70, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, 1, 0, 0.0);
  modelMatrix.translate(0.0, 0.0, 0.25);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

//-------Draw 4th finger 3rd joint:
  modelMatrix.translate(0.0, 0.75, 1.0);
  modelMatrix.scale(0.9,0.9,0.9);
  modelMatrix.rotate(-70, 1.0, 0.0, 0.0);
  modelMatrix.rotate(currentAngle*0.2, 1.0, 0, 0.0);
  modelMatrix.translate(0.0,0.0,1.0);

  // Drawing:
  // Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.


  //---------Draw Cube with Mouse Drag functions:
  modelMatrix.setTranslate(0.0, 0.5, 0.0);  // 'set' means DISCARD old matrix,
              // (drawing axes centered in CVV), and then make new
              // drawing axes moved to the lower-left corner of CVV.
  modelMatrix.scale(1,1,-1);              // convert to left-handed coord sys
                                          // to match WebGL display canvas.
  modelMatrix.scale(0.09, 0.09, 0.09);
              // Make it smaller:
  modelMatrix.rotate(currentAngle*3, 1, 1, 0.0);
  
  // DRAW CUBE:   Use ths matrix to transform & draw
  //            the second set of vertices stored in our VBO:
  
  var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
  modelMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);


  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      // Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
  gl.drawArrays(gl.TRIANGLES,
                cylVerts.length/floatsPerVertex, 36);


  //Draw Appendages
  modelMatrix.translate(1.5, 0.0, 0.0);
  modelMatrix.scale(1.5, 0.45, 0.45);
  modelMatrix.rotate(90, 0.0, 1.0, 0.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.
  
  modelMatrix.translate(0, 0.0, 1.2);
  modelMatrix.scale(1.0, 1.0, 0.3);
  modelMatrix.rotate(currentAngle*4, 0.0, 0.0, 1.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      // Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
  gl.drawArrays(gl.TRIANGLES,
                cylVerts.length/floatsPerVertex, 36);

pushMatrix(modelMatrix);
pushMatrix(modelMatrix);

  modelMatrix.translate(2, 0.0, 0.0);
  modelMatrix.scale(1.0, 0.5, 0.5);
  modelMatrix.rotate(90, 0.0, 1.0, 0.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

  modelMatrix.translate(0, 0.0, 1.5);
  modelMatrix.scale(1.5, 1.5, 0.7);
  modelMatrix.rotate(currentAngle*4, 0.0, 0.0, 1.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      // Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
  gl.drawArrays(gl.TRIANGLES,
                cylVerts.length/floatsPerVertex, 36);

modelMatrix = popMatrix();

  modelMatrix.translate(-2, 0.0, 0.0);
  modelMatrix.scale(1.0, 0.5, 0.5);
  modelMatrix.rotate(-90, 0.0, 1.0, 0.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.
  
  modelMatrix.translate(0, 0.0, 1.5);
  modelMatrix.scale(1.5, 1.5, 0.7);
  modelMatrix.rotate(currentAngle*4, 0.0, 0.0, 1.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      // Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
  gl.drawArrays(gl.TRIANGLES,
                cylVerts.length/floatsPerVertex, 36);

modelMatrix = popMatrix();
  
  modelMatrix.translate(0, 0.0, 1.50);
  modelMatrix.scale(0.6, 0.6 , 1.2);
  modelMatrix.rotate(90, 0.0, 0.0, 1.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw just the the cylinder's vertices:
  gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                cylStart/floatsPerVertex, // start at this vertex number, and
                cylVerts.length/floatsPerVertex); // draw this many vertices.

  modelMatrix.translate(0, 0.0, 1.5);
  modelMatrix.scale(1.25, 1.25, 0.6);
  modelMatrix.rotate(currentAngle*4, 0.0, 0.0, 1.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      // Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
  gl.drawArrays(gl.TRIANGLES,
                cylVerts.length/floatsPerVertex, 36);
}


// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

//==================HTML Button Callbacks
function spinUp() {
  ANGLE_STEP += 25; 
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
    ANGLE_STEP = myTmp;
  }
}
 //===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
//                  (Which button?    console.log('ev.button='+ev.button);   )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;

  runStop();
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x;                         // Make next drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);


};


function myKeyDown(ev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode(varies for different countries and alphabets).
//  CAUTION: You may wish to avoid 'keydown' and 'keyup' events: if you DON'T 
// need to sense non-ASCII keys (arrow keys, function keys, pgUp, pgDn, Ins, 
// Del, etc), then just use the 'keypress' event instead.
//   The 'keypress' event captures the combined effects of alphanumeric keys and // the SHIFT, ALT, and CTRL modifiers.  It translates pressed keys into ordinary
// ASCII codes; you'll get the ASCII code for uppercase 'S' if you hold shift 
// and press the 's' key.
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of the messy way JavaScript handles keyboard events
// see:    http://javascript.info/tutorial/keyboard-events
//

  switch(ev.keyCode) {      // keycodes !=ASCII, but are very consistent for 
  //  nearly all non-alphanumeric keys for nearly all keyboards in all countries.
    case 37:    // left-arrow key
      // print in console:
      console.log(' left-arrow.');
      // and print on webpage in the <div> element with id='Result':
      break;
    case 38:    // up-arrow key
      console.log('   up-arrow.');
      spinUp();
      break;
    case 39:    // right-arrow key
      console.log('right-arrow.');
      break;
    case 40:    // down-arrow key
      console.log(' down-arrow.');
      spinDown();
      break;
    default:
      console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
      break;
  }
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

  console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.
  console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
                        ', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
                        ', altKey='   +ev.altKey   +
                        ', metaKey(Command key or Windows key)='+ev.metaKey);
}