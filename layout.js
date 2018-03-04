/* globals _, Lang, Screens, Storage*/
'use strict'

// Show there is a new available version
let updateAvailable = false
applicationCache.onupdateready = function () {
	let el = document.getElementById('update-alert')
	updateAvailable = true
	if (el) {
		el.style.display = 'block'
	}
}

// Useful alias
// eslint-disable-next-line no-unused-vars
let _ = Lang.getString

// Load saved data and start the application
addEventListener('load', () => {
	Lang.init()

	// Update button
	if (!updateAvailable) {
		document.getElementById('update-alert').style.display = 'none'
	}
	document.getElementById('update').onclick = function () {
		location.reload(false)
	}

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