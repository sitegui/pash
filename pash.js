"use strict"

/*
Public interface
*/

// Color constants
var PASH_COLOR_RED = "red"
var PASH_COLOR_GREEN = "green"
var PASH_COLOR_BLUE = "blue"
var PASH_COLOR_YELLOW = "yellow"
var PASH_COLOR_ORANGE = "orange"
var PASH_COLOR_PURPLE = "purple"

// Length constants
var PASH_LENGTH_SHORT = 1
var PASH_LENGTH_MEDIUM = 2
var PASH_LENGTH_LONG = 3

// Decoder type constants
var PASH_DECODER_STANDARD = 0
var PASH_DECODER_NUMERIC = 1
var PASH_DECODER_STRONG = 2

// Return a password for the user
// userName and serviceName are case insensitive strings
// masterPassword is the only information the user should retype every time
// color is one of PASH_COLOR_* constants and is used to let the user get more than one key for one service
// decoderType is one of PASH_DECODER_* constants
// length is one of PASH_LENGTH_* constants
function generatePassword(userName, masterPassword, serviceName, color, decoderType, length) {
	return decodeRawPassword(generateRawPassword(userName, masterPassword, serviceName, color), decoderType, length)
}

// raw is the object returned by generateRawPassword()
// decoderType is one of PASH_DECODER_* constants
// length is one of PASH_LENGTH_* constants
function decodeRawPassword(raw, decoderType, length) {
	if (decoderType == PASH_DECODER_STANDARD)
		return applyStandardDecoder(raw, length)
	if (decoderType == PASH_DECODER_NUMERIC)
		return applyNumericDecoder(raw, length)
	if (decoderType == PASH_DECODER_STRONG)
		return applyStrongDecoder(raw, length)
}

// Generate the raw encoded password
// userName and serviceName are case insensitive strings
// masterPassword is the only information the user should retype every time
// color is one of PASH_COLOR_* constants and is used to let the user get more than one key for one service
// Return a CryptoJS.lib.WordArray instance
function generateRawPassword(userName, masterPassword, serviceName, color) {
	var userHash, serviceHash
	
	// SHA-256 hash both user and service info
	userHash = CryptoJS.SHA256(String(userName).toUpperCase()+"-"+String(masterPassword))
	serviceHash = CryptoJS.SHA256(String(serviceName).toUpperCase()+"-"+String(color))
	
	// SHA-256 these two parts together
	return CryptoJS.SHA256(userHash.concat(serviceHash))
}

/*
Internal methods
*/

// Break the given CryptoJS.lib.WordArray in blocks of the given number of bits
// n must be <= 32
// Return an Array filled with Number instances (all them integers from 0 to 2^n-1)
// Discard incomplete slices (2-byte WordArray produces 3 5-bit integers)
function breakWordArrayInBits(wordArray, n) {
	var words, cache, r, cachePos, cacheInnerPos, pack, toRead
	
	words = wordArray.words
	cache = 0
	cacheInnerPos = 32
	cachePos = 0
	r = []
	pack = 0
	
	while (true) {
		if (cacheInnerPos+n <= 32) {
			// Simply read from the current word
			pack = (cache << cacheInnerPos) >>> (32-n)
			cacheInnerPos += n
		} else if (cachePos == words.length) {
			// Reached the end
			break
		} else {
			// Consume the cache and load more
			pack = cacheInnerPos==32 ? 0 : (cache << cacheInnerPos) >>> cacheInnerPos
			toRead = n-(32-cacheInnerPos)
			pack <<= toRead
			cache = words[cachePos++]
			pack |= cache >>> (32-toRead)
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
function decodeWordArray(wordArray, alphabet, numBits) {
	var chunks, ratio, i, r
	
	chunks = breakWordArrayInBits(wordArray, numBits)
	ratio = alphabet.length/Math.pow(2, numBits)
	r = ""
	for (i=0; i<chunks.length; i++)
		r += alphabet[Math.floor(chunks[i]*ratio)]
	
	return r
}

// Make sure there is at least one of the given group of chars in the given string
// If there is not, change the string in a given way so that all constraints are met
// The returned string has the same size of the given string
// charGroups is an Array of strings, example: ["abc", "012"]
// str.length must be at least charGroups.length
function grantChars(str, charGroups) {
	var valid, i, j, k, charGroup, found
	while (true) {
		// Assume as valid
		valid = true
		
		// Check each constraint
		for (i=0; i<charGroups.length; i++) {
			charGroup = charGroups[i]
			found = false
			
			// Try to find one of the required chars
			for (j=0; j<str.length && !found; j++) {
				for (k=0; k<charGroup.length; k++) {
					if (str[j] == charGroup[k]) {
						found = true
						break
					}
				}
			}
			
			if (!found) {
				// Inject one of the necessary char
				str = str.substr(1) + charGroup[str.charCodeAt(0)%charGroup.length]
				valid = false
			}
		}
		
		// If realy valid, return
		if (valid)
			return str
	}
}

// Aplly standard password decoder in the given raw password
// Return a string with at least 1 upper-case letter, 1 lower-case letter and 1 digit
// length is one of PASH_LENGTH_* constants
function applyStandardDecoder(rawPass, length) {
	var str
	
	// Basic decoding
	str = decodeWordArray(rawPass, "abcdefghjklmnpqrstuvwxyz23456789", 5).substr(0, 5*length)
	
	// Make sure there are the desired chars present
	str = str.replace(/[a-z]/, function (c) {
		return c.toUpperCase()
	})
	return grantChars(str, ["abcdefghjklmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789"])
}

// Return a string composed only of numbers
// length is one of PASH_LENGTH_* constants
function applyNumericDecoder(rawPass, length) {
	return decodeWordArray(rawPass, "0123456789", 4).substr(0, 4*length)
}

// Return a string with at least 1 upper-case letter, 1 lower-case letter, 1 digit and 1 symbol
// length is one of PASH_LENGTH_* constants
function applyStrongDecoder(rawPass, length) {
	var str
	
	// Basic decoding
	str = decodeWordArray(rawPass, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-./:;<=>?@[]_{|}", 7).substr(0, 7*length)
	
	// Make sure there are the desired chars present
	str = str.replace(/[a-z]/, function (c) {
		return c.toUpperCase()
	})
	return grantChars(str, ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "!#$%&()*+,-./:;<=>?@[]_{|}"])
}
