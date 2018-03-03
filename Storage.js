/*globals _, Pash*/
'use strict'

// Global singleton
var Storage = {}

// Actual storage object
// The format is described in Storage.reset()
// Changing any value here directly is not recomended
// Instead, use a method of Storage to do so (or create one if none fits your needs)
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
	    a hash map. Each key is the normalized user name  (lower case, no spaces)
	  users[user].name: string
	    the denormalized user name
	  users[user].normalName: string
	    the normalized user name
	  users[user].key: string
	    a key derived from the user's master password: PASH(name, pass, 'pash', 'black')
	  users[user].services.$.name: string
	    the service display name
	  users[user].services.$.normalName: string
	    the service normalized name (lower case, no spaces)
	  users[user].services.$.color: string
	    the selected color (lower case, ex: 'red')
	  users[user].services.$.format: int
	    the selected output decoder (see Pash.FORMAT)
	  users[user].services.$.hitCount: int
	    the number of times this service was used
	  users[user].services.$.length: int
	    the selected output length (see Pash.LENGTH)
	
	[Version 3]
	  Compatible with version 2, adding these fields:
	  users[user].sync: boolean
	    true if the user wants to use the sync feature
	  users[user].services.$.id: string
	    unique string, based on service normalized name and color
		HMAC(PASH(name, pass, 'pash', 'green'), JSON.stringify([normalName, color]))
		This is only filled when syncing is performed
	  users[user].services.$.lastUpdate: int
	    the timestamp this service was last modified
	  users[user].services.$.lastHitCount: int
	    the last observed hitCount when syncing with the server
	  users[user].removedServices.$: string
	    the id of the removed services
	*/
	Storage.data = {
		version: 3,
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

		if (Storage.data.version === 2) {
			Storage.upgradeFromV2()
		} else if (Storage.data.version !== 3) {
			throw new Error('Incompatible')
		}
	} catch (e) {
		// Error (corrupted or incompatible data)
		alert(_('localStorageError'))
		console.error(e)
		Storage.reset()
	}
}

// Save the data in the browser storage
Storage.save = function () {
	localStorage.setItem('pash-data', JSON.stringify(Storage.data))
}

// Set the welcomed flag as true
Storage.setWelcomed = function () {
	if (!Storage.data.welcomed) {
		Storage.data.welcomed = true
		Storage.save()
	}
}

// Return the name for the current user (or '' if none)
Storage.getCurrentUserName = function () {
	var normalName = Storage.data.lastUser
	if (!normalName || !(normalName in Storage.data.users)) {
		return ''
	}
	return Storage.data.users[normalName].name
}

// Return the data (as an object) for the given user (create the object if needed and create is true)
// Return null if not found
Storage.getUserData = function (userName, create) {
	var normalName = Pash.normalize(userName)
	if (!(normalName in Storage.data.users)) {
		if (!create) {
			return null
		}
		Storage.data.users[normalName] = {
			name: userName,
			normalName: normalName,
			key: '',
			sync: false,
			services: [],
			removedServices: []
		}
		Storage.save()
	}
	return Storage.data.users[normalName]
}

// Return the data (as an object) for the given service and user (create if needed)
Storage.getServiceData = function (userName, serviceName, color) {
	var data = Storage.getUserData(userName, true),
		serviceNormalName = Pash.normalize(serviceName),
		i, service

	// Try to find
	for (i = 0; i < data.services.length; i++) {
		service = data.services[i]
		if (service.normalName === serviceNormalName && service.color === color) {
			return service
		}
	}

	// Create
	service = {
		name: serviceName,
		normalName: serviceNormalName,
		color: color,
		id: '',
		format: Pash.FORMAT.STANDARD,
		hitCount: 0,
		length: Pash.LENGTH.MEDIUM,
		lastUpdate: 0,
		lastHitCount: 0
	}
	data.services.push(service)
	Storage.save()
	return service
}

// Return the color name (as a string) for the given service name for the given user
// Both user and service are strings
// Return empty string if not found one exact match
Storage.getColorForService = function (user, service) {
	var data = Storage.getUserData(user, true),
		foundColor = '',
		i

	service = Pash.normalize(service)
	for (i = 0; i < data.services.length; i++) {
		if (data.services[i].normalName === service) {
			if (foundColor) {
				// Another possible answer already found
				return ''
			}
			foundColor = data.services[i].color
		}
	}

	return foundColor
}

// Check if the masterKey is correct and increase the hit count for the service
// Return the service data or null if the key is wrong
// userName, key, serviceName and color are strings
// key is the pash black key
// Force is an optional bool that, if true, turn off key check and overwrite it
Storage.useService = function (userName, key, serviceName, color, force) {
	var userData = Storage.getUserData(userName, true),
		serviceData = Storage.getServiceData(userName, serviceName, color)

	if (!userData.key || force) {
		// New user or forced
		userData.key = key
	} else if (userData.key !== key) {
		// Probably the user typed his master password incorrectly
		return null
	}

	serviceData.hitCount += 1
	Storage.data.lastUser = userData.normalName
	Storage.save()
	return serviceData
}

/**
 * Upgrade local data from v2 to v3
 */
Storage.upgradeFromV2 = function () {
	Storage.data.version = 3
	for (var userName in Storage.data.users) {
		var user = Storage.data.users[userName]
		user.sync = false
		user.removedServices = []
		user.services.forEach(function (service) {
			service.id = ''
			service.lastUpdate = 0
			service.lastHitCount = 0
		})
	}
}