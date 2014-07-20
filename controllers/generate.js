/*globals Screens, _, measurePasswordStrength, Pash, Storage*/
'use strict'

Screens.addController('generate', {
	// Store the current selected color element (or null if none)
	color: null,

	// Store references to input fields
	userName: null,
	masterKey: null,
	serviceName: null,
	selectServices: null,

	alertInterval: null,

	// Set the selected color as the given element (or null to unset)
	setColor: function (value) {
		this.$('color-options').style.backgroundColor = value ? value.dataset.cssColor : ''
		if (this.color) {
			this.color.classList.remove('color-option-selected')
		}
		if (value) {
			value.classList.add('color-option-selected')
		}
		this.color = value
	},

	// Show the alert with the given string
	alert: function (str) {
		var area = this.$('alert-area'),
			that = this
		area.style.display = ''
		area.textContent = str
		clearTimeout(this._alertInterval)
		this.alertInterval = setTimeout(function () {
			area.style.display = 'none'
			that.updateHeight()
		}, 5e3)
		this.updateHeight()
	},

	// Check if all fields are correctly filled
	// Return true in case of success, false otherwise
	validate: function () {
		var userName = this.userName.value,
			masterKey = this.masterKey.value,
			serviceName = this.serviceName.value,
			guessedColor
		if (!userName) {
			this.alert(_('generate.alert.name'))
			this.userName.focus()
			return false
		}
		if (masterKey.length < 8) {
			this.alert(_('generate.alert.masterKey'))
			this.masterKey.focus()
			return false
		}
		if (!serviceName) {
			this.alert(_('generate.alert.service'))
			return false
		}
		if (!this.color) {
			// Try to guess the color
			guessedColor = Storage.getColorForService(userName, serviceName)
			if (guessedColor) {
				this.setColor(this.$(guessedColor))
			} else {
				this.alert(_('generate.alert.color'))
				return false
			}
		}
		return true
	},

	// Try to generate password from the input values
	generate: function () {
		if (!this.validate()) {
			return
		}

		var userName = this.userName.value,
			masterKey = this.masterKey.value,
			serviceName = this.serviceName.value,
			cssColor = this.color.dataset.cssColor,
			color = this.color.id,
			pash = new Pash(masterKey, userName, serviceName, color)

		// Generate pash black key that will be used to check if the masterKey was typed right
		pash.generatePashKey(Pash.COLOR.BLACK, function (key) {
			var service = Storage.useService(userName, key, serviceName, color)
			if (service) {
				// All good, go to result screen to generate the password
				Screens.show('result', {
					pash: pash,
					userName: userName,
					service: service,
					cssColor: cssColor
				})
			} else {
				// The master key was different from last time, let the user choose what to do
				Screens.show('change-master-key', {
					pash: pash,
					userName: userName,
					service: service,
					cssColor: cssColor
				})
			}
		})
	},
	updateHistoryList: function () {
		var data = Storage.getUserData(this.userName.value),
			acc = 0,
			most = [],
			least = [],
			total, i, group

		if (!data || !data.services.length) {
			this.$('saved-services').style.display = 'none'
		} else {
			// Clean up
			this.$('saved-services').style.display = ''
			while (this.selectServices.children.length > 1) {
				this.selectServices.removeChild(this.selectServices.lastChild)
			}

			// Separate in two groups (most used, least used)
			data.services.sort(function (a, b) {
				return b.hitCount - a.hitCount
			})
			total = data.services.reduce(function (sum, service) {
				return sum + service.hitCount
			}, 0)
			for (i = 0; i < data.services.length; i++) {
				if (acc < total * 0.7) {
					most.push(data.services[i])
				} else {
					least.push(data.services[i])
				}
				acc += data.services[i].hitCount
			}
			most.sort(function (a, b) {
				return a.name > b.name ? 1 : -1
			})
			least.sort(function (a, b) {
				return a.name > b.name ? 1 : -1
			})

			// Create the elements
			if (least.length) {
				group = document.createElement('optgroup')
				group.label = _('generate.mostUsed')
				this.selectServices.appendChild(group)
			} else {
				group = this.selectServices
			}
			most.forEach(function (service) {
				var option = document.createElement('option')
				option.textContent = service.name + ' - ' + _('generate.color.' + service.color)
				option.dataset.name = service.name
				option.dataset.color = service.color
				group.appendChild(option)
			})
			if (least.length) {
				group = document.createElement('optgroup')
				group.label = _('generate.leastUsed')
				this.selectServices.appendChild(group)
				least.forEach(function (service) {
					var option = document.createElement('option')
					option.textContent = service.name + ' - ' + _('generate.color.' + service.color)
					option.dataset.name = service.name
					option.dataset.color = service.color
					group.appendChild(option)
				})
			}
			this.selectServices.selectedIndex = 0
		}
	},
	oninit: function () {
		var that = this

		this.userName = this.$('userName')
		this.masterKey = this.$('masterKey')
		this.serviceName = this.$('serviceName')
		this.selectServices = this.$('selectServices')
		this.selectServices.onchange = function () {
			var selected = this.options[this.selectedIndex]
			that.serviceName.value = selected.dataset.name
			that.setColor(that.$(selected.dataset.color))
			this.selectedIndex = 0
			that.generate()
		}
		this.$('get-help').onclick = function () {
			Screens.show('create-master-key', true)
		}
		this.$('generate').onclick = function () {
			that.generate()
		}
		this.$('home').onclick = function () {
			Screens.show('welcome', null, true)
		}

		// Listen to Enter key
		this.masterKey.onkeypress =
			this.serviceName.onkeypress = function (event) {
				if (event.keyCode === 13) {
					event.preventDefault()
					that.generate()
				}
		}

		this.userName.onkeyup = this.updateHistoryList.bind(this)

		// Give feedback about password strength
		this.masterKey.onchange = function () {
			var pass = this.value,
				score
			if (pass.length < 4) {
				this.className = ''
			} else if (pass.length < 8) {
				this.className = 'short'
			} else {
				score = measurePasswordStrength(pass)
				if (score <= 32) {
					this.className = 'weak'
				} else if (score <= 64) {
					this.className = 'ok'
				} else if (score <= 96) {
					this.className = 'great'
				} else {
					this.className = 'awesome'
				}
			}
		}

		// Color buttons
		this.$$('.color-option').forEach(function (el) {
			el.onclick = function (event) {
				that.setColor(event.currentTarget)
			}
		})
	},
	onbeforeshow: function () {
		// Reset fields
		this.userName.value = Storage.getCurrentUserName()
		this.updateHistoryList()
		this.setColor(null)
		this.serviceName.value = ''
	},
	onaftershow: function () {
		// Focus the best field
		if (this.userName.value) {
			this.masterKey.focus()
		} else {
			this.userName.focus()
		}
	},
	onafterhide: function () {
		this.masterKey.value = ''
		this.masterKey.className = ''
		this.serviceName.value = ''
	}
})