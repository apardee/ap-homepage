var GameEntry = (function() {

var requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(callback) {
              		window.setTimeout(callback, 1000 / 30);
              };
})();

var GameState = {
	ORBIT_INTRO : 0,
	ORBIT_PLACING : 1,
	ORBIT_WINDUP : 2,
	ORBIT_ACTIVE : 3,
	ORBIT_FINISHED : 4
};

var GameVars = {
	gameState : GameState.ORBIT_INTRO,

	mousePos : [ 0, 0 ],
	mouseDownPos : [ 0, 0 ],
	mouseUpPos : [ 0, 0 ],

	maxLength : 80,
	maxDistance : 2000,

	iterations : 0,
	finalScore : 0,

	fontSizeScale : 1.0,
	lastRevolutions : -1,
	labelColor : "#cccccc",

	planet : {
		radius : 50,
		pos : [ 0, 0 ],
		img : null
	},

	thrownObject : null
};

var HighScores = {
	today : 0,
	local : 0
};

function length(vec) {
	return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
}

function distance(vec1, vec2) {
	var x = vec2[0] - vec1[0];
	var y = vec2[1] - vec1[1];
	return length([x, y]);
}
function normalize(vec) {
	var len = length(vec);
	return [ vec[0] / len, vec[1] / len ];
}

function direction(vec1, vec2) {
	var x = vec2[0] - vec1[0];
	var y = vec2[1] - vec1[1];
	return normalize([ x, y ]);
}

function update() {
	if (GameVars.gameState == GameState.ORBIT_PLACING) {
		GameVars.thrownObject.pos = GameVars.mousePos;
	}
	else if (GameVars.gameState == GameState.ORBIT_WINDUP) {
		GameVars.thrownObject.pos = GameState.mouseDownPos;
	}

	if (GameVars.gameState == GameState.ORBIT_ACTIVE) {
		var obj = GameVars.thrownObject;

		var curPos = obj.pos;
		var curVel = obj.vel;
		var planetPos = GameVars.planet.pos;

		var prevDir = direction(planetPos, curPos);

		var dist = distance(curPos, planetPos);
		var dir = direction(curPos, planetPos);
		var force = 3000.0 / ((dist * dist) + 500.0);

		curVel[0] += dir[0] * force;
		curVel[1] += dir[1] * force;

		curPos[0] += curVel[0];
		curPos[1] += curVel[1];

		// Cheat here a little bit to make the mechanics more interesting.
		// Basically, dampen the velocity away from the planet.
		// This forces the orbit into a spiral, but avoids the ease of putting the object into
		// an elliptical orbit, rewarding more circular orbits.
		var velDir = normalize(curVel);
		var otherDir = direction(planetPos, curPos);
		var dampenFactor = Math.max(velDir[0] * otherDir[0] + velDir[1] * otherDir[1], 0) * 0.05;
		curVel[0] = curVel[0] - curVel[0] * dampenFactor;
		curVel[1] = curVel[1] - curVel[1] * dampenFactor;

		// Add the accumulated travelled distance.
		var angle = Math.acos(otherDir[0] * prevDir[0] + otherDir[1] * prevDir[1]);
		obj.degreesAccum = obj.degreesAccum + angle;

		var collideDist = distance(curPos, planetPos);
		if (collideDist < obj.radius + GameVars.planet.radius) {
			GameVars.gameState = GameState.ORBIT_FINISHED;
			GameVars.finalScore = GameVars.thrownObject.degreesAccum / (2 * Math.PI);
			GameVars.finalScore = Math.floor(GameVars.finalScore);

			GameVars.thrownObject = null;
			jostleSun();

			// Set new high scores if it applies.
			if (GameVars.finalScore > HighScores.local) {
				HighScores.local = GameVars.finalScore;
			}
			
			scaleNumberLabel(5.0, function() {
				scaleNumberLabel(1.0, function() {
					GameVars.gameState = GameState.ORBIT_PLACING;
					GameVars.thrownObject = {
						radius : 6,
						pos : [ 0, 0 ],
						vel : [ 0, 0 ],
						degreesAccum : 0
					};
				}, 0.3, 0.02);
				animateLabel("ff", "cc");
			}, 0.3, 0.02);
			animateLabel("cc", "ff");
		}
	}
}

function animateLabel(fromColor, toColor) {
	var rate = 25;
	var currentVal = parseInt(fromColor, 16);
	var maxVal = parseInt(toColor, 16);
	if (maxVal < currentVal) {
		rate *= -1;
	}

	var interval = window.setInterval(function() {
		currentVal += rate;
		if ((rate > 0 && currentVal >= maxVal) ||
			(rate < 0 && currentVal <= maxVal)) {
			window.clearInterval(interval);
			currentVal = maxVal;
		}

		var hexString = currentVal.toString(16);
		GameVars.labelColor = "#" + hexString + hexString + hexString;
	}, 33);
}

