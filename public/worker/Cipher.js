/**
 * @file Provide functions to encrypt/decrypt
 * This file depends on pbkdf_min.js
 */
/*globals Module, Util*/
'use strict'

/*
Encryption construction

Timestamp ---+
 (NONCE)     |
             v
         +-------+
 KEY1--->|> HMAC |--+-----------+----------------------+----------- ... ---------+
         +-------+  |           v                      v                         v
                    |  +-------------------+  +-------------------+     +-------------------+
                    |  | Iv (256 bits) | 0 |  | Iv (256 bits) | 1 | ... | Iv (256 bits) | N |
                    |  +-------------------+  +-------------------+     +-------------------+
            +-------+            v                      v                         v
            |                +-------+              +-------+                 +-------+
            |        KEY2--->|> HMAC |      KEY2--->|> HMAC |         KEY2--->|> HMAC |
            |                +-------+              +-------+                 +-------+
            |                    v                      v                         v
            |           +-----------------+    +-----------------+       +-----------------+
            |           |  PAD (256 bits) |    |  PAD (256 bits) |  ...  |  PAD (256 bits) |
            |           +-----------------+    +-----------------+       +-----------------+
            |                    v                      v                         v
            |                   XOR---------+          XOR---------+            XOR------+
            |                    ^          |           ^          |            ^        |
            |           +-----------------+ |  +-----------------+ |     +-------------+ |
            |           |    MESSAGE[0]   | |  |    MESSAGE[1]   | |     |  MESSAGE[N] | |
            |           +-----------------+ |  +-----------------+ |     +-------------+ |
            v                               |                      |                     |
    +---------------+   +-----------------+ |  +-----------------+ |     +-------------+ |   +-----+
    | IV (256 bits) |   |  CIPHERTEXT[0]  |<+  |  CIPHERTEXT[1]  |<+     |CIPHERTEXT[N]|<+   | TAG |
    +---------------+   +-----------------+    +-----------------+       +-------------+     +-----+
   |                                                                                     |      ^
   +--------------------------------------------------------------- ... -----------------+      |
                                            v                                                   |
                                        +-------+                                               |
                                KEY3--->|> HMAC |-----------------------------------------------+
                                        +-------+

The encryption follows the encrypt-then-mac logic, using counter mode to generate a pad that is xored with the message.

Given the lack of a CSPRNG in the browser, the IV is the output of HMAC on a nonce
(here the timestamp with milliseconds resolution is used).

The counter is a 32-bit word, starting with zero.

One main key is used to derive 3 keys with HMAC(mainKey, keyName):
1. derive a pseudo-random IV (keyName = 'iv')
2. generate the pad (keyName = 'pad')
3. MAC (keyName = 'mac')

The decryption is very similar to the encryption, except:
* the MAC tag is checked
* the IV is taken from the first 256bits

*/

var Cipher = {}

/**
 * @param {string} key hex-encoded
 * @param {string} plaintext
 * @returns {string} hex-encoded
 */
Cipher.encrypt = function (key, plaintext) {
	var nonce = new Date().toISOString(),
		keys = Cipher._deriveKeys(key),
		iv = Cipher._hmac(keys.iv, Util.hexEncodeStr(nonce)),
		body, tag

	plaintext = Util.hexEncodeStr(plaintext)
	body = Cipher._core(keys.pad, iv, plaintext)
	tag = Cipher._hmac(keys.mac, iv + body)
	return iv + body + tag
}

/**
 * @param {string} key hex-encoded
 * @param {string} ciphertext hex-encoded
 * @returns {?string} null in case of error
 */
Cipher.decrypt = function (key, ciphertext) {
	var keys, iv, tag, body

	if (!/^([0-9a-f]{2}){64,}$/i.test(ciphertext)) {
		// Should be hex-encoded and have at least iv+tag (32 bytes each)
		return null
	}

	keys = Cipher._deriveKeys(key)

	// ciphertext := iv || body || tag
	iv = ciphertext.substr(0, 64)
	body = ciphertext.substring(64, ciphertext.length - 64)
	tag = ciphertext.substr(-64)

	if (tag !== Cipher._hmac(keys.mac, iv + body)) {
		// Invalid tag
		return null
	}

	body = Cipher._core(keys.pad, iv, body)

	return Util.hexDecodeStr(body)
}

/**
 * Derive 3 used keys from master key
 * @param {string} key hex-encoded
 * @returns {{iv: string, pad: string, mac:string }}
 */
Cipher._deriveKeys = function (key) {
	return {
		iv: Cipher._hmac(Util.hexEncodeStr('pash iv'), key),
		pad: Cipher._hmac(Util.hexEncodeStr('pash pad'), key),
		mac: Cipher._hmac(Util.hexEncodeStr('pash mac'), key)
	}
}

/**
 * Implemented by https://github.com/sitegui/pbkdf-sha256-asm/
 * @function
 * @param {string} key hex-encoded
 * @param {string} message hex-encoded
 * @returns {string} 64-char hex-encoded string
 */
Cipher._hmac = Module.cwrap('hmac_simple_hex', 'string', ['string', 'string'])

/**
 * Apply the core encryption/decryption logic
 * @param {string} key hex-encoded
 * @param {string} iv hex-encoded
 * @param {string} text hex-encoded
 * @returns {string} hex-encoded
 */
Cipher._core = function (key, iv, text) {
	var counter = 0,
		ret = '',
		i, pad

	for (i = 0; i < text.length; i += 64) {
		// Generate the pad for each block
		pad = Cipher._hmac(key, iv + Util.i32ToHex(counter))
		ret += Util.xor(pad, text.substr(i, 64))
	}
	return ret
}