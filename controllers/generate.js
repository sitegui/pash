Screens.addController("generate", {oninit: function () {
	var colorClick, that = this, alertInterval, _selectedColor
	
	_selectedColor = null
	Object.defineProperty(this, "selectedColor", {get: function () {
		return _selectedColor
	}, set: function (value) {
		that.$("color-options").style.backgroundColor = value ? value.dataset.color : ""
		if (_selectedColor)
			_selectedColor.classList.remove("color-option-selected")
		if (value)
			value.classList.add("color-option-selected")
		_selectedColor = value
	}})
	
	this.userName = this.$("userName")
	this.userName.value = _data.userName
	this.masterKey = this.$("masterKey")
	this.serviceName = this.$("serviceName")
	this.selectServices = this.$("selectServices")
	this.alert = function (str) {
		var area = that.$("alert-area")
		area.style.display = ""
		area.textContent = str
		clearTimeout(alertInterval)
		alertInterval = setTimeout(function () {
			area.style.display = "none"
			that.updateHeight()
		}, 5e3)
		that.updateHeight()
	}
	this.selectServices.onchange = function () {
		var selected = this.options[this.selectedIndex]
		that.serviceName.value = selected.dataset.name
		that.selectedColor = that.el.querySelectorAll(".color-option")[selected.dataset.colorId]
		this.selectedIndex = 0
		that.$("generate").click()
	}
	this.$("get-help").onclick = function () {
		Screens.show("create-master-key", true)
	}
	this.$("generate").onclick = function () {
		var userName, masterKey, serviceName, colorId, color, raw, i, service, hashedMasterKey, mayBeWrong, resultData
		
		// Validate
		userName = that.userName.value
		masterKey = that.masterKey.value
		serviceName = that.serviceName.value
		if (!userName) {
			that.alert("What's your name?")
			that.userName.focus()
			return
		}
		if (masterKey.length < 8) {
			that.alert("Master key too short, choose a good one!")
			that.masterKey.focus()
			return
		}
		if (!serviceName) {
			that.alert("Type in the service name")
			return
		}
		if (!that.selectedColor) {
			that.alert("Please select one color")
			return
		}
		color = that.selectedColor.dataset.color
		colorId = that.selectedColor.dataset.colorId
		
		// Save the data
		raw = generateRawPassword(userName, masterKey, serviceName, colorId)
		_data.userName = userName
		for (i=0; i<_data.services.length; i++) {
			service = _data.services[i]
			if (service.name.toUpperCase() == serviceName.toUpperCase() && service.colorId == colorId) {
				service.hitCount++
				break
			}
		}
		mayBeWrong = false
		if (i == _data.services.length) {
			hashedMasterKey = applyStrongDecoder(CryptoJS.SHA256(masterKey), PASH_LENGTH_LONG)
			service = {name: serviceName, colorId: Number(colorId), hitCount: 1, encoder: PASH_DECODER_STANDARD, length: PASH_LENGTH_MEDIUM}
			
			// Compare the used key with the previous
			if (_data.lastUsedMasterKeyHashed)
				mayBeWrong = hashedMasterKey != _data.lastUsedMasterKeyHashed
			else
				_data.lastUsedMasterKeyHashed = hashedMasterKey
			
			if (!mayBeWrong)
			_data.services.push(service)
		}
		saveData()
		
		// Create the raw pack
		resultData = {raw: raw, userName: userName, service: service, color: color}
		if (mayBeWrong)
			Screens.show("change-master-key", {resultData: resultData, hashedMasterKey: hashedMasterKey, service: service})
		else
			Screens.show("result", resultData)
	}
	this.$("home").onclick = function () {
		Screens.show("welcome", null, true)
	}
	
	// Color buttons
	colorClick = function (event) {
		that.selectedColor = event.currentTarget
	}
	;[].forEach.call(this.el.querySelectorAll(".color-option"), function (el) {
		el.onclick = colorClick
	})
}, onbeforeshow: function (obj) {
	var group, colorNames, totalHitCount, that = this, acumulator, mostUsed, leastUsed, i
	
	// Reset service fields
	this.selectedColor = obj ? this.el.querySelectorAll(".color-option")[obj.colorId] : null
	this.serviceName.value = obj ? obj.serviceName : ""
	
	// Populate the saved services choose box
	if (!_data.services.length)
		this.$("saved-services").style.display = "none"
	else {
		// Clean-up
		this.$("saved-services").style.display = ""
		while (this.selectServices.children.length > 1)
			this.selectServices.removeChild(this.selectServices.lastChild)
		
		// Separate in two groups (most used, least used)
		_data.services.sort(function (a, b) {
			return b.hitCount-a.hitCount
		})
		totalHitCount = _data.services.reduce(function (sum, service) {
			return sum+service.hitCount
		}, 0)
		acumulator = 0
		mostUsed = []
		leastUsed = []
		for (i=0; i<_data.services.length; i++) {
			if (acumulator < totalHitCount*.7)
				mostUsed.push(_data.services[i])
			else
				leastUsed.push(_data.services[i])
			acumulator += _data.services[i].hitCount
		}
		mostUsed.sort(function (a, b) {
			return a.name > b.name ? 1 : -1
		})
		leastUsed.sort(function (a, b) {
			return a.name > b.name ? 1 : -1
		})
		
		// Create the elements
		colorNames = ["black", "gray", "brown", "red", "green", "blue", "yellow", "orange", "purple"]
		if (leastUsed.length) {
			group = document.createElement("optgroup")
			group.label = "Most used"
			this.selectServices.appendChild(group)
		} else
			group = this.selectServices
		mostUsed.forEach(function (service) {
			var option = document.createElement("option")
			option.textContent = service.name+" - "+colorNames[service.colorId]
			option.dataset.name = service.name
			option.dataset.colorId = service.colorId
			group.appendChild(option)
		})
		if (leastUsed.length) {
			group = document.createElement("optgroup")
			group.label = "Least used"
			this.selectServices.appendChild(group)
			leastUsed.forEach(function (service) {
				var option = document.createElement("option")
				option.textContent = service.name+" - "+colorNames[service.colorId]
				option.dataset.name = service.name
				option.dataset.colorId = service.colorId
				group.appendChild(option)
			})
		}
		this.selectServices.selectedIndex = 0
	}
}, onaftershow: function () {
	// Focus the best field
	if (this.userName.value)
		this.masterKey.focus()
	else
		this.userName.focus()
}, onafterhide: function () {
	this.masterKey.value = ""
	this.serviceName.value = ""
}})
