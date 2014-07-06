'use strict'

var crypto = require('crypto')

var COLOR = {
	RED: 'red',
	GREEN: 'green',
	BLUE: 'blue',
	BLACK: 'black'
}

// Length constants
var LENGTH = {
	SHORT: 1,
	MEDIUM: 2,
	LONG: 3
}

// Decoder type constants
var DECODER = {
	STANDARD: 0,
	NUMERIC: 1,
	STRONG: 2
}

module.exports = {
	pash: pash,
	COLOR: COLOR,
	LENGTH: LENGTH,
	DECODER: DECODER,
	_PBKDF: PBKDF,
	_KeyStream: KeyStream
}

var alphabets = {
	a: 'abcdefghijklmnopqrstuvwxyz',
	A: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'0': '0123456789',
	$: '!#$%&()*+,-./:;<=>?@[]_{|}'
}

function KeyStream(password, userName, serviceName, color) {

	this._bits = []
	this._password = new Buffer(password)
	this._userName = new Buffer(normalize(userName))
	this._serviceName = new Buffer(normalize(serviceName))
	this._color = new Buffer(normalize(color))
	this._blockIndex = 0

}

// Make the new block and add it to bits array
KeyStream.prototype._getBlock = function () {

	var A = PBKDF(this._password, this._userName, this._blockIndex),
		B = PBKDF(A, this._serviceName, this._blockIndex),
		C = PBKDF(B, this._color, this._blockIndex)
	this._blockIndex++

	var i, j
	for (i = 0; i < C.length; i++) {
		for (j = 7; j >= 0; j--) {
			this._bits.push((C[i] >> j) & 1)
		}
	}
	return C
}

KeyStream.prototype.getChar = function (alphabet) {

	var value, bits, i
	do {
		bits = this._getBits(log2(alphabet.length))
		value = 0
		for (i = 0; i < bits.length; i++) {
			value <<= 1
			value |= bits[i]
		}
	} while (value >= alphabet.length)

	return alphabet[value]

}

// return the next numberOfBits bits from bits array
KeyStream.prototype._getBits = function (numberOfBits) {

	while (this._bits.length < numberOfBits) {
		this._getBlock()
	}
	return this._bits.splice(0, numberOfBits)

}

function log2(number) {
	switch (number) {
	case 26:
		return 5
	case 36:
		return 6
	case 10:
		return 4
	case 88:
		return 7
	default:
		throw new Error('Unexpected value on log2: ' + number)
	}
}

// remove all spaces and make it lower Case
function normalize(string) {
	return string.replace(/\s+/g, '').toLowerCase()
}

// key is a buffer, message is a buffer
// returns a HAMAC-SHA256 buffer
function HMACSHA256(key, message) {

	var HMAC = crypto.createHmac('sha256', key)
	HMAC.end(message)
	return HMAC.read()

}

// key is a buffer, salt is a buffer and blockIndex is a integer(starting at 0)
// returns a 32 bytes buffer
function PBKDF(key, salt, blockIndex) {

	var i, j,
		interations = 1000,
		result,
		previous = new Buffer(32),
		blockIndexBuffer = new Buffer(4)
	blockIndexBuffer.writeUInt32BE(blockIndex + 1, 0)
	result = previous = HMACSHA256(key, Buffer.concat([salt, blockIndexBuffer]))

	for (i = 2; i <= interations; i++) {
		previous = HMACSHA256(key, previous)

		for (j = 0; j < 32; j++) {
			result[j] ^= previous[j]
		}
	}

	return result

}

//password, userName, serviceName, color are strings
function pash(password, userName, serviceName, color, formatType, length) {

	var keyStream = new KeyStream(password, userName, serviceName, color)
	return formatter(keyStream, formatType, length)
}

function formatter(keyStream, formatType, length) {

	switch (formatType) {
	case DECODER.STANDARD:
		return standardFormatter(keyStream, length)
	case DECODER.NUMERIC:
		return numericFormatter(keyStream, length)
	case DECODER.STRONG:
		return strongFormatter(keyStream, length)
	}
	/*
	Output length and entropy:
+---------+----------------------------+
|         |Length                      |
|Type     +--------+---------+---------+
|(Rule)   |Short   |Medium   |Long     |
+---------+--------+---------+---------+
|Standard |5 chars |10 chars |15 chars |
|(A | a0) |24 bits |51 bits  |77 bits  |
+---------+--------+---------+---------+
|Numeric  |4 chars |8 chars  |12 chars |
|(0)      |13 bits |26 bits  |39 bits  |
+---------+--------+---------+---------+
|Strong   |7 chars |14 chars |21 chars |
|(Aa0$)   |35 bits |71 bits  |105 bits |
+---------+--------+---------+---------+
*/
}

// Standard:+---------+--------+---------+---------+
//|Standard |5 chars |10 chars |15 chars |
//|(A | a0) |24 bits |51 bits  |77 bits  |
//+---------+--------+---------+---------+
function standardFormatter(keyStream, length) {
	var str = ''
	var alphabet = alphabets.A
	str += keyStream.getChar(alphabet)

	alphabet = alphabets.a + alphabets['0']
	while (str.length < length * 5) {
		str += keyStream.getChar(alphabet)
	}

	if (str.match(/[a-z]/) && str.match(/\d/)) {
		return str
	} else {
		return standardFormatter(keyStream, length)
	}
}

function numericFormatter(keyStream, length) {
	var str = ''
	var alphabet = alphabets['0']

	while (str.length < length * 4) {
		str += keyStream.getChar(alphabet)
	}

	return str

}


//|Strong   |7 chars |14 chars |21 chars |
//|(Aa0$)   |35 bits |71 bits  |105 bits |
function strongFormatter(keyStream, length) {
	var str = ''
	var alphabet = alphabets.A + alphabets.a + alphabets['0'] + alphabets.$

	while (str.length < length * 7) {
		str += keyStream.getChar(alphabet)
	}

	if (str.match(/[A-Z]/) && str.match(/[a-z]/) && str.match(/\d/) && str.match(/[^0-9a-zA-Z]/)) {
		return str
	} else {
		return strongFormatter(keyStream, length)
	}

}