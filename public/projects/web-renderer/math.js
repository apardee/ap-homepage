function object(o) {
	function F() {}
	F.prototype = o;
	return new F();
}

var APJ = object(Object.prototype);
APJ.Matrix = function() {
	return {
		values: [1.0, 0.0, 0.0, 0.0,
				0.0, 1.0, 0.0, 0.0,
				0.0, 0.0, 1.0, 0.0,
				0.0, 0.0, 0.0, 1.0],
		getValue: function(row, column) {
			return this.values[(4 * row) + column];
		},
		setValue: function(row, column, value) {
			this.values[(4 * row) + column] = value;
		},
		setRow: function(row, vector) {
			for (var i = 0; i < 4; ++i) {
				this.setValue(row, i, vector.values[i]);
			}
		},
		setColumn: function(column, vector) {
			for (var i = 0; i < 4; ++i) {
				this.setValue(i, column, vector.values[i]);
			}
		},
		getRow: function(row) {
			return APJ.Vector(this.getValue(row, 0),
				this.getValue(row, 1),
				this.getValue(row, 2),
				this.getValue(row, 3));
		},
		getColumn: function(column) {
			return APJ.Vector(this.getValue(0, column),
				this.getValue(1, column),
				this.getValue(2, column),
				this.getValue(3, column));
		},
		setTranslation: function(x, y, z) {
			this.setColumn(3, APJ.Vector(x, y, z, 1.0));
		},
		multiplyMatrix: function(mat2) {
			var matReturn = APJ.Matrix();
			
			var a00 = this.getValue(0, 0);
			var a01 = this.getValue(0, 1);
			var a02 = this.getValue(0, 2);
			var a03 = this.getValue(0, 3);
				
			var a10 = this.getValue(1, 0);
			var a11 = this.getValue(1, 1);
			var a12 = this.getValue(1, 2);
			var a13 = this.getValue(1, 3);
			
			var a20 = this.getValue(2, 0);
			var a21 = this.getValue(2, 1);
			var a22 = this.getValue(2, 2);
			var a23 = this.getValue(2, 3);
			
			var a30 = this.getValue(3, 0);
			var a31 = this.getValue(3, 1);
			var a32 = this.getValue(3, 2);
			var a33 = this.getValue(3, 3);
			
			var b00 = mat2.getValue(0, 0);
			var b01 = mat2.getValue(0, 1);
			var b02 = mat2.getValue(0, 2);
			var b03 = mat2.getValue(0, 3);
				
			var b10 = mat2.getValue(1, 0);
			var b11 = mat2.getValue(1, 1);
			var b12 = mat2.getValue(1, 2);
			var b13 = mat2.getValue(1, 3);
			
			var b20 = mat2.getValue(2, 0);
			var b21 = mat2.getValue(2, 1);
			var b22 = mat2.getValue(2, 2);
			var b23 = mat2.getValue(2, 3);
			
			var b30 = mat2.getValue(3, 0);
			var b31 = mat2.getValue(3, 1);
			var b32 = mat2.getValue(3, 2);
			var b33 = mat2.getValue(3, 3);
			
			matReturn.setValue(0, 0, a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30);
			matReturn.setValue(1, 0, a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30);
			matReturn.setValue(2, 0, a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30);
			matReturn.setValue(3, 0, a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30);

			matReturn.setValue(0, 1, a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31);
			matReturn.setValue(1, 1, a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31);
			matReturn.setValue(2, 1, a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31);
			matReturn.setValue(3, 1, a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31);

			matReturn.setValue(0, 2, a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32);
			matReturn.setValue(1, 2, a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32);
			matReturn.setValue(2, 2, a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32);
			matReturn.setValue(3, 2, a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32);

			matReturn.setValue(0, 3, a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33);
			matReturn.setValue(1, 3, a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33);
			matReturn.setValue(2, 3, a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33);
			matReturn.setValue(3, 3, a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33);
			
			return matReturn;
		},
		multiplyVector: function(vector, vectorOut) {
			var values = this.values;
			var values2 = vector.values;
			var vectorOutValues = vectorOut.values;
			vectorOutValues[0] = values2[0] * values[0] +
				values2[1] * values[1] +
				values2[2] * values[2] +
				values2[3] * values[3];
			vectorOutValues[1] = values2[0] * values[4] +
				values2[1] * values[5] +
				values2[2] * values[6] +
				values2[3] * values[7];
			vectorOutValues[2] = values2[0] * values[8] +
				values2[1] * values[9] +
				values2[2] * values[10] +
				values2[3] * values[11];
			vectorOutValues[3] = values2[0] * values[12] +
				values2[1] * values[13] +
				values2[2] * values[14] +
				values2[3] * values[15];
		}
	}
}

APJ.Vector = function (x, y, z, w) {
	return {
		values: [ x, y, z, w ],
		setValues: function(x, y, z, w) {
			this.values[0] = x;
			this.values[1] = y;
			this.values[2] = z;
			this.values[3] = w;
		},
		addVector: function(v) {
			var value1 = this.values[0] + v.values[0];
			var value2 = this.values[1] + v.values[1];
			var value3 = this.values[2] + v.values[2];
			var value4 = this.values[3] + v.values[3];
			return APJ.Vector(value1, value2, value3, value4);
		},
		multiply: function(v) {
			this.values[0] *= v;
			this.values[1] *= v;
			this.values[2] *= v;
			this.values[3] *= v;
		},
		dot3: function(v) {
			return this.values[0] * v.values[0] + 
				this.values[1] * v.values[1] +
				this.values[2] * v.values[2];
		},
		cross3: function(v2) {
			var crossX = this.values[1] * v2.values[2] - v2.values[1] * this.values[2];
			var crossY = v2.values[2] * this.values[2] - this.values[0] * v2.values[2];
			var crossZ = this.values[0] * v2.values[1] - v2.values[0] * this.values[1];
			return APJ.Vector(crossX, crossY, crossZ, 1.0);
		}
	}
}