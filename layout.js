"use strict"

// Debug
function log(str) {
	return function () {
		var status
		switch (applicationCache.status) {
			case applicationCache.CHECKING: status = "CHECKING"; break
			case applicationCache.DOWNLOADING: status = "DOWNLOADING"; break
			case applicationCache.IDLE: status = "IDLE"; break
			case applicationCache.OBSOLETE: status = "OBSOLETE"; break
			case applicationCache.UNCACHED: status = "UNCACHED"; break
			case applicationCache.UPDATEREADY: status = "UPDATEREADY"; break
		}
		console.log(str, status)
	}
}
applicationCache.oncached = log("cached")
applicationCache.onchecking = log("checking")
applicationCache.ondownloading = log("downloading")
applicationCache.onerror = log("error")
applicationCache.onupdate = log("update")
applicationCache.onobsolete = log("obsolete")
applicationCache.onprogress = log("progress")
applicationCache.onupdateready = log("updateready")

// Data saved into local storage
var _data

// Load saved data and start the application
addEventListener("load", function () {
	var resetData, request
	
	Lang.init()
	
	// Take care of the previously saved data
	_data = localStorage.getItem("pash-data")
	resetData = function () {
		_data = {
			version: 1, // avoid compatibility issues
			userName: "", // the last used user name
			services: [], // the list of all used services, with the keys name, colorId, hitCount, encoder, length
			welcomed: false, // have already completed the tutorial?
			lastUsedMasterKeyHashed: "" // store the last masterKey used to create a service (hashed with strong decoder)
		}
	}
	if (!_data)
		resetData()
	else
		_data = JSON.parse(_data)
	if (_data.version != 1) {
		alert("Could not open saved data, try updating this page.\nIf this problem persists, clear the browser cache")
		return
	}
	
	Screens.show(_data.welcomed ? "generate" : "welcome")
	
	// Set footer buttons
	document.getElementById("clear-data").onclick = function () {
		if (confirm("This will clear all you saved data (your name and your services).\nAre you sure?")) {
			resetData()
			location.reload(false)
		}
	}
	
	// Control the install button
	var request
	if (navigator.mozApps) {
		request = navigator.mozApps.getInstalled()
		request.onsuccess = function () {
			if (request.result[0]) {
				setTimeout(function () {
					request.result[0].checkForUpdate()
				}, 15e3)
				document.getElementById("install-app").style.display = "none"
			}
		}
	}
	document.getElementById("install-app").onclick = function () {
		if (navigator.mozApps)
			navigator.mozApps.install("http://pash.sitegui.com.br/webapp.webapp")
		else
			alert("This function is only available in Firefox (Desktop or Android)")
	}
	
	// Credits button
	document.getElementById("credits").onclick = function () {
		Screens.show("credits")
	}
})

// Save the data in the browser storage
function saveData() {
	localStorage.setItem("pash-data", JSON.stringify(_data))
}
addEventListener("unload", saveData)
