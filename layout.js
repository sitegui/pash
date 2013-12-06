"use strict"

// Show there is a new available version
var updateAvailable = false
applicationCache.onupdateready = function () {
	var el = document.getElementById("update-alert")
	updateAvailable = true
	if (el) el.style.display = "block"
}

// Data saved into local storage
var _data

// Useful alias
var _ = Lang.getString

// Reset the local storage data
function resetData () {
	_data = {
		version: 1, // avoid compatibility issues
		userName: "", // the last used user name
		services: [], // the list of all used services, with the keys name, color, hitCount, decoder, length
		welcomed: false, // have already completed the tutorial?
		lastUsedMasterKeyHashed: "" // store the last masterKey used to create a service (hashed with strong decoder)
	}
}

// Load saved data and start the application
addEventListener("load", function () {
	Lang.init()
	
	// Update button
	if (!updateAvailable)
		document.getElementById("update-alert").style.display = "none"
	document.getElementById("update").onclick = function () {
		location.reload(false)
	}
	
	// Take care of the previously saved data
	_data = localStorage.getItem("pash-data")
	if (!_data)
		resetData()
	else
		_data = JSON.parse(_data)
	if (_data.version != 1) {
		alert(_("localStorageError"))
		return
	}
	
	Screens.show(_data.welcomed ? "generate" : "welcome")
	
	// Footer buttons
	document.getElementById("credits").onclick = function () {
		Screens.show("credits")
	}
	document.getElementById("options").onclick = function () {
		Screens.show("options")
	}
})

// Save the data in the browser storage
function saveData() {
	localStorage.setItem("pash-data", JSON.stringify(_data))
}
addEventListener("unload", saveData)
