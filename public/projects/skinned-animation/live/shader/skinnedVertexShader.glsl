attribute vec3 vertPosition;
attribute vec4 blendWeight;
attribute vec4 blendIndex;

varying vec4 color;

uniform mat4 modelView;
uniform mat4 projection;

// Blend matrices. Model space pose * inverse bind pose;
uniform mat4 blendPalette[30];

void main() {
	vec4 finalPosition = vec4(0.0, 0.0, 0.0, 0.0);
	vec4 currentIndex = blendIndex;
	vec4 currentWeight = blendWeight;
	vec4 currentPosition = vec4(vertPosition, 1.0);
	
	for (int i = 0; i < 4; i++) {
		int index = int(currentIndex.x);
		if (index != -1) {
			finalPosition += blendPalette[index] * currentPosition * currentWeight.x;
		}
		
		currentIndex = currentIndex.yzwx;
		currentWeight = currentWeight.yzwx;
	}
	
	gl_Position = projection * modelView * finalPosition;
	color = vec4(0.4, 0.4, 0.4, 1.0);
}