function interp(initial, fin, time, completeBlock) {
	var initialPos = [ initial[0], initial[1] ];
	var elapsed = 0;

	var interval = window.setInterval(function() {
		elapsed += 33;
		if (elapsed >= time) {
			window.clearInterval(interval);
			elapsed = time;
			if (completeBlock) {
				completeBlock();
			}
		}

		var ratio = elapsed / time;
		initial[0] = initialPos[0] + (fin[0] - initialPos[0]) * ratio;
		initial[1] = initialPos[1] + (fin[1] - initialPos[1]) * ratio;

	}, 33);
}

function jostleSun(completeBlock) {
	var originalPos = GameVars.planet.pos;
	var jostleRadius = 10.0;

	var jostlePoint = function() {
		var jostleOffsetX = Math.random() * (jostleRadius * 2) - jostleRadius;
		var jostleOffsetY = Math.random() * (jostleRadius * 2) - jostleRadius;
		return [ originalPos[0] + jostleOffsetX, originalPos[1] + jostleOffsetY ];
	}

	var newPos = [ originalPos[0] + 5, originalPos[1] + 5 ];
	var interval = 50;

	var pts = [];
	for (var i = 0; i < 5; ++i) {
		pts.push(jostlePoint());
	}

	var ptIndex = 0;
	var nextPoint = function() {
		if (ptIndex < pts.length) {
			interp(GameVars.planet.pos, pts[ptIndex], interval, nextPoint);
			ptIndex++;
		}
		else {
			interp(GameVars.planet.pos, originalPos, interval, function() {
				if (completeBlock) {
					completeBlock();
				}
			});
		}
	}
	nextPoint();
}

function scaleNumberLabel(scaleVal, completeBlock, rate, decel) {
	rate = rate || 0.08;
	decel = decel || 0;

	var originalScale = GameVars.fontSizeScale;
	if (GameVars.fontSizeScale >= scaleVal) {
		rate *= -1;
		decel *= -1;
	}

	var interval = window.setInterval(function() {
		var complete = false;
		GameVars.fontSizeScale += rate;
		if ((rate >= 0 && GameVars.fontSizeScale >= scaleVal) ||
		 	(rate < 0 && GameVars.fontSizeScale < scaleVal)) {
			complete = true;
		}

		if (complete) {
			if (completeBlock) {
				completeBlock();
			}
			window.clearInterval(interval);
		}

		rate -= decel;
	}, 33);
}

function pulseFontScale() {
	scaleNumberLabel(1.5, function() {
			scaleNumberLabel(1.0);
		}, 0.15);
}

function fadeIn(element, completeBlock) {
	var interval = window.setInterval(function() {
			var opacity = parseFloat(element.style.opacity);
			var newOpacity = (opacity + 0.05).toFixed(2);
			element.style.opacity = newOpacity;

			if (newOpacity >= 1.0) {
				window.clearInterval(interval);

				if (completeBlock) {
					completeBlock();
				}
			}
		}, 33);
}

function fadeOut(element, completeBlock) {
	var interval = window.setInterval(function() {
			var opacity = parseFloat(element.style.opacity);
			var newOpacity = (opacity - 0.05).toFixed(2);
			element.style.opacity = newOpacity;

			if (newOpacity <= 0.0) {
				window.clearInterval(interval);
				if (completeBlock) {
					completeBlock();
				}
			}
		}, 33);
}

function drawOrbitPosition(context, pos, radius) {
	context.fillStyle = "#ffffff";
	context.beginPath();
	context.arc(pos[0], pos[1], radius, 0, 2 * Math.PI, false);
	context.closePath();
	context.fill();
}

