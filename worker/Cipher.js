/**
 * @file Provide functions to encrypt/decrypt
 * This file depends on pbkdf_min.js
 */
/*globals Module, Util*/
'use strict'

var Cipher = {}

/**
 * @param {string} key hex-encoded
 * @param {string} plaintext
 * @returns {string} hex-encoded
 */
Cipher.encrypt = function (key, plaintext) {
	var nonce = new Date().toISOString(),
		iv = Cipher._hmac(key, Util.hexEncodeStr(nonce)),
		body, tag

	plaintext = Util.hexEncodeStr(plaintext)
	body = Cipher._core(key, iv, plaintext)
	tag = Cipher._hmac(key, iv + body)
	return iv + body + tag
}

/**
 * @param {string} key hex-encoded
 * @param {string} ciphertext hex-encoded
 * @returns {?string} null in case of error
 */
Cipher.decrypt = function (key, ciphertext) {
	var iv, tag, body

	if (!/^([0-9a-f]{2}){64,}$/i.test(ciphertext)) {
		// Should be hex-encoded and have at least iv+tag (32 bytes each)
		return null
	}

	// ciphertext := iv || body || tag
	iv = ciphertext.substr(0, 64)
	body = ciphertext.substring(64, ciphertext.length - 64)
	tag = ciphertext.substr(-64)

	if (tag !== Cipher._hmac(key, iv + body)) {
		// Invalid tag
		return null
	}

	body = Cipher._core(key, iv, body)

	return Util.hexDecodeStr(body)
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