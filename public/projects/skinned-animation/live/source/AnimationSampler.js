// Contiguous array of Float32 matrices.
function Float32MatrixArray4(length) {
	var array = {
		storage : new Float32Array(length * 16),
		matrices : []
	}

	for (var i = 0; i < length; ++i) {
		var start = i * 16;
		var end = (i * 16) + 16;
		array.matrices.push(array.storage.subarray(start, end));
	}

	return array;
}

function AnimationBlender(skeleton) {
	var blender = {
		activeRecords: [],
		localPose : [],
		modelPose : [],
		blendPalette : new Float32MatrixArray4(skeleton.boneNames.length),
		tempTranslation : vec3.create(),
		tempRotation : quat4.create(),
		
		update : function(dt) {
			for (var i = 0; i < activeRecords.length; ++i) {
				// Update active records.
			}
		},
		
		sampleAnimation : function(anim, time) {
			for (var i = 0; i < skeleton.boneNames.length; ++i) {
				var myName = skeleton.boneNames[i];
				var prevIndex = 0;
				var nextIndex = 0;
				
				var loops = anim.time[anim.time.length - 1];
				var sampleTime = time % anim.time[anim.time.length - 1];
				for (var j = 0; j < anim.time.length; ++j) {
					if (anim.time[j] >= sampleTime) {
						prevIndex = j - 1;
						nextIndex = j;
						break;
					}
				}
				
				if (prevIndex < 0) {
					prevIndex = 0;
				}
				
				var previousTime = anim.time[prevIndex];
				var nextTime = anim.time[nextIndex];
				
				var ratio = 1.0;
				if (nextTime - previousTime !== 0.0) {
					ratio = (sampleTime - previousTime) / (nextTime - previousTime);
				}

				var nextTranslation = anim.tracks[myName].translations[nextIndex];
				var nextRotation = anim.tracks[myName].rotations[nextIndex];
				
				var prevTranslation = anim.tracks[myName].translations[prevIndex];
				var prevRotation = anim.tracks[myName].rotations[prevIndex];
				
				vec3.lerp(prevTranslation, nextTranslation, ratio, this.tempTranslation);
				quat4.lerp(prevRotation, nextRotation, ratio, this.tempRotation);
				quat4.normalize(this.tempRotation);
				
				mat4.fromTransform(this.tempRotation, this.tempTranslation, this.localPose[i]);
			}
		},
		
		concatenateTransforms : function() {
			var parentIndices = skeleton.parents;
			for (var i = 0; i < parentIndices.length; ++i) {
				var parentIndex = parentIndices[i];
				if (parentIndex != -1) {
					mat4.multiply(this.modelPose[parentIndex], this.localPose[i], this.modelPose[i]);
				}
				else {
					this.modelPose[i] = this.localPose[i];
				}
				
				mat4.multiply(this.modelPose[i], skeleton.inverseBindPose[i], this.blendPalette.matrices[i]);
			}
		}
	}
	
	for (var i = 0; i < skeleton.boneNames.length; ++i) {
		blender.localPose.push(mat4.create());
		blender.modelPose.push(mat4.create());
	}
	
	return blender;
}

function AnimationRecord(anim) {
	return {
		state : BlendingIn,
		blendTime : 0.3,
		blendWeight : 0.0,
		currentTime : 0.0,
		looping : true,
		animation : anim
	}
}
