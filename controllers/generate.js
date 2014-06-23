/*globals Screens, _, Storage, CryptoJS, measurePasswordStrength, Pash*/
'use strict'

Screens.addController('generate', {
	// Store the current selected color element (or null if none)
	color: null,

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
		this._alertInterval = setTimeout(function () {
			area.style.display = 'none'
			that.updateHeight()
		}, 5e3)
		this.updateHeight()
	},
	_alertInterval: null,

	// Try to generate password from the input values
	generate: function () {
		var i, service, hashedMasterKey, mayBeWrong, resultData

		// Validate
		var userName = this.userName.value
		var masterKey = this.masterKey.value
		var serviceName = this.serviceName.value
		if (!userName) {
			this.alert(_('generate.alert.name'))
			this.userName.focus()
			return
		}
		if (masterKey.length < 8) {
			this.alert(_('generate.alert.masterKey'))
			this.masterKey.focus()
			return
		}
		if (!serviceName) {
			this.alert(_('generate.alert.service'))
			return
		}
		if (!this.color) {
			// Try to guess
			for (i = 0; i < _data.services.length; i++) {
				if (_data.services[i].name === serviceName) {
					this.setColor(this.$(_data.services[i].color))
					break
				}
			}

			if (!this.color) {
				// Could not guess
				this.alert(_('generate.alert.color'))
				return
			}
		}
		var cssColor = this.color.dataset.cssColor
		var color = this.color.id

		// Generate raw value
		var raw = Pash.generateRawPassword(userName, masterKey, serviceName, color)

		// Save basic info into _data
		_data.userName = userName
		for (i = 0; i < _data.services.length; i++) {
			service = _data.services[i]
			if (service.name.toUpperCase() === serviceName.toUpperCase() &&
				service.color === color) {
				service.hitCount++
				break
			}
		}

		mayBeWrong = false
		if (i === _data.services.length) {
			hashedMasterKey = Pash._applyStrongDecoder(CryptoJS.SHA256(masterKey), Pash.length.LONG)
			service = {
				name: serviceName,
				color: color,
				hitCount: 1,
				decoder: Pash.decoder.STANDARD,
				length: Pash.length.MEDIUM
			}

			// Compare the used key with the previous
			if (_data.lastUsedMasterKeyHashed) {
				mayBeWrong = hashedMasterKey !== _data.lastUsedMasterKeyHashed
			} else {
				_data.lastUsedMasterKeyHashed = hashedMasterKey
			}

			if (!mayBeWrong) {
				_data.services.push(service)
			}
		}
		saveData()

		// Create the raw pack
		resultData = {
			raw: raw,
			userName: userName,
			service: service,
			cssColor: cssColor
		}
		if (mayBeWrong) {
			Screens.show('change-master-key', {
				resultData: resultData,
				hashedMasterKey: hashedMasterKey,
				service: service
			})
		} else {
			Screens.show('result', resultData)
		}
	},
	oninit: function () {
		var that = this

		this.userName = this.$('userName')
		this.userName.value = _data.userName
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
		this.userName.onkeypress =
			this.masterKey.onkeypress =
			this.serviceName.onkeypress = function (event) {
				if (event.keyCode === 13) {
					event.preventDefault()
					that.generate()
				}
		}

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
	// options is an optional object with keys:
	// color: the color name to select as default (example: 'red')
	// serviceName: the default value for service name (as a string)
	onbeforeshow: function (options) {
		var group, totalHitCount, acumulator, mostUsed, leastUsed, i

		// Reset service fields
		this.setColor(options ? this.$(options.color) : null)
		this.serviceName.value = options ? options.serviceName : ''

		// Populate the saved services choose box
		if (!_data.services.length) {
			this.$('saved-services').style.display = 'none'
		} else {
			// Clean-up
			this.$('saved-services').style.display = ''
			while (this.selectServices.children.length > 1) {
				this.selectServices.removeChild(this.selectServices.lastChild)
			}

			// Separate in two groups (most used, least used)
			_data.services.sort(function (a, b) {
				return b.hitCount - a.hitCount
			})
			totalHitCount = _data.services.reduce(function (sum, service) {
				return sum + service.hitCount
			}, 0)
			acumulator = 0
			mostUsed = []
			leastUsed = []
			for (i = 0; i < _data.services.length; i++) {
				if (acumulator < totalHitCount * 0.7) {
					mostUsed.push(_data.services[i])
				} else {
					leastUsed.push(_data.services[i])
				}
				acumulator += _data.services[i].hitCount
			}
			mostUsed.sort(function (a, b) {
				return a.name > b.name ? 1 : -1
			})
			leastUsed.sort(function (a, b) {
				return a.name > b.name ? 1 : -1
			})

			// Create the elements
			if (leastUsed.length) {
				group = document.createElement('optgroup')
				group.label = _('generate.mostUsed')
				this.selectServices.appendChild(group)
			} else {
				group = this.selectServices
			}
			mostUsed.forEach(function (service) {
				var option = document.createElement('option')
				option.textContent = service.name + ' - ' + _('generate.color.' + service.color)
				option.dataset.name = service.name
				option.dataset.color = service.color
				group.appendChild(option)
			})
			if (leastUsed.length) {
				group = document.createElement('optgroup')
				group.label = _('generate.leastUsed')
				this.selectServices.appendChild(group)
				leastUsed.forEach(function (service) {
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