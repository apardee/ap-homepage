var gl;
var lineBuffer;

function drawLine(start, end) {
	if (!lineBuffer) {
		lineBuffer = gl.createBuffer();
	}
	
	var vertArray = start.concat(end);
	gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertArray), gl.DYNAMIC_DRAW);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.LINES, 0, 2);
}

function loadJson(address, successCallback, failCallback) {
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200 || this.status == 0) {
				var jsonObject = JSON.parse(req.responseText);
				successCallback(jsonObject);
			}
			else {
				if (failCallback != null) {
					failCallback();
				}
			}
		}
	}
	req.open('GET', address, false);
	req.send();
}

function loadShader(address, shaderType, successCallback, failCallback) {
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200 || this.status == 0) {
				var shader = gl.createShader(shaderType);
				gl.shaderSource(shader, req.responseText);
				gl.compileShader(shader);
				var output = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
				if (output) {
					successCallback(shader);
			    }
				else {
					alert(gl.getShaderInfoLog(shader));
					if (failCallback != null) {
						failCallback();
					}
				}
			}
			else {
				if (failCallback != null) {
					failCallback();
				}
			}
		}
	}
	req.open('GET', address, false);
	req.send();
}

function createShaderProgram(vertexPath, fragmentPath) {
	var vertex;
	var fragment;
	
	loadShader(vertexPath, gl.VERTEX_SHADER, function(shader) { 
		vertex = shader;
	});
	loadShader(fragmentPath, gl.FRAGMENT_SHADER, function(shader) {
		fragment = shader;
	});
	
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertex);
	gl.attachShader(shaderProgram, fragment);
	gl.linkProgram(shaderProgram);
	gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
	
	return shaderProgram;
}

function webGLStart() {
	var canvas = document.getElementById("gameCanvas");
	
	var anim;
	var skel;
	var model;
	
	// Load the character assets.
	loadJson('./data/model.json', function(result) { model = result; });
	loadJson('./data/animation.json', function(result) { anim = result; });
	loadJson('./data/skeleton.json', function(result) { skel = result; });
	
	var blender = AnimationBlender(skel);
	
	gl = canvas.getContext("experimental-webgl");
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	
	var shaderProgram = createShaderProgram('./shader/skinnedVertexShader.glsl', './shader/skinnedFragmentShader.glsl');
	gl.useProgram(shaderProgram);
	
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	
	shaderProgram.blendWeightAttribute = gl.getAttribLocation(shaderProgram, "blendWeight");
	gl.enableVertexAttribArray(shaderProgram.blendWeightAttribute);
	
	shaderProgram.blendIndexAttribute = gl.getAttribLocation(shaderProgram, "blendIndex");
	gl.enableVertexAttribArray(shaderProgram.blendIndexAttribute);
	
	shaderProgram.projection = gl.getUniformLocation(shaderProgram, "projection");
	shaderProgram.modelView = gl.getUniformLocation(shaderProgram, "modelView");
	
	// Buffer vertices.
	var triangleVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
	
	// Buffer indices.
	var triangleIndexBuffer = gl.createBuffer();
	triangleIndexBuffer.indexCount = model.indices.length;
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
	
	var blendWeightBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, blendWeightBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.blendWeights), gl.STATIC_DRAW);
	
	var blendIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, blendIndexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.blendIndices), gl.STATIC_DRAW);
	
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	
	var rotAngle = 0;
	var animTime = 0;
	
	var modelView = mat4.create();
	var projection = mat4.create();
	
	function drawScene() {
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		rotAngle += 0.02;

		var modelView = mat4.create();
		mat4.identity(modelView);
		mat4.translate(modelView, [0.0, -1.0, -4.2], modelView);
		mat4.rotate(modelView, rotAngle, [0, 1, 0], modelView);
		
		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0, projection);

		// Set up shader parameters.
		gl.uniformMatrix4fv(shaderProgram.projection, false, projection);
		gl.uniformMatrix4fv(shaderProgram.modelView, false, modelView);
		
		animTime += 15;
		blender.sampleAnimation(anim, animTime);
		blender.concatenateTransforms();

		var blendPalette = gl.getUniformLocation(shaderProgram, "blendPalette");
		gl.uniformMatrix4fv(blendPalette, false, blender.blendPalette.storage);

		// Set up shader parameters.
		gl.uniformMatrix4fv(shaderProgram.projection, false, projection);
		gl.uniformMatrix4fv(shaderProgram.modelView, false, modelView);

		gl.bindBuffer(gl.ARRAY_BUFFER, blendIndexBuffer);
		gl.vertexAttribPointer(shaderProgram.blendIndexAttribute, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, blendWeightBuffer);
		gl.vertexAttribPointer(shaderProgram.blendWeightAttribute, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);
		gl.drawElements(gl.LINES, triangleIndexBuffer.indexCount, gl.UNSIGNED_SHORT, 0);
	}
	
	setInterval(drawScene, 15);
}