/*globals CryptoJS*/
'use strict'

/*
PASH algorithm:

`       Color ---------------------+
`Service name -----------+         |            Length -------+
`   User name -+         |         |       Format type -+     |
`              |         |         |                    |     |
`        ######|#########|#########|######              V     V
`        #     V         V         V     #        ###################
Master   #  +-----+ A +-----+ B +-----+  #  Key   #                 # Password
----------->|PBKDF|-->|PBKDF|-->|PBKDF|---------->#    FORMATTING   #---------->
password #  +-----+   +-----+   +-----+  # Stream #                 #
`        #      KEY DERIVATION BLOCK     #        ###################
`        #################################

For each PBKDF block:
* The key input is the one at the left
* The salt input is the one at the top
* The parameters are: HMAC-SHA256, 1000 rounds
* The output length is not explicitly defined, it depends on how much the formatting block needs

All three salt inputs (userName, serviceName and color) are normalized:
normalize(S) := lower-case(strip-spaces(S))

All strings are represented in UTF-8 binary format

The key derivation block outputs the key stream on blocks of 256 bits. Each of those blocks can be computed independently, that is, the PBKDF used here are slightly different from the standard definition. They don't take the output length as a parameter, but instead the block-index:
keyBlock[i] = PBKDF(PBKDF(PBKDF(masterPassword, userName, i), serviceName, i), color, i)

There are 3 output formats:
* Standard: one upper-case letter followed by lower-case letters and digit
`    Must have at least one lower-case letter and one digit
* Numeric: digits
* Strong: letters (both case), digits and symbols
`    Must have at least one of each class: lower-case, upper-case, digit, symbol
`    The selected symbols are (26 elements): !#$%&()*+,-./:;<=>?@[]_{|}

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

The formatting algorithm is defined as follows:
1. start with empty string
2. pick one char from the alphabet (depending on the target format)
3. repeat 2. until the goal length
4. check if the constrains hold (eg, at least one digit and one lower-case letter)
`  If it holds, them done
`  Otherwise repeat from 1.
These steps guarantee the uniform distribution of the password, given that the step 2 is uniform over the alphabet

To pick a char from an alphabet with N elements (eg, 10 digits):
1. Pick ceil(log2(N)) bits from the key stream (eg, 4 bits for the 10 digits alphabet)
2. Read those bits as a integer I (the first bit is the most significant)
3. check if I<N
`  If it holds, them return the I-th element from the alphabet
`  Otherwise repeat from 1.
These steps guarantee the uniform distribution of the chosen chars (given that the input bit stream is indistinguishable from random noise)

Note: the formatting algorithm has no static bounds for the number of consumed bits. The key derivation block can generate one 256-bit block and wait to see if it's enough. If not, it must generate the second block and wait again.

*/

// Create a new digest for the given inputs
// userName and serviceName are case insensitive strings
// masterPassword is the only information the user should retype every time
// color is one of Pash.COLOR.* constants and is used to let the user get more than one key for one service
function Pash(userName, masterPassword, serviceName, color) {
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
}

// Return a string with at least 1 upper-case letter, 1 lower-case letter and 1 digit
// length is one of Pash.LENGTH.* constants
Pash.prototype.getStandardPassword = function (length) {
	var alphabet, str, i, hasa, has0, c

	alphabet = Pash._alphabets.a.concat(Pash._alphabets['0'])
	length *= 5
	do {
		// The first char is an upper-case letter
		str = this._chooseRandom(Pash._alphabets.A)

		// Pick random from a0
		hasa = has0 = false
		for (i = 1; i < length; i++) {
			c = this._chooseRandom(alphabet)
			str += c
			hasa = hasa || Pash._alphabets.a.indexOf(c) !== -1
			has0 = has0 || Pash._alphabets['0'].indexOf(c) !== -1
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
		str += this._chooseRandom(Pash._alphabets['0'])
	}

	return str
}

// Return a string with at least 1 upper-case letter, 1 lower-case letter, 1 digit and 1 symbol
// length is one of Pash.LENGTH.* constants
Pash.prototype.getStrongPassword = function (length) {
	var alphabet, str, i, hasA, hasa, has0, has$, c, alphabets = Pash._alphabets

	alphabet = alphabets.A.concat(alphabets.a, alphabets['0'], alphabets.$)
	length *= 7
	do {
		str = ''

		// Pick random from Aa0$
		hasA = hasa = has0, has$ = 0
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

// Return the pash key for the given color
// color is one of Pash.COLOR.* constants
// Return a 256-bit WordArray
Pash.prototype.getPashKey = function (color) {
	var parse = CryptoJS.enc.Utf8.parse
	var service

	// Get the raw key (first two steps)
	if (!this._pashRawKey) {
		service = parse(Pash.normalize('Pash'))
		this._pashRawKey = Pash._PBKDF(this._masterPassword, this._userName, 0)
		this._pashRawKey = Pash._PBKDF(this._pashRawKey, service, 0)
	}

	// Get the key for the given color
	color = Pash.normalize(color)
	var key = this._pashKeys[color]
	if (!key) {
		key =
			this._pashKeys[color] =
			Pash._PBKDF(this._pashRawKey, parse(color), 0)
	}

	return key
}

// Color constants
Pash.COLOR = {
	RED: 'red',
	GREEN: 'green',
	BLUE: 'blue',
	BLACK: 'black'
}

// Length constants
Pash.LENGTH = {
	SHORT: 1,
	MEDIUM: 2,
	LONG: 3
}

// Decoder type constants
Pash.DECODER = {
	STANDARD: 0,
	NUMERIC: 1,
	STRONG: 2
}

// Return the normalized value for a given string
// For the pash algorithm, the user name, service are normalized, this implies:
// PASH('name', '1234', 'gmail', 'red') === PASH('Name', '1234', 'G mail', 'red')
Pash.normalize = function (str) {
	return str.replace(/\s/g, '').toLowerCase()
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
			Pash._PBKDF(this._masterPassword, this._userName, index)
	}

	// Second step: salt=serviceName
	var blockB = this._blocksB[index]
	if (!blockB) {
		this._blocksB[index] =
			blockB =
			Pash._PBKDF(blockA, this._serviceName, index)
	}

	// Third step: salt=color
	var block =
		this._keyBlocks[index] =
		Pash._PBKDF(blockB, this._color, index)
	return block
}

// Apply PBKDF (as described above)
// Return the required 256-bit block (blockIndex=0 for the first) as a WordArray
// key and salt must be WordArray objects
Pash._PBKDF = function (key, salt, blockIndex) {
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
Pash._alphabets = {
	a: 'abcdefghijklmnopqrstuvwxyz',
	A: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	'0': '0123456789',
	$: '!#$%&()*+,-./:;<=>?@[]_{|}'
}