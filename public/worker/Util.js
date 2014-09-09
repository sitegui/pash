/**
 * @file Provide utility functions for the worker
 */
/*globals Module*/
'use strict'

var Util = {}

/**
 * Convert a hex-encoded string to a Uint8Array
 * @param {string} str hex-encoded
 * @returns {Uint8Array}
 */
Util.i8ArrFromHex = function (str) {
	if (!/^([0-9a-f]{2})*$/i.test(str)) {
		throw new Error('Invalid string to decode: ' + str)
	}
	var len = str.length,
		arr = new Uint8Array(len / 2),
		i
	for (i = 0; i < len; i += 2) {
		arr[i / 2] = parseInt(str.substr(i, 2), 16)
	}
	return arr
}

/**
 * Turn a JS string into UTF8 hex-encoded string
 * @param {string} str
 * @returns {string}
 */
Util.hexEncodeStr = function (str) {
	return Util.hexEncodeArray(new Module.Runtime.UTF8Processor().processJSString(str))
}

/**
 * Turn a hex-encoded string into a JS string
 * @param {string} str hex-encoded
 * @returns {string}
 */
Util.hexDecodeStr = function (str) {
	var utf8 = new Module.Runtime.UTF8Processor(),
		ret = '',
		i
	for (i = 0; i < str.length; i += 2) {
		ret += utf8.processCChar(parseInt(str.substr(i, 2), 16))
	}
	return ret
}

/**
 * Turn a byte array into hex-encoded string
 * @param {Array<number>} bytes
 * @returns {string}
 */
Util.hexEncodeArray = function (bytes) {
	var ret = '',
		byte, i
	for (i = 0; i < bytes.length; i++) {
		byte = bytes[i].toString(16)
		ret += byte.length === 1 ? '0' + byte : byte
	}
	return ret
}

/**
 * @param {number} num
 * @returns {string} 8-char hex-encoded
 */
Util.i32ToHex = function (num) {
	num |= 0
	var a = num >>> 24,
		b = (num >>> 16) & 0xFF,
		c = (num >>> 8) & 0xFF,
		d = num & 0xFF
	return Util.hexEncodeArray([a, b, c, d])
}

/**
 * Do a XOR on two hex-encoded strings
 * They do not need to have the same length
 * The result length is the length of the shortest input
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
Util.xor = function (a, b) {
	var len = Math.min(a.length, b.length),
		ret = '',
		i
	for (i = 0; i < len; i++) {
		ret += (parseInt(a[i], 16) ^ parseInt(b[i], 16)).toString(16)
	}
	return ret
}