/*globals CryptoJS*/
'use strict'

var Pash = {}

/*
PASH algorithm:

`       Color -------------------+
`Service name ----------+        |            Length -------+
`   User name -+        |        |       Format type -+     |
`              |        |        |                    |     |
`        ######|########|########|######              V     V
`        #     V        V        V     #        ###################
Master   #  +-----+  +-----+  +-----+  #  Key   #                 # Password
----------->|PBKDF|->|PBKDF|->|PBKDF|---------->#    FORMATTING   #---------->
password #  +-----+  +-----+  +-----+  # Stream #                 #
`        #     KEY DERIVATION BLOCK    #        ###################
`        ###############################

For each PBKDF block:
* The key input is the one at the left
* The salt input is the one at the top
* The parameters are: HMAC-SHA256, 1000 rounds
* The output length is not explicitly defined, it depends on how much the formatting block needs

All three salt inputs (userName, serviceName and color) are normalized:
normalize(S) := lower-case(strip-spaces(S))

All strings are represented in UTF-8 binary format

The key derivation block outputs the key stream on blocks of 256 bits. Each of those blocks can be computed independently.

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

// Color constants
Pash.color = {
	RED: 'red',
	GREEN: 'green',
	BLUE: 'blue',
	BLACK: 'black'
}

// Length constants
Pash.length = {
	SHORT: 1,
	MEDIUM: 2,
	LONG: 3
}

// Decoder type constants
Pash.decoder = {
	STANDARD: 0,
	NUMERIC: 1,
	STRONG: 2
}

// Return the normalized value for a given string
// For the pash algorithm, the user name, service are normalized, this implies:
// PASH('name', '1234', 'gmail', 'red') === PASH('Name', '1234', 'G mail', 'red')
Pash.normalize = function (str) {
	str = str.replace(/\s/g, '').toLowerCase()
}

// Return a password for the user
// userName and serviceName are case insensitive strings
// masterPassword is the only information the user should retype every time
// color is one of Pash.color.* constants and is used to let the user get more than one key for one service
// decoderType is one of Pash.decoder.* constants
// length is one of Pash.length.* constants
Pash.generatePassword = function (userName, masterPassword, serviceName, color, decoderType, length) {
	var raw = Pash.generateRawPassword(userName, masterPassword, serviceName, color)
	return Pash.decodeRawPassword(raw, decoderType, length)
}

// raw is the object returned by Pash.generateRawPassword()
// decoderType is one of Pash.decoder.* constants
// length is one of Pash.length.* constants
Pash.decodeRawPassword = function (raw, decoderType, length) {
	if (decoderType === Pash.decoder.STANDARD) {
		return Pash._applyStandardDecoder(raw, length)
	} else if (decoderType === Pash.decoder.NUMERIC) {
		return Pash._applyNumericDecoder(raw, length)
	} else if (decoderType === Pash.decoder.STRONG) {
		return Pash._applyStrongDecoder(raw, length)
	}
}

// Generate the raw encoded password
// userName and serviceName are case insensitive strings
// masterPassword is the only information the user should retype every time
// color is one of Pash.color.* constants and is used to let the user get more than one key for one service
// Return a CryptoJS.lib.WordArray instance with 256 bits
Pash.generateRawPassword = function (userName, masterPassword, serviceName, color) {
	// Encode all values to bytes
	userName = CryptoJS.enc.Utf8.parse(userName.toUpperCase())
	masterPassword = CryptoJS.enc.Utf8.parse(masterPassword)
	serviceName = CryptoJS.enc.Utf8.parse(serviceName.toUpperCase())
	color = CryptoJS.enc.Utf8.parse(color)

	var options = {
		keySize: 256 / 32,
		iterations: 1000,
		hasher: CryptoJS.algo.SHA256
	}

	// Do three rounds of PBKDF2-SHA256, each time using a different salt
	var password = CryptoJS.PBKDF2(masterPassword, userName, options)
	password = CryptoJS.PBKDF2(password, serviceName, options)
	password = CryptoJS.PBKDF2(password, color, options)

	return password
}

/*
Internal methods
*/

