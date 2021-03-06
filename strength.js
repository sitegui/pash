'use strict'

// Calculate how strong the given password is
// Return a positive number that roughly represents the bits of entropy the password has
// In general:
// 0 < score <= 32: very poor
// 32 < score <= 64: poor
// 64 < score <= 96: good
// 96 < score <= 128: awesome
// info (optional) is an object that will be populated with aditional feedback
// info will have these keys: hasDigits, hasLetters, hasCases, hasSymbols
window.measurePasswordStrength = function measurePasswordStrength(str, info) {
	let i, c,
		LCs = 'abcdefghijklmnopqrstuvwxyz',
		UCs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		Ds = '0123456789',
		lastType = '', // 'LC', 'UC', 'D' or 'S'
		consecutives = 0,
		bits = 0,
		type, typeSize, hasLC = false,
		hasUC = false,
		hasD = false,
		hasS = false
	info = info || {}

	for (i = 0; i < str.length; i++) {
		c = str[i]
		if (LCs.indexOf(c) !== -1) {
			type = 'LC'
			typeSize = 18
			hasLC = true
		} else if (UCs.indexOf(c) !== -1) {
			type = 'UC'
			typeSize = 18
			hasUC = true
		} else if (Ds.indexOf(c) !== -1) {
			type = 'D'
			typeSize = 10
			hasD = true
		} else {
			type = 'S'
			typeSize = 20
			hasS = true
		}
		consecutives = lastType === type ? consecutives + 1 / 2 : 1
		bits += Math.max(0, Math.log(typeSize / consecutives) / Math.LN2)
		lastType = type
	}

	info.hasDigits = hasD
	info.hasLetters = hasLC || hasUC
	info.hasCases = hasLC && hasUC
	info.hasSymbols = hasS
	return bits
}