/*globals CryptoJS, importScripts, self*/
'use strict'

importScripts('sha256.js', 'pbkdf2.js')

// Alphabet type constants
var alphabets = {
	a: 'abcdefghijklmnopqrstuvwxyz',
	A: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'0': '0123456789',
	$: '!#$%&()*+,-./:;<=>?@[]_{|}'
}

// Treat an incoming message to apply the PASH algorithm
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
	} else {
		result = ''
	}

	self.postMessage({
		result: result,
		tag: data.tag
	})
}

// Create a PASH object from normalized inputs
function Pash(masterPassword, userName, serviceName, color) {
	var parse = CryptoJS.enc.Utf8.parse

	// Encode
	this.userName = parse(userName)
	this.masterPassword = parse(masterPassword)
	this.serviceName = parse(serviceName)
	this.color = parse(color)

	// Store info about key blocks to let them be accessed as a stream of bits
	this.block = this.getKeyBlock(0)
	this.streamPos = 0 // bit pos (8 bit = 1 Byte)
}

// Output format type constants
Pash.FORMAT = {
	STANDARD: 0,
	NUMERIC: 1,
	STRONG: 2
}

// Return a string with at least 1 upper-case letter, 1 lower-case letter and 1 digit
// length is one of Pash.LENGTH.* constants
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

// Return a string composed only of numbers
// length is one of Pash.LENGTH.* constants
Pash.prototype.getNumericPassword = function (length) {
	var i, str = ''

	// Pick random digits
	length *= 4
	for (i = 0; i < length; i++) {
		str += this.chooseRandom(alphabets['0'])
	}

	return str
}

// Return a string with at least 1 upper-case letter, 1 lower-case letter, 1 digit and 1 symbol
// length is one of Pash.LENGTH.* constants
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

/*
Internals
*/

// Return the next n (1<=n<=32) bits from the key stream
// If needed, a new key block will be generated
// Return a Number (the first bit is the most significant)
Pash.prototype.getNextBits = function (n) {
	var bitPosInBlock = this.streamPos & 0xFF,
		i, wordPosInBlock, bitPosInWord, word, bit, result = 0

	// Extract each bit
	for (i = 0; i < n; i++) {
		// Get the bit
		wordPosInBlock = bitPosInBlock >>> 5
		bitPosInWord = bitPosInBlock & 0x1F
		word = this.block.words[wordPosInBlock]
		bit = (word >>> (31 - bitPosInWord)) & 0x1

		// Add to result
		result <<= 1
		result |= bit

		// Increment
		this.streamPos++
		bitPosInBlock++

		if (bitPosInBlock === 256) {
			// Load next block
			bitPosInBlock = 0
			this.block = this.getKeyBlock(this.streamPos >>> 8)
		}
	}

	return result
}

// Return a integer random value 0 <= r < max
// The random value is derived from the key stream and is close to a uniform distribuition
// max must be greater than 1 and smaller than 2^32
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

// Return a random element from the given array
Pash.prototype.chooseRandom = function (array) {
	return array[this.getNextRandom(array.length)]
}

// Generate the n-th key block (0=first block) as a WordArray
Pash.prototype.getKeyBlock = function (index) {
	var mp = this.masterPassword,
		un = this.userName,
		sn = this.serviceName,
		c = this.color
	return PBKDF(PBKDF(PBKDF(mp, un, index), sn, index), c, index)
}

// Apply PBKDF (as described above)
// Return the required 256-bit block (blockIndex=0 for the first) as a WordArray
// key and salt must be WordArray objects
function PBKDF(key, salt, blockIndex) {
	var i, j, WordArray = CryptoJS.lib.WordArray

	// Init HMAC
	var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key)

	// First iteration
	// temp = block = HMAC(key, salt || blockIndex)
	var block = hmac.update(salt).finalize(WordArray.create([blockIndex + 1]))
	hmac.reset()

	// Iterate:
	// temp = HMAC(key, temp)
	// block ^= temp
	var intermediate = block
	for (i = 1; i < 1000; i++) {
		intermediate = hmac.finalize(intermediate)
		hmac.reset()

		for (j = 0; j < block.words.length; j++) {
			block.words[j] ^= intermediate.words[j]
		}
	}

	return block
}