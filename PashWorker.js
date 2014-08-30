/*globals Module, importScripts, self*/
'use strict'

// Import and bind pbkdf
importScripts('pbkdf_min.js')

/**
 * Implemented by https://github.com/sitegui/pbkdf-sha256-asm/
 * @function
 * @param {string} password
 * @param {string} salt
 * @param {number} blockIndex
 * @param {number} rounds
 * @returns {string} 64-char hex-encoded string
 */
var pbkdf = Module.cwrap('pbkdf_simple', 'string', ['string', 'string', 'number', 'number'])

/**
 * Alphabet type constants
 */
var alphabets = {
	a: 'abcdefghijklmnopqrstuvwxyz',
	A: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'0': '0123456789',
	$: '!#$%&()*+,-./:;<=>?@[]_{|}'
}

/** @type {Object<number>} */
var hexMap = Object.create(null)

var i, j
for (i = 0; i < 16; i++) {
	for (j = 0; j < 16; j++) {
		hexMap[i.toString(16) + j.toString(16)] = 16 * i + j
	}
}

/**
 * Treat an incoming message to apply the PASH algorithm
 * @param {Event} event
 */
self.onmessage = function (event) {
	var data = event.data,
		pash = new Pash(data.masterPassword, data.userName, data.serviceName, data.color),
		result

	if (data.format === Pash.FORMAT.NUMERIC) {
		result = pash.getNumericPassword(data.length)
	} else if (data.format === Pash.FORMAT.STANDARD) {
		result = pash.getStandardPassword(data.length)
	} else if (data.format === Pash.FORMAT.STRONG) {
		result = pash.getStrongPassword(data.length)
	} else if (data.format === Pash.FORMAT.RAW) {
		result = pash.getRawPassword()
	} else {
		result = ''
	}

	self.postMessage({
		result: result,
		tag: data.tag
	})
}

/**
 * Create a PASH object from normalized inputs
 * @class
 * @param {string} masterPassword
 * @param {string} userName
 * @param {string} serviceName
 * @param {string} color
 */
function Pash(masterPassword, userName, serviceName, color) {
	/** @member {string} */
	this.masterPassword = masterPassword

	/** @member {string} */
	this.salt = userName + '\n' + serviceName + '\n' + color

	/** @member {Uint8Array} */
	this.block = null

	/**
	 * Bit position (8 bit = 1 Byte)
	 * @member {number}
	 */
	this.streamPos = 0
}

/**
 * Output format type constants
 * @enum {number}
 */
Pash.FORMAT = {
	STANDARD: 0,
	NUMERIC: 1,
	STRONG: 2,
	RAW: 3
}

/**
 * Return a string with at least 1 upper-case letter, 1 lower-case letter and 1 digit
 * @param {number} length one of Pash.LENGTH.* constants
 * @returns {string}
 */
Pash.prototype.getStandardPassword = function (length) {
	var alphabet, str, i, hasa, has0, c

	alphabet = alphabets.a + alphabets['0']
	length *= 5
	do {
		// The first char is an upper-case letter
		str = this.chooseRandom(alphabets.A)

		// Pick random from a0
		hasa = has0 = false
		for (i = 1; i < length; i++) {
			c = this.chooseRandom(alphabet)
			str += c
			hasa = hasa || alphabets.a.indexOf(c) !== -1
			has0 = has0 || alphabets['0'].indexOf(c) !== -1
		}
	} while (!hasa || !has0) // Try again

	return str
}

/**
 * Return a string composed only of numbers
 * @param {number} length one of Pash.LENGTH.* constants
 * @returns {string}
 */
Pash.prototype.getNumericPassword = function (length) {
	var i, str = ''

	// Pick random digits
	length *= 4
	for (i = 0; i < length; i++) {
		str += this.chooseRandom(alphabets['0'])
	}

	return str
}

/**
 * Return a string with at least 1 upper-case letter, 1 lower-case letter, 1 digit and 1 symbol
 * @param {number} length one of Pash.LENGTH.* constants
 * @returns {string}
 */
Pash.prototype.getStrongPassword = function (length) {
	var alphabet, str, i, hasA, hasa, has0, has$, c

	alphabet = alphabets.A + alphabets.a + alphabets['0'] + alphabets.$
	length *= 7
	do {
		str = ''

		// Pick random from Aa0$
		hasA = hasa = has0 = has$ = false
		for (i = 0; i < length; i++) {
			c = this.chooseRandom(alphabet)
			str += c
			hasA = hasA || alphabets.A.indexOf(c) !== -1
			hasa = hasa || alphabets.a.indexOf(c) !== -1
			has0 = has0 || alphabets['0'].indexOf(c) !== -1
			has$ = has$ || alphabets.$.indexOf(c) !== -1
		}
	} while (!hasA || !hasa || !has0 || !has$) // Try again

	return str
}

/**
 * Return a string with 64 hex chars
 * @returns {string}
 */
Pash.prototype.getRawPassword = function () {
	return this.getKeyBlock(0, true)
}

/**
 * Return the next n bits from the key stream
 * If needed, a new key block will be generated
 * @param {number} n 1<=n<=32
 * @returns {number} the first bit is the most significant
 */
Pash.prototype.getNextBits = function (n) {
	var result = 0,
		bitPosInBlock, i, bytePosInBlock, bitPosInByte, byte, bit

	// Extract each bit
	for (i = 0; i < n; i++) {
		bitPosInBlock = this.streamPos & 0xFF
		if (bitPosInBlock === 0) {
			// Load this block
			this.block = this.getKeyBlock(this.streamPos >>> 8)
		}

		// Get the bit
		bytePosInBlock = bitPosInBlock >>> 3
		bitPosInByte = bitPosInBlock & 0x7
		byte = this.block[bytePosInBlock]
		bit = (byte >>> (7 - bitPosInByte)) & 0x1

		// Add to result
		result <<= 1
		result |= bit

		// Increment
		this.streamPos++
	}

	return result
}

/**
 * Return a integer random value 0 <= r < max
 * The random value is derived from the key stream and is close to a uniform distribuition
 * @param {number} max must be greater than 1 and smaller than 2^32
 * @returns {number}
 */
Pash.prototype.getNextRandom = function (max) {
	// Take ceil(log2(max))
	var nBits = 0,
		temp = max - 1
	while (temp) {
		temp >>>= 1
		nBits++
	}

	// Find the next valid value
	var r
	do {
		r = this.getNextBits(nBits)
	} while (r >= max)

	return r
}

/**
 * Return a random element from the given array
 * @param {Array} array
 * @returns {*}
 */
Pash.prototype.chooseRandom = function (array) {
	return array[this.getNextRandom(array.length)]
}

/**
 * Generate the n-th key block
 * @param {number} index block index (0=first block)
 * @param {boolean} [returnAsString=false]
 * @returns {Uint8Array|string} with 256 bits (32 bytes)
 */
Pash.prototype.getKeyBlock = function (index, returnAsString) {
	var hexStr = pbkdf(this.masterPassword, this.salt, index, 1e4),
		block, i
	if (returnAsString) {
		return hexStr
	}
	block = new Uint8Array(32)
	for (i = 0; i < 32; i++) {
		block[i] = hexMap[hexStr.substr(2 * i, 2)]
	}
	return block
}