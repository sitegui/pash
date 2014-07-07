/*globals CryptoJS*/
'use strict'

importScripts('sha256.js', 'pbkdf2.js')

onmessage = function (oEvent) {

	var pash = new Pash(oEvent.data.pash.masterPassword, oEvent.data.pash.userName, oEvent.data.pash.serviceName, oEvent.data.pash.color, oEvent.data.decoder, oEvent.data.length)

	pash.getPassword = pash.decoder === 0 ? getStandardPassword : (pash.decoder === 1 ? getNumericPassword : getStrongPassword)

	postMessage({
		password: pash.getPassword(pash.length),
		tag: oEvent.data.tag
	})
}

// Return the normalized value for a given string
// For the pash algorithm, the user name, service are normalized, this implies:
// PASH('name', '1234', 'gmail', 'red') === PASH('Name', '1234', 'G mail', 'red')
Pash.normalize = function (str) {
	return str.replace(/\s/g, '').toLowerCase()
}

function Pash(masterPassword, userName, serviceName, color, decoder, length) {
	var parse = CryptoJS.enc.Utf8.parse

	// Normalize and encode
	this._userName = parse(Pash.normalize(userName))
	this._masterPassword = parse(masterPassword)
	this._serviceName = parse(Pash.normalize(serviceName))
	this._color = parse(Pash.normalize(color))

	// Cache intermediate blocks
	this._blocksA = []
	this._blocksB = []
	this._keyBlocks = []

	this._pashRawKey = null
	this._pashKeys = {}

	// Store info about key blocks to let them be accessed as a stream of bits
	this._streamPos = 0 // bit pos (8 bit = 1 Byte)

	this.decoder = decoder

	this.length = length
}

// Return a string with at least 1 upper-case letter, 1 lower-case letter and 1 digit
// length is one of Pash.LENGTH.* constants
function getStandardPassword(length) {
	var alphabet, str, i, hasa, has0, c

	alphabet = _alphabets.a + _alphabets['0']
	length *= 5
	do {
		// The first char is an upper-case letter
		str = this._chooseRandom(_alphabets.A)

		// Pick random from a0
		hasa = has0 = false
		for (i = 1; i < length; i++) {
			c = this._chooseRandom(alphabet)
			str += c
			hasa = hasa || _alphabets.a.indexOf(c) !== -1
			has0 = has0 || _alphabets['0'].indexOf(c) !== -1
		}
	} while (!hasa || !has0) // Try again

	return str
}

// Return a string composed only of numbers
// length is one of Pash.LENGTH.* constants
function getNumericPassword(length) {
	var i, str = ''

	// Pick random digits
	length *= 4
	for (i = 0; i < length; i++) {
		str += this._chooseRandom(_alphabets['0'])
	}

	return str
}

// Return a string with at least 1 upper-case letter, 1 lower-case letter, 1 digit and 1 symbol
// length is one of Pash.LENGTH.* constants
function getStrongPassword(length) {
	var alphabet, str, i, hasA, hasa, has0, has$, c, alphabets = _alphabets

	alphabet = alphabets.A + alphabets.a + alphabets['0'] + alphabets.$
	length *= 7
	do {
		str = ''

		// Pick random from Aa0$
		hasA = hasa = has0 = has$ = false
		for (i = 0; i < length; i++) {
			c = this._chooseRandom(alphabet)
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
Pash.prototype._getNextBits = function (n) {
	var block = this._getKeyBlock(this._streamPos >>> 8)
	var bitPosInBlock = this._streamPos & 0xFF

	var i, wordPosInBlock, bitPosInWord, word, bit, result = 0

	// Extract each bit
	for (i = 0; i < n; i++) {
		// Get the bit
		wordPosInBlock = bitPosInBlock >>> 5
		bitPosInWord = bitPosInBlock & 0x1F
		word = block.words[wordPosInBlock]
		bit = (word >>> (31 - bitPosInWord)) & 0x1

		// Add to result
		result <<= 1
		result |= bit

		// Increment
		this._streamPos++
		bitPosInBlock++

		if (bitPosInBlock === 256) {
			// Load next block
			bitPosInBlock = 0
			block = this._getKeyBlock(this._streamPos >>> 8)
		}
	}

	return result
}

// Return a integer random value 0 <= r < max
// The random value is derived from the key stream and is close to a uniform distribuition
// max must be greater than 1 and smaller than 2^32
Pash.prototype._getNextRandom = function (max) {
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
		r = this._getNextBits(nBits)
	} while (r >= max)

	return r
}

// Return a random element from the given array
Pash.prototype._chooseRandom = function (array) {
	return array[this._getNextRandom(array.length)]
}

// Return the n-th key block (0=first block) as a WordArray
// It uses cache internally, so calling it again (with the same i) will be very fast
Pash.prototype._getKeyBlock = function (index) {
	// Load from cache
	if (this._keyBlocks[index]) {
		return this._keyBlocks[index]
	}

	// First step: salt=userName
	var blockA = this._blocksA[index]
	if (!blockA) {
		this._blocksA[index] =
			blockA =
			_PBKDF(this._masterPassword, this._userName, index)
	}

	// Second step: salt=serviceName
	var blockB = this._blocksB[index]
	if (!blockB) {
		this._blocksB[index] =
			blockB =
			_PBKDF(blockA, this._serviceName, index)
	}

	// Third step: salt=color
	var block =
		this._keyBlocks[index] =
		_PBKDF(blockB, this._color, index)
	return block
}

// Apply PBKDF (as described above)
// Return the required 256-bit block (blockIndex=0 for the first) as a WordArray
// key and salt must be WordArray objects
function _PBKDF(key, salt, blockIndex) {
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

// Alphabet type constants
var _alphabets = {
	a: 'abcdefghijklmnopqrstuvwxyz',
	A: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'0': '0123456789',
	$: '!#$%&()*+,-./:;<=>?@[]_{|}'
}