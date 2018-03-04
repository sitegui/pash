/**
 * @file Provide function to generate breadcrumbs of a master key
 * This file depends on pbkdf_min.js
 */
/* globals Module */
'use strict'

/*
Breadcrumbs are meant to guide the user while typing their master key, allowing they to detect early
possible typos they make

There is a security vs ergonomy tradeoff: the more detailed are the breadcrumbs, the easier it's to
detect typos and at the same time more information about the master key (more 'bits') will be given
off. Someone spying on the screen could record the visual cues and use that to narrow any brute
force search.

Two parameters control how much detail is revealed: step and depth. A new breadcrumb is created at
each $step characters from the input. Each breadcrumb is a value from 0 to 2^$depth.

This algorithm was designed to be called as the user types. To fight edge cases in some OS/browsers,
we always discard the last character from the master key. For example, for the master key "pão", a
key-by-key typing session in MacOS is "p", "p~", "pã", "pão". The second step shouldn't be
considered, since it isn't an actual prefix of the final master key.
*/

let Breadcrumbs = {}

/**
 * Implemented by https://github.com/sitegui/pbkdf-sha256-asm/
 * @function
 * @param {string} text
 * @returns {string} 64-char hex-encoded string
 */
Breadcrumbs._sha256 = Module.cwrap('sha_simple', 'string', ['string'])

/**
 * 
 * @param {string} masterKey
 * @param {number} step
 * @param {number} depth - number of bits per crumb (1 to 8)
 * @returns {Array<number>}
 */
Breadcrumbs.generate = function (masterKey, step, depth) {
	let crumbs = [],
		mask = (1 << depth) - 1
	for (let i = step; i < masterKey.length; i += step) {
		let hash = Breadcrumbs._sha256(masterKey.slice(0, i)),
			byte = parseInt(hash[0], 16)
		crumbs.push(byte & mask)
	}
	return crumbs
}