function draw(oldPos) {
	var canvas = document.getElementById('gameBoard');
	var context = canvas.getContext('2d');

	var width = window.innerWidth;
	var height = window.innerHeight;

	context.clearRect(0, 0, width, height);

	if (GameVars.gameState == GameState.ORBIT_WINDUP) {
		context.strokeStyle = "#ffffff";

		var dir = direction(GameVars.mousePos, GameState.mouseDownPos);
		var dist = Math.min(distance(GameVars.mousePos, GameState.mouseDownPos), GameVars.maxLength);
		var endPos = [ GameState.mouseDownPos[0] + dir[0] * dist, GameState.mouseDownPos[1] + dir[1] * dist ];

		//context.lineWidth = 3;
		context.moveTo(GameState.mouseDownPos[0], GameState.mouseDownPos[1]);
		context.lineTo(endPos[0], endPos[1]);
		context.closePath();
		context.stroke();
	}

	context.fillStyle = "#ec4343";
	context.strokeStyle = "#00bff3";
	context.lineWidth = 2;

	var trailCanvas = document.getElementById('gameTrail');
	var trailContext = trailCanvas.getContext('2d');

	if (GameVars.thrownObject) {
		drawOrbitPosition(context, GameVars.thrownObject.pos, GameVars.thrownObject.radius);

		if (GameVars.gameState == GameState.ORBIT_ACTIVE) {
			trailContext.save();
			trailContext.fillStyle = "#aaaaaa";
			trailContext.beginPath();
			trailContext.arc(GameVars.thrownObject.pos[0], GameVars.thrownObject.pos[1], 1, 0, 2 * Math.PI, false);
			trailContext.closePath();
			trailContext.fill();

			trailContext.restore();
		}
		else if (GameVars.gameState == GameState.ORBIT_WINDUP) {
			trailContext.fillStyle = "rgba(15, 15, 15, 0.06)"
			trailContext.fillRect(0, 0, width, height);
		}
	}

	var radius = GameVars.planet.radius;
	var planetX = GameVars.planet.pos[0];
	var planetY = GameVars.planet.pos[1];

	context.strokeStyle = "white";
	context.beginPath();
	context.arc(planetX, planetY, radius, 0, 2 * Math.PI, false);
	context.closePath();
	context.stroke();

	if (GameVars.thrownObject || GameVars.finalScore != null) {
		var revolutions;
		if (GameVars.finalScore != null) {
			revolutions = GameVars.finalScore;
		}
		else {
			revolutions =  GameVars.thrownObject.degreesAccum / (2 * Math.PI);
			revolutions = Math.floor(revolutions);
			if (GameVars.lastRevolutions != revolutions) {
				pulseFontScale();
				GameVars.lastRevolutions = revolutions;
			}
		}

		context.fillStyle = GameVars.labelColor;
		context.font = (50 * GameVars.fontSizeScale) + "px HelveticaNeue";

		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(revolutions.toFixed(0), GameVars.planet.pos[0], GameVars.planet.pos[1]);
	}


	// Score Drawing
	{
		var offset = 55;
		var radius = 35;
		var scorePos = [ offset, canvas.height - offset ];

		context.fillStyle = "#dddddd";
		context.strokeStyle = "#dddddd";
		context.lineWidth = 2;

		function drawScoreBubble(pos) {
			context.beginPath();
			context.arc(pos[0], pos[1], radius, 0, Math.PI * 2, true); 
			context.closePath();
			context.fill();

			context.beginPath();
			context.arc(pos[0], pos[1], radius + 5, 0, Math.PI * 2, true); 
			context.closePath();
			context.stroke();
		}

		drawScoreBubble(scorePos);

		context.fillStyle = "#222222";
		context.font = "30px Impact";
		context.textAlign = 'center';
		context.textBaseline = 'middle';

		context.fillText(HighScores.local, scorePos[0], scorePos[1]);

		context.fillStyle = "#222222";
		context.font = "9px Helvetica-Bold";
		context.textAlign = 'center';
		context.textBaseline = 'middle';

		context.fillText("high score", scorePos[0], scorePos[1] + 19);
	}
}

function drawBackground(context) {
	var canvas = document.getElementById('gameBackground');
	var width = window.innerWidth;
	var height = window.innerHeight;

	context.fillStyle = "#ffffff";
	for (var i = 0; i < 500; i++) {
		context.fillRect(Math.random() * width, Math.random() * height, 1, 1);
	}
}

// Touch event handling.
function updateMousePosForTouchEvent(touchEvent) {
	var touch = touchEvent.changedTouches[0];

	var x, y;
	x = touch.pageX;
	y = touch.pageY;
	GameVars.mousePos = [ x, y ];
}

function handleTouchMove(touchMoveEvent) {
	updateMousePosForTouchEvent(touchMoveEvent);
}

function handleTouchStart(touchStartEvent) {
	touchStartEvent.preventDefault();
	updateMousePosForTouchEvent(touchStartEvent);
	handleMouseDown();
}

function handleTouchEnd(e) {
	handleMouseUp();
}

// Mouse event handling.
function handleMouseMove(mouseMoveEvent) {
	var x, y;
	if (mouseMoveEvent.layerX || mouseMoveEvent.layerX == 0) {
		x = mouseMoveEvent.layerX;
		y = mouseMoveEvent.layerY;
	}
	else if (mouseMoveEvent.offsetX || mouseMoveEvent.offsetX == 0) {
	    x = ev.offsetX;
	    y = ev.offsetY;
	}
	GameVars.mousePos = [ x, y ];
}