// Break the given CryptoJS.lib.WordArray in blocks of the given number of bits
// n must be <= 32
// Return an Array filled with Number instances (all them integers from 0 to 2^n-1)
// Discard incomplete slices (2-byte WordArray produces 3 5-bit integers)
Pash._breakWordArrayInBits = function (wordArray, n) {
	var words, cache, r, cachePos, cacheInnerPos, pack, toRead

	words = wordArray.words
	cache = 0
	cacheInnerPos = 32
	cachePos = 0
	r = []
	pack = 0

	while (true) {
		if (cacheInnerPos + n <= 32) {
			// Simply read from the current word
			pack = (cache << cacheInnerPos) >>> (32 - n)
			cacheInnerPos += n
		} else if (cachePos === words.length) {
			// Reached the end
			break
		} else {
			// Consume the cache and load more
			pack = cacheInnerPos === 32 ? 0 : (cache << cacheInnerPos) >>> cacheInnerPos
			toRead = n - (32 - cacheInnerPos)
			pack <<= toRead
			cache = words[cachePos++]
			pack |= cache >>> (32 - toRead)
			cacheInnerPos = toRead
		}
		r.push(pack)
	}

	return r
}

// Hash the given CryptoJS.lib.WordArray into a string with the given caracters
// alphabet is a string with all the characters wanted in the output
// numBits is the length of each chunck from the wordArray that will be translated to each char
// The best value for numBits is floor(log(alphabet_length)/log(2))
Pash._decodeWordArray = function (wordArray, alphabet, numBits) {
	var chunks, ratio, i, r

	chunks = Pash._breakWordArrayInBits(wordArray, numBits)
	ratio = alphabet.length / Math.pow(2, numBits)
	r = ''
	for (i = 0; i < chunks.length; i++) {
		r += alphabet[Math.floor(chunks[i] * ratio)]
	}

	return r
}

// Make sure there is at least one of the given group of chars in the given string
// If there is not, change the string in a given way so that all constraints are met
// The returned string has the same size of the given string
// charGroups is an Array of strings, example: ['abc', '012']
// str.length must be at least charGroups.length
Pash._grantChars = function (str, charGroups) {
	var valid, i, j, k, charGroup, found
	while (true) {
		// Assume as valid
		valid = true

		// Check each constraint
		for (i = 0; i < charGroups.length; i++) {
			charGroup = charGroups[i]
			found = false

			// Try to find one of the required chars
			for (j = 0; j < str.length && !found; j++) {
				for (k = 0; k < charGroup.length; k++) {
					if (str[j] === charGroup[k]) {
						found = true
						break
					}
				}
			}

			if (!found) {
				// Inject one of the necessary char
				str = str.substr(1) + charGroup[str.charCodeAt(0) % charGroup.length]
				valid = false
			}
		}

		// If realy valid, return
		if (valid) {
			return str
		}
	}
}

// Aplly standard password decoder in the given raw password
// Return a string with at least 1 upper-case letter, 1 lower-case letter and 1 digit
// length is one of Pash.length.* constants
Pash._applyStandardDecoder = function (rawPass, length) {
	var str

	// Basic decoding
	str = Pash._decodeWordArray(rawPass, 'abcdefghjklmnpqrstuvwxyz23456789', 5).substr(0, 5 * length)

	// Make sure there are the desired chars present
	str = str.replace(/[a-z]/, function (c) {
		return c.toUpperCase()
	})
	return Pash._grantChars(str, ['abcdefghjklmnpqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789'])
}

// Return a string composed only of numbers
// length is one of Pash.length.* constants
Pash._applyNumericDecoder = function (rawPass, length) {
	return Pash._decodeWordArray(rawPass, '0123456789', 4).substr(0, 4 * length)
}

// Return a string with at least 1 upper-case letter, 1 lower-case letter, 1 digit and 1 symbol
// length is one of Pash.length.* constants
Pash._applyStrongDecoder = function (rawPass, length) {
	var str

	// Basic decoding
	str = Pash._decodeWordArray(rawPass, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-./:;<=>?@[]_{|}', 7).substr(0, 7 * length)

	// Make sure there are the desired chars present
	str = str.replace(/[a-z]/, function (c) {
		return c.toUpperCase()
	})
	return Pash._grantChars(str, ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789', '!#$%&()*+,-./:;<=>?@[]_{|}'])
}