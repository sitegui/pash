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
|Raw      |64 chars                    |
|(hex)    |256 bits                    |
+---------+----------------------------+

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
These steps guarantee the uniform distribution of the chosen chars
(given that the input bit stream is indistinguishable from random noise)

Note: the formatting algorithm has no static bounds for the number of consumed bits.
The key derivation block can generate one 256-bit block and wait to see if it's enough.
If not, it must generate the second block and wait again.

*/

// Create a new digest for the given inputs
// userName and serviceName are case insensitive strings
// masterPassword is the only information the user should retype every time
// color is one of Pash.COLOR.* constants and is used to let the user get more than one key for one service
function Pash(masterPassword, userName, serviceName, color) {
	this._masterPassword = masterPassword
	this._userName = Pash.normalize(userName)
	this._serviceName = Pash.normalize(serviceName)
	this._color = Pash.normalize(color)
}

// Return the normalized value for a given string
// For the pash algorithm, the user name, service are normalized, this implies:
// PASH('name', '1234', 'gmail', 'red') === PASH('Name', '1234', 'G mail', 'red')
Pash.normalize = function (str) {
	return str.replace(/\s/g, '').toLowerCase()
}

// Generate a password with the given outputs
// format is one of Pash.FORMAT.* constants
// length is one of Pash.LENGTH.* constants
// callback(pass) will be called when done
// pass is the resulting string
// All work is delegated to a background worker that runs on a background thread
// The worker will forget about all computed data after done
Pash.prototype.generatePassword = function (format, length, callback) {
	var tag = String(Math.random())

	Pash._worker.postMessage({
		masterPassword: this._masterPassword,
		userName: this._userName,
		serviceName: this._serviceName,
		color: this._color,
		format: format,
		length: length,
		tag: tag
	})

	Pash._callbacks[tag] = callback
}

// Generate a key for internal use for Pash
// color is one of Pash.COLOR.* constants
// callback(pass) will be called when done
// pass is the resulting string
Pash.prototype.generatePashKey = function (color, callback) {
	var pash = new Pash(this._masterPassword, this._userName, 'pash', color)
	pash.generatePassword(Pash.FORMAT.RAW, null, callback)
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

// Output format type constants
Pash.FORMAT = {
	STANDARD: 0,
	NUMERIC: 1,
	STRONG: 2,
	RAW: 3
}

/*
Internals
*/

Pash._worker = new Worker('./PashWorker.js')
Pash._callbacks = Object.create(null)

// Handle generated password message
Pash._worker.onmessage = function (event) {
	var tag = event.data.tag,
		result = event.data.result,
		callback = Pash._callbacks[tag]

	delete Pash._callbacks[tag]
	if (typeof callback === 'function') {
		callback(result)
	}
}