function handleMouseDown() {
	if (GameVars.gameState == GameState.ORBIT_PLACING) {
		GameVars.gameState = GameState.ORBIT_WINDUP;
		GameState.mouseDownPos = GameVars.mousePos;
	}
}

function handleMouseUp() {
	var lengthScale = 0.05;
	if (GameVars.gameState == GameState.ORBIT_WINDUP) {
		var trailCanvas = document.getElementById('gameTrail');
		var trailContext = trailCanvas.getContext('2d');
		trailContext.fillStyle = "rgba(15, 15, 15, 1.0)"
		trailContext.fillRect(0, 0, window.innerWidth, window.innerHeight);

		GameVars.gameState = GameState.ORBIT_ACTIVE;
		GameVars.finalScore = null;

		var dir = direction(GameVars.mousePos, GameState.mouseDownPos);
		var len = Math.min(distance(GameVars.mousePos, GameState.mouseDownPos) * lengthScale, GameVars.maxLength);
		if (len <= 0) {
			dir = [ 1, 0 ];
			len = 0.01;
		}

		GameVars.mouseUpPos = GameVars.thrownObject.pos;

		GameVars.thrownObject.vel = [ dir[0] * len, dir[1] * len ];
		GameState.mouseDownPos = [ 0, 0 ];
	}
}

function handleWindowResize() {
	var canvas = document.getElementById('gameBoard');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var gameTrail = document.getElementById('gameTrail');
	gameTrail.width = window.innerWidth;
	gameTrail.height = window.innerHeight;

	var background = document.getElementById('gameBackground');
	background.width = window.innerWidth;
	background.height = window.innerHeight;

	GameVars.planet.pos = [ canvas.width / 2, canvas.height / 2 ];

	var backgroundContext = background.getContext('2d');
	drawBackground(backgroundContext);
}

function initializeGameVars() {
	GameVars.gameState = GameState.ORBIT_INTRO;
	GameVars.mousePos = [ -20, -20 ];
	GameState.mouseDownPos = [ 0, 0 ];
	GameVars.iterations = 0;
}

function startGame() {
	var canvas = document.getElementById('gameBoard');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var trail = document.getElementById('gameTrail');
	trail.width = window.innerWidth;
	trail.height = window.innerHeight;

	var background = document.getElementById('gameBackground');
	background.width = window.innerWidth;
	background.height = window.innerHeight;

	fadeIn(canvas);

	var container = document.getElementById('gameContainer');
	var ins1 = document.getElementById('instructionsLabel1');
	var ins2 = document.getElementById('instructionsLabel2');

	var instructionsStart = 1200;
	window.setTimeout(function() { fadeIn(ins1); }, instructionsStart);
	window.setTimeout(function() { fadeIn(ins2); }, instructionsStart + 2000);
	window.setTimeout(function() { fadeOut(ins1); }, instructionsStart + 2200);
	window.setTimeout(function() { fadeOut(ins2); }, instructionsStart + 6000);
	window.setTimeout(function() { 
		container.removeChild(ins1);
		container.removeChild(ins2);

		GameVars.gameState = GameState.ORBIT_PLACING;
		
		// Initialize the game objects.
		GameVars.thrownObject = {
			radius : 6,
			pos : [ 0, 0 ],
			vel : [ 0, 0 ],
			degreesAccum : 0
	};

	}, instructionsStart + 8000);

	initializeGameVars();
	GameVars.planet.pos = [ canvas.width / 2, canvas.height / 2 ];
	
	canvas.addEventListener('mouseup', handleMouseUp, false);
	canvas.addEventListener('mousemove', handleMouseMove, false);
	canvas.addEventListener('mousedown', handleMouseDown, false);

	canvas.addEventListener('touchstart', handleTouchStart, false);
	canvas.addEventListener('touchmove', handleTouchMove, false);
	canvas.addEventListener('touchend', handleTouchEnd, false);

	window.onresize = handleWindowResize;

	var backgroundContext = background.getContext('2d');
	drawBackground(backgroundContext);

	var gameLoop = function() {
		var oldPos = [0, 0];
		if (GameVars.thrownObject) {
			oldPos[0] = GameVars.thrownObject.pos[0];
			oldPos[1] = GameVars.thrownObject.pos[1];
		}
		update();
		draw(oldPos);
	}

	var animFrameLoop = function() {
		gameLoop();
		requestAnimFrame(animFrameLoop)
	}
	requestAnimFrame(animFrameLoop);
}

	return startGame;

})();