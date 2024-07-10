var woggle = woggle || {};

//--------------------------------------------------------------------------------------------------------//
// Create Woggle API
//--------------------------------------------------------------------------------------------------------//
function createWoggle(canvasName)
{
  woggle = new Woggle(canvasName);
  return woggle;
}

//--------------------------------------------------------------------------------------------------------//
// Woggle object
//--------------------------------------------------------------------------------------------------------//
function Woggle(canvasName)
{
  // Get reference to canvas used for rendering
  this.canvas = document.getElementById(canvasName);
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;
  this.canvas.aspect = this.canvas.width / this.canvas.height;

  // Create webGL context
  this.gl = null;

  try { this.gl = this.canvas.getContext("experimental-webgl", {antialias: true}); }
  catch (e) {alert("No webGL compatibility detected!"); return null;}
}

// Woggle supported vertex formats
Woggle.prototype.VERTEX_TYPE = {
  POSITION : 1,
  NORMAL : 2,
  POSITION_NORMAL : 3,
  COLOUR : 4,
  POSITION_COLOUR : 5,
  NORMAL_COLOUR : 6,
  POSITION_NORMAL_COLOUR : 7  
};

// Strides for each vertex format
Woggle.prototype.VERTEX_STRIDE = [3 * 4, 3 * 4, 6 * 4, 3 * 4, 6 * 4, 6 * 4, 9 * 4];

// Object creation methods (for instance tracking, should eventually make internal)
Woggle.prototype.createMaterial = createMaterial;
Woggle.prototype.createModel = createModel;
Woggle.prototype.createVertex = createVertex;
Woggle.prototype.createVertexArray = createVertexArray;

// Shader loader (general)
Woggle.prototype.loadShader = function(shaderName, shaderType, shaderTypeString )
{
  try 
  {
    var source = document.getElementById(shaderName).text;
    var shader = this.gl.createShader(shaderType);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
      return shader;

    alert("Error compiling shader '" + shaderName + "', " + this.gl.getShaderInfoLog(shader));
    return false;
  }

  catch (e)
  { 
    alert("Exception : Cannot load shader '" + shaderName + "'!"); 
  }
}

// Vertex shader loader
Woggle.prototype.loadVertexShader = function(shaderName)
{
  return this.loadShader(shaderName, this.gl.VERTEX_SHADER, "VERTEX");  
}

// Fragment shader loader
Woggle.prototype.loadFragmentShader = function(shaderName)
{
  return this.loadShader(shaderName, this.gl.FRAGMENT_SHADER, "FRAGMENT");  
}

Woggle.prototype.vector3 = new Vector3();

Woggle.prototype.matrix4 = new Matrix4();

//--------------------------------------------------------------------------------------------------------//


//--------------------------------------------------------------------------------------------------------//
// Vertex handling
//--------------------------------------------------------------------------------------------------------//
function createVertexArray(vertexType, size)
{
  var vertexArray = [];

  while (size --> 0)
    vertexArray[vertexArray.length] = new Vertex(vertexType);
  
  return vertexArray;
}

function createVertex(vertexType)
{
  return new Vertex(vertexType);
}

//--------------------------------------------------------------------------------------------------------//
// Vertex object
//--------------------------------------------------------------------------------------------------------//
function Vertex(vertexType)
{
  if (vertexType & woggle.VERTEX_TYPE.POSITION)
    this.Position = [0,0,0];

  if (vertexType & woggle.VERTEX_TYPE.NORMAL)
    this.Normal = [0,0,0];

  if (vertexType & woggle.VERTEX_TYPE.COLOUR)
    this.Colour = [0,0,0];
}

