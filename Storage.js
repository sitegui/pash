/* globals _, Pash*/
'use strict'

// Global singleton
let Storage = {}

// Actual storage object
// The format is described in Storage.reset()
// Changing any value here directly is not recomended
// Instead, use a method of Storage to do so (or create one if none fits your needs)
Storage.data = null

// Empty and reset the data to the initial state
Storage.reset = function () {
	/*
	Supported versions:
	
	[Version 2]
	{
		// true if the user has already completed the tutorial
		welcomed: Boolean,
		// the normalized name of the last user name used
		lastUser: String,
		// a hash map. Each key is the normalized user name  (lower case, no spaces)
		users: {
			'*': {
				// the denormalized user name
				name: String,
				// the normalized user name
				normalName: String,
				// a key derived from the user's master password: PASH(name, pass, 'pash', 'black')
				key: String,
				services: [{
					// the service display name
					name: String,
					// the service normalized name (lower case, no spaces)
					normalName: String,
					// the selected color (lower case, ex: 'red')
					color: String,
					// the selected output decoder (see Pash.FORMAT)
					format: 'int',
					// the number of times this service was used
					hitCount: 'int',
					// the selected output length (see Pash.LENGTH)
					length: 'int',
					// additional notes
					'notes?': String
				}]
			}
		},
		// whether breadcrumbs are active
		'breadcrumbs=false': Boolean
	}
	*/
	Storage.data = {
		version: 2,
		users: {},
		welcomed: false,
		lastUser: '',
		breadcrumbs: false
	}
}

/**
 * Load previously saved data from localStorage
 */
Storage.load = function () {
	let data = localStorage.getItem('pash-data')
	if (!data) {
		// Empty storage
		Storage.reset()
		return
	}

	try {
		Storage.restore(data)
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
	let normalName = Storage.data.lastUser
	if (!normalName || !(normalName in Storage.data.users)) {
		return ''
	}
	return Storage.data.users[normalName].name
}

// Return the data (as an object) for the given user (create the object if needed and create is true)
// Return null if not found
Storage.getUserData = function (userName, create) {
	let normalName = Pash.normalize(userName)
	if (!(normalName in Storage.data.users)) {
		if (!create) {
			return null
		}
		Storage.data.users[normalName] = {
			name: userName,
			normalName,
			key: '',
			services: []
		}
		Storage.save()
	}
	return Storage.data.users[normalName]
}

// Return the data (as an object) for the given service and user (create if needed)
Storage.getServiceData = function (userName, serviceName, color) {
	let data = Storage.getUserData(userName, true),
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
		color,
		format: Pash.FORMAT.STANDARD,
		hitCount: 0,
		length: Pash.LENGTH.MEDIUM
	}
	data.services.push(service)
	Storage.save()
	return service
}

// Return the color name (as a string) for the given service name for the given user
// Both user and service are strings
// Return empty string if not found one exact match
Storage.getColorForService = function (user, service) {
	let data = Storage.getUserData(user, true),
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
	let userData = Storage.getUserData(userName, true),
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
 * @returns {string}
 */
Storage.backup = function () {
	return JSON.stringify(Storage.data)
}

/**
 * Import data from a string.
 * If the operation fails an exception is thrown
 * @param {string} data
 */
Storage.restore = function (data) {
	let parsed = JSON.parse(data)
	if (parsed.version !== 2) {
		throw new Error('Incompatible')
	}

	// Set default values
	if (parsed.breadcrumbs === undefined) {
		parsed.breadcrumbs = false
	}

	Storage.data = parsed
}