/*globals _*/
'use strict'

// Global singleton
var Storage = {}

// Actual storage object
// The format is described in Storage.reset()
// Changing any value here directly is not recomended
// Instead, use a method of Storage to do so (or create one if none apply to your needs)
Storage.data = null

// Empty and reset the data to the initial state
Storage.reset = function () {
	/*
	Change log:
	
	[Version 1]
	  userName: string
	  services.$.name: string
	  services.$.color: string
	  services.$.decoder: int
	  services.$.hitCount: int
	  services.$.length: int
	  welcomed: bool
	  lastUsedMasterKeyHashed: string
	
	[Version 2]
	  welcomed: bool
	    true if the user has already completed the tutorial
	  lastUser: string
	    the normalized name of the last user name used
	  users: object
	    a hash map. Each key is the normalized user name (lower case, no spaces)
	  users[user].name: string
	    the denormalized user name
	  users[user].key: string
	    a key derived from the user's master password: PASH(name, pass, 'pash', 'red')
	  users[user].hasAccount: bool
	    true if the user has created his account
	  users[user].services.$.name: string
	    the service display name
	  users[user].services.$.normalName: string
	    the service normalized name (lower case, no spaces)
	  users[user].services.$.color: string
	    the selected color (lower case, ex: 'red')
	  users[user].services.$.decoder: int
	    the selected output decoder (see Pash.decoder)
	  users[user].services.$.hitCount: int
	    the number of times this service was used
	  users[user].services.$.length: int
	    the selected output length (see Pash.length)
	*/
	Storage.data = {
		version: 2,
		users: {},
		welcomed: false,
		lastUser: ''
	}
}

// Load previously saved data from localStorage
Storage.load = function () {
	var data = localStorage.getItem('pash-data')
	if (!data) {
		// Empty storage
		Storage.reset()
		return
	}

	try {
		Storage.data = JSON.parse(data)
		if (Storage.data.version !== 2) {
			throw new Error('Incompatible')
		}
	} catch (e) {
		// Error (corrupted or incompatible data)
		alert(_('localStorageError'))
		Storage.reset()
	}
}

// Save the data in the browser storage
Storage.save = function () {
	localStorage.setItem('pash-data', JSON.stringify(Storage.data))
}

// Return the data (as an object) for the current user (or null if not found)
Storage.getUserData = function () {
	var user = Storage.data.lastUser
	if (!user || !(user in Storage.data.users)) {
		return null
	}
	return Storage.data.users[user]
}

// Return the color name (as a string) for the given service name for the current user
// Return empty string if not found one exact match
Storage.getColorForService = function (service) {
	var user = Storage.getUserData(),
		i, foundColor = ''
	if (!user) {
		// Current user not found
		return ''
	}

	for (i = 0; i < user.services.length; i++) {
		if (user.services[i].name === service) {
			if (foundColor) {
				// Another possible answer already found
				return ''
			}
			foundColor = user.services[i].color
		}
	}

	return foundColor
}