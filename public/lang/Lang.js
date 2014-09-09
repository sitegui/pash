'use strict'

// Module to detect locale and provide translated strings
var Lang = {}

// Key used to save user preference in the browser
Lang.localStorageKey = 'pash-lang'

// Add a new language pack
// pack.tag is a string like 'en' or 'pt-br' (case insensitive)
// pack.name is the complete pack name (like 'English')
// pack.isDefault indicates this pack should be used if the auto-detect fails
// pack.strings is <TODO>
Lang.addPack = function (pack) {
	Lang._packs[pack.tag.toLowerCase()] = pack
	if (pack.isDefault) {
		Lang._defaultPack = pack
	}
}

// Get the translation for the given key
// It's a commom practive to create an alias for this function with
// var _ = Lang.getString
Lang.getString = function (key) {
	var parts = key.split('.'),
		i, context
	context = Lang._pack.strings
	for (i = 0; i < parts.length; i++) {
		if (!context || typeof context !== 'object') {
			// Not found
			console.log('Translation for ' + key + ' not found')
			return '[[' + key + ']]'
		}
		context = context[parts[i]]
	}
	if (!context || typeof context !== 'string') {
		// Not found
		console.log('Translation for ' + key + ' not found')
		return '[[' + key + ']]'
	}
	return context
}

// Return an array with the names of all registered language packs
// Every element is an object with the keys 'name' and 'tag'
Lang.getPackNames = function () {
	var i, r = []
	for (i in Lang._packs) {
		r.push({
			name: Lang._packs[i].name,
			tag: Lang._packs[i].tag
		})
	}
	return r
}

// Change the language
// A pack with the given tag must have been already registered
// Save the value in localStorage
Lang.setLanguage = function (tag) {
	tag = tag.toLowerCase()
	if (!(tag in Lang._packs)) {
		throw new Error('Language pack ' + tag + ' not found')
	}
	localStorage.setItem(Lang.localStorageKey, tag)
	Lang._pack = Lang._packs[tag]
}

// Return the current language tag
Lang.getCurrentTag = function () {
	return Lang._pack.tag
}

// Start the lang module, must be called on window load event
// Call it before changing the initial DOM
Lang.init = function () {
	var langTag, packName, saved, replaceStrings
	langTag = (navigator.language || navigator.userLanguage).toLowerCase()

	// Try to get from a saved preference
	saved = localStorage.getItem(Lang.localStorageKey)
	if (saved) {
		Lang._pack = Lang._packs[saved.toLowerCase()]
	}

	// Try to find an exact match
	if (!Lang._pack && Lang._packs[langTag]) {
		Lang._pack = Lang._packs[langTag]
	}

	// Try to find an near match ('en' and 'en-us')
	if (!Lang._pack) {
		langTag = Lang._shortTag(langTag)
		for (packName in Lang._packs) {
			if (Lang._shortTag(packName) === langTag) {
				Lang._pack = Lang._packs[packName]
				break
			}
		}
	}

	// Use default fallback
	if (!Lang._pack) {
		Lang._pack = Lang._defaultPack
	}

	// Run the DOM, replacing strings
	replaceStrings = function (el) {
		var els, i, str
		els = el.children
		if (els.length) {
			for (i = 0; i < els.length; i++) {
				replaceStrings(els.item(i))
			}
		} else {
			str = el.textContent.trim()
			if (str.match(/^\[\[.*\]\]$/)) {
				el.innerHTML = Lang.getString(str.substr(2, str.length - 4))
			} else if (str) {
				console.log('Plain string detected: ' + str)
			}
		}
	}
	replaceStrings(document.body)
}

/*
Internals
*/

// All stored packages
Lang._packs = {}

// Current language pack (auto-detected at window load)
Lang._pack = null

Lang._defaultPack = null

// Return the short version of a language tag
// 'en-us' => 'en'
Lang._shortTag = function (tag) {
	var pos = tag.indexOf('-')
	return pos === -1 ? tag : tag.substr(0, pos)
}