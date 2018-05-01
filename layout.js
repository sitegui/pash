/* globals _, Lang, Screens, Storage*/
'use strict'

// Useful alias
// eslint-disable-next-line no-unused-vars
let _ = Lang.getString

// Load saved data and start the application
addEventListener('load', () => {
	Lang.init()

	Storage.load()
	Screens.show(Storage.data.welcomed ? 'generate' : 'welcome')

	// Footer buttons
	document.getElementById('credits').onclick = function () {
		Screens.show('credits')
	}
	document.getElementById('options').onclick = function () {
		Screens.show('options')
	}
})

addEventListener('unload', Storage.save)