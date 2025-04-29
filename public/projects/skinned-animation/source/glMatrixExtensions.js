// Correct the toMat4 function.
quat4.toMat4 = function(quat, dest) {
        if(!dest) { dest = mat4.create(); }
        
        var x = quat[0], y = quat[1], z = quat[2], w = quat[3];

        var x2 = x + x;
        var y2 = y + y;
        var z2 = z + z;

        var xx = x*x2;
        var xy = x*y2;
        var xz = x*z2;

        var yy = y*y2;
        var yz = y*z2;
        var zz = z*z2;

        var wx = w*x2;
        var wy = w*y2;
        var wz = w*z2;

        dest[0] = 1 - (yy + zz);
		dest[1] = xy + wz;
		dest[2] = xz - wy;
		dest[3] = 0;

        dest[4] = xy - wz;
		dest[5] = 1 - (xx + zz);
		dest[6] = yz + wx;
		dest[7] = 0;

        dest[8] = xz + wy;
        dest[9] = yz - wx;
        dest[10] = 1 - (xx + yy);
        dest[11] = 0;

        dest[12] = 0;
        dest[13] = 0;
        dest[14] = 0;
        dest[15] = 1;
        
        return dest;
}

// Add linear interpolation functions for vec3 and quaternion.
vec3.lerp = function(vec1, vec2, ratio, dest) {
	if (!dest) {
		dest = vec1;
	}
	
	dest[0] = vec1[0] + (vec2[0] - vec1[0]) * ratio;
	dest[1] = vec1[1] + (vec2[1] - vec1[1]) * ratio;
	dest[2] = vec1[2] + (vec2[2] - vec1[2]) * ratio;
	
	return dest;
}

quat4.lerp = function(quat1, quat2, ratio, dest) {
	if (!dest) {
		dest = quat1;
	}
	
	dest[0] = quat1[0] + (quat2[0] - quat1[0]) * ratio;
	dest[1] = quat1[1] + (quat2[1] - quat1[1]) * ratio;
	dest[2] = quat1[2] + (quat2[2] - quat1[2]) * ratio;
	dest[3] = quat1[3] + (quat2[3] - quat1[3]) * ratio;
	
	return dest;
}

mat4.setTranslation = function(mat, translation, dest) {
	if (!dest) {
		dest = mat;
	}
	
	dest[12] = translation[0];
	dest[13] = translation[1];
	dest[14] = translation[2];
	dest[15] = 1.0; //translation[3];
	
    return dest;
};

// Convert quaternion / translation to a 4x4 matrix.
mat4.fromTransform = function(quat, trans, matrix) {
	quat4.toMat4(quat, matrix);
	mat4.setTranslation(matrix, trans);
}