//--------------------------------------------------------------------------------------------------------//
Vertex.prototype.flatten = function ()
{
  var flatVertex = [];

  if ("Position" in this) {
    flatVertex[flatVertex.length] = this.Position[0];
    flatVertex[flatVertex.length] = this.Position[1];
    flatVertex[flatVertex.length] = this.Position[2];
  }

  if ("Normal" in this) {
    flatVertex[flatVertex.length] = this.Normal[0];
    flatVertex[flatVertex.length] = this.Normal[1];
    flatVertex[flatVertex.length] = this.Normal[2];
  }

  if ("Colour" in this) {
    flatVertex[flatVertex.length] = this.Colour[0];
    flatVertex[flatVertex.length] = this.Colour[1];
    flatVertex[flatVertex.length] = this.Colour[2];
  }

  return flatVertex;
}

//--------------------------------------------------------------------------------------------------------//
Vertex.prototype.getType = function ()
{
  var vertexType = 0;

  if ("Position" in this)
    vertexType += woggle.VERTEX_TYPE.POSITION;
  if ("Normal" in this)
    vertexType += woggle.VERTEX_TYPE.NORMAL;
  if ("Colour" in this)
    vertexType += woggle.VERTEX_TYPE.COLOUR;

  return vertexType;
}
//--------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------//
// Material handling
//--------------------------------------------------------------------------------------------------------//
function createMaterial(materialName)
{
  var material = new Material(materialName);

  return material;
}

//--------------------------------------------------------------------------------------------------------//
// Material object
//--------------------------------------------------------------------------------------------------------//
function Material(materialName)
{
  this.name = materialName;

  this.shader = {
    program : null,
    vertex : null,
    fragment : null
  }; 
}

//--------------------------------------------------------------------------------------------------------//
Material.prototype.load = function(vertexName, fragmentName) 
{
  // Load shaders
  this.shader.vertex = woggle.loadVertexShader(vertexName);
  this.shader.fragment = woggle.loadFragmentShader(fragmentName);

  // Crate shader program and bind vertex and fragment programs to it
  this.shader.program = woggle.gl.createProgram();
  woggle.gl.attachShader(this.shader.program, this.shader.vertex);
  woggle.gl.attachShader(this.shader.program, this.shader.fragment);
  woggle.gl.linkProgram(this.shader.program);  
}

//--------------------------------------------------------------------------------------------------------//
Material.prototype.use = function()
{
  woggle.gl.useProgram(this.shader.program);
}

//--------------------------------------------------------------------------------------------------------//
Material.prototype.updateVertexDescriptor = function(vertexDescriptor)
{
  if (vertexDescriptor.type & woggle.VERTEX_TYPE.POSITION)
    vertexDescriptor.position = woggle.gl.getAttribLocation(this.shader.program, "position");

  if (vertexDescriptor.type & woggle.VERTEX_TYPE.NORMAL)
    vertexDescriptor.normal = woggle.gl.getAttribLocation(this.shader.program, "normal");

  if (vertexDescriptor.type & woggle.VERTEX_TYPE.COLOUR)
    vertexDescriptor.colour = woggle.gl.getAttribLocation(this.shader.program, "color");
}

//--------------------------------------------------------------------------------------------------------//
// Model handling
//--------------------------------------------------------------------------------------------------------//
function createModel(modelName)
{
  var model = new Model(modelName);

  return model;
}

//--------------------------------------------------------------------------------------------------------//
// Model object
//--------------------------------------------------------------------------------------------------------//
function Model(modelName)
{
  this.name = modelName;
  this.material = null;
  
  // Vertex attributes
  this.vertexDescriptor = {
      type : 0,
      position : 0,
      normal : 0,
      colour : 0
  };

  // Vertex and index lists
  this.vertexList = [];
  this.indexList = [];
    
  // Vertex and index buffers
  this.vertexBuffer = null;
  this.indexBuffer = null;
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.getModelViewMatrixIndex = function()
{
  return woggle.gl.getUniformLocation( this.material.shader.program, "modelViewMatrix" );
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.getProjectionMatrixIndex = function()
{
  return woggle.gl.getUniformLocation( this.material.shader.program, "projectionMatrix" ); 
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.addTriangleFace = function(vertexArray)
{
  alert(vertexArray.length);

  if (vertexArray.length == 3)
  {
    var vertexIndex = this.vertexList.length;

    for (var index = 0; index < 3; index++, vertexIndex++)
    {
      this.vertexList[vertexIndex] = vertexArray[index];
      this.indexList[this.indexList.length] = vertexIndex;
    }
  }
  else
    alert('Error in addTriangleFace : invalid vertex list!')
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.addIndexedTriangleFace = function (indexArray)
{
  if (indexArray.length == 3)
  {
    this.indexList[this.indexList.length] = indexArray[0];
    this.indexList[this.indexList.length] = indexArray[1];
    this.indexList[this.indexList.length] = indexArray[2];
  }
  else
    alert('Error in addIndexedTriangleFace : invalid index list!')
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.addVertexList = function (vertexArray)
{
  if (vertexArray.length > 0)
  {
    this.vertexDescriptor.type = vertexArray[0].getType();

    vertexList = [];

    for (var index = 0; index < vertexArray.length; index++)
      this.vertexList[this.vertexList.length] = vertexArray[index];
  }
  else
    alert("Error in addVertexList : vertex list is empty!");
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.addIndexList = function (indexArray)
{
  if (indexArray.length > 0)
  {
    for (var index = 0; index < indexArray.length; index++)
      this.indexList[this.indexList.length] = indexArray[index];
  }
  else
    alert("Error in addIndexList : index list is empty!");
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.setVertexType = function(vertexType)
{
  this.vertexDescriptor.type = vertexType;
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.compile = function ()
{
  // Generate flat index and vertex lists
  for (var size = this.vertexList.length; size --> 0;)
    this.vertexList[size] = this.vertexList[size].flatten();

  var flatVertexList = [].concat.apply([], this.vertexList);
  var flatIndexList = [].concat.apply([], this.indexList);

  // Create vertex buffer
  this.vertexBuffer = woggle.gl.createBuffer();
  woggle.gl.bindBuffer(woggle.gl.ARRAY_BUFFER, this.vertexBuffer);
  woggle.gl.bufferData(woggle.gl.ARRAY_BUFFER, new Float32Array(flatVertexList), woggle.gl.STATIC_DRAW);

  // Create index buffer
  this.indexBuffer = woggle.gl.createBuffer();
  woggle.gl.bindBuffer(woggle.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  woggle.gl.bufferData(woggle.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatIndexList), woggle.gl.STATIC_DRAW);
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.bind = function () 
{
  // Update vertex descriptor
  this.material.updateVertexDescriptor(this.vertexDescriptor);

  // Show how to interpret vertex format attributes
  var stride = woggle.VERTEX_STRIDE[this.vertexDescriptor.type];
  var offset = 0;

  // Bind vertex buffer
  woggle.gl.bindBuffer(woggle.gl.ARRAY_BUFFER, this.vertexBuffer);
  
  // Position data
  if (this.vertexDescriptor.type & woggle.VERTEX_TYPE.POSITION)
  {
    woggle.gl.enableVertexAttribArray(this.vertexDescriptor.position);
    woggle.gl.vertexAttribPointer(this.vertexDescriptor.position, 3, woggle.gl.FLOAT, woggle.gl.GL_FALSE, stride, offset);
    offset += 3 * 4;
  }

  // Normal data
  if (this.vertexDescriptor.type & woggle.VERTEX_TYPE.NORMAL)
  {
    woggle.gl.enableVertexAttribArray(this.vertexDescriptor.normal);
    woggle.gl.vertexAttribPointer(this.vertexDescriptor.normal, 3, woggle.gl.FLOAT, woggle.gl.GL_FALSE, stride, offset);
    offset += 3 * 4;
  }
  
  // Colour data
  if (this.vertexDescriptor.type & woggle.VERTEX_TYPE.COLOUR)
  {
    woggle.gl.enableVertexAttribArray(this.vertexDescriptor.colour);
    woggle.gl.vertexAttribPointer(this.vertexDescriptor.colour, 3, woggle.gl.FLOAT, woggle.gl.GL_FALSE, stride, offset);
    offset += 3 * 4;
  }

  // Bind index buffer
  woggle.gl.bindBuffer(woggle.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
}

//--------------------------------------------------------------------------------------------------------//
Model.prototype.draw = function ()
{
  this.material.use();
  this.bind();

  woggle.gl.drawElements(woggle.gl.TRIANGLES, this.indexList.length, woggle.gl.UNSIGNED_SHORT, 0);
}
//--------------------------------------------------------------------------------------------------------//

//--------------------------------------------------------------------------------------------------------//
// Linear algebra
//--------------------------------------------------------------------------------------------------------//
function Vector3() { };

Vector3.prototype.zero = new Float32Array([0,0,0]);

Vector3.prototype.create = function() {
  return new Float32Array(3);
}

Vector3.prototype.from = function(x, y, z) 
{
  return new Float32Array([x,y,z]);
}

Vector3.prototype.to = function(out, inp)
{
  out[0] = inp[0];
  out[1] = inp[1];
  out[2] = inp[2];
}

Vector3.prototype.clone = function(inp)
{
  return new Float32Array([inp[0], inp[1], inp[2]]);
}

Vector3.prototype.add = function(out, a, b)
{
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
}

Vector3.prototype.sub = function(out, a, b)
{
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
}

// Not sure this is needed since it's the same as Vector3.dot(inp, inp)!
Vector3.prototype.lengthSquared = function(inp)
{
  return inp[0] * inp[0] + inp[1] * inp[1] + inp[2] * inp[2];
}

Vector3.prototype.length = function(inp)
{
  return Math.sqrt(inp[0] * inp[0] + inp[1] * inp[1] + inp[2] * inp[2]);
}

Vector3.prototype.norm = function(out, inp)
{
  var _length = Math.sqrt(inp[0] * inp[0] + inp[1] * inp[1] + inp[2] * inp[2]);

  if (_length > Number.EPSILON)
  {
    var reciprocal = 1 / _length;

    out[0] = inp[0] * reciprocal;
    out[1] = inp[1] * reciprocal;
    out[2] = inp[2] * reciprocal;    
  }
  else
    alert("Error normalizing zero-length vector!")
}

Vector3.prototype.dot = function(a, b)
{
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

Vector3.prototype.cross = function(out, a, b)
{
  out[0] = a[1] * b[2] - a[2] * b[1];
  out[1] = a[2] * b[0] - a[0] * b[2];
  out[2] = a[0] * b[1] - a[1] * b[0];
}

Vector3.prototype.toString = function(inp)
{
  return "[" + inp[0] + ", " + inp[1] + ", " + inp[2] + "]"; 
}

//--------------------------------------------------------------------------------------------------------//
function Matrix4() { };

Matrix4.prototype.zero = new Float32Array([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
Matrix4.prototype.identity = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

Matrix4.prototype.create = function() {
  return new Float32Array(16);
}

Matrix4.prototype.to = function(out, inp)
{
  out[0] = inp[0];
  out[1] = inp[1];
  out[2] = inp[2];
  out[3] = inp[3];
  out[4] = inp[4];
  out[5] = inp[5];
  out[6] = inp[6];
  out[7] = inp[7];
  out[8] = inp[8];  
  out[9] = inp[9];
  out[10] = inp[10];
  out[11] = inp[11];
  out[12] = inp[12];  
  out[13] = inp[13];  
  out[14] = inp[14];  
  out[15] = inp[15];  
}

Matrix4.prototype.clone = function(inp)
{
  var out = Float32Array(16);

  out[0] = inp[0];
  out[1] = inp[1];
  out[2] = inp[2];
  out[3] = inp[3];
  out[4] = inp[4];
  out[5] = inp[5];
  out[6] = inp[6];
  out[7] = inp[7];
  out[8] = inp[8];  
  out[9] = inp[9];
  out[10] = inp[10];
  out[11] = inp[11];
  out[12] = inp[12];  
  out[13] = inp[13];  
  out[14] = inp[14];  
  out[15] = inp[15];  

  return out;
}

Matrix4.prototype.add = function(out, a, b) 
{
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];  
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];  
  out[13] = a[13] + b[13];  
  out[14] = a[14] + b[14];  
  out[15] = a[15] + b[15];  
}

Matrix4.prototype.sub = function(out, a, b) 
{
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];  
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];  
  out[13] = a[13] - b[13];  
  out[14] = a[14] - b[14];  
  out[15] = a[15] - b[15];  
}

Matrix4.prototype.transpose = function(out, inp)
{
  out[0] = inp[0];
  out[1] = inp[4];    
  out[2] = inp[8];    
  out[3] = inp[12];    
  out[4] = inp[1];    
  out[5] = inp[5];
  out[6] = inp[9];    
  out[7] = inp[13];    
  out[8] = inp[2];    
  out[9] = inp[6];    
  out[10] = inp[10];
  out[11] = inp[14];    
  out[12] = inp[3];    
  out[13] = inp[7];    
  out[14] = inp[11];    
  out[15] = inp[15];
}

Matrix4.prototype.makeIdentity = function(inpout)
{
  inpout[0] = 1;
  inpout[1] = 0;
  inpout[2] = 0;
  inpout[3] = 0;

  inpout[4] = 0;
  inpout[5] = 1;
  inpout[6] = 0;
  inpout[7] = 0;

  inpout[8] = 0;  
  inpout[9] = 0;
  inpout[10] = 1;
  inpout[11] = 0;

  inpout[12] = 0;  
  inpout[13] = 0;  
  inpout[14] = 0;  
  inpout[15] = 1;  
}

Matrix4.prototype.makeView = function(out, right, up, front, position)
{
  out[0] = right[0]; out[1] = up[0]; out[2] = front[0]; out[3] = 0;
  out[4] = right[1]; out[5] = up[1]; out[6] = front[1]; out[7] = 0;
  out[8] = right[2]; out[9] = up[2]; out[10] = front[2]; out[11] = 0;
  out[12] = -woggle.vector3.dot(right, position); 
  out[13] = -woggle.vector3.dot(up, position);
  out[14] = -woggle.vector3.dot(front, position); 
  out[15] = 1;
}

Matrix4.prototype.makeProjection = function(out, near, far, fov, aspect)
{
  var f = 1.0 / Math.tan(fov * 0.5);
  var a = (far + near) / (near - far);
  var b = (2 * far * near) / (near - far);

  out[0] = f/aspect;  out[1] = 0;   out[2] = 0;   out[3] = 0;
  out[4] = 0;         out[5] = f;   out[6] = 0;   out[7] = 0;
  out[8] = 0;         out[9] = 0;   out[10] = a;  out[11] = b;
  out[12] = 0;        out[13] = 0;  out[14] = -1; out[15] = 0;
}

Matrix4.prototype.lookAt = function(out, position, target, up)
{
  var direction = woggle.vector3.create(),
      xaxis = woggle.vector3.create(),
      yaxis = woggle.vector3.create(),
      zaxis = woggle.vector3.create();

  woggle.vector3.sub(direction, position, target);
  woggle.vector3.norm(zaxis, direction);
  woggle.vector3.cross(xaxis, up, zaxis);
  woggle.vector3.norm(xaxis, xaxis);
  woggle.vector3.cross(yaxis, zaxis, xaxis);

  woggle.matrix4.makeView(out, xaxis, yaxis, zaxis, position);
}

Matrix4.prototype.toString = function(inp)
{
  return "|" + inp[0] + " " + inp[4] + " " + inp[8] + " " + inp[12] + "|\n" +
         "|" + inp[1] + " " + inp[5] + " " + inp[9] + " " + inp[13] + "|\n" +
         "|" + inp[2] + " " + inp[6] + " " + inp[10] + " " + inp[14] + "|\n" +
         "|" + inp[3] + " " + inp[7] + " " + inp[11] + " " + inp[15] + "|\n"; 
}