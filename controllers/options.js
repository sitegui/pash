Screens.addController("options", {oninit: function () {
	this.$("home").onclick = function () {
		Screens.show("generate", true)
	}
	
	// Set footer buttons
	this.$("clear").onclick = function () {
		if (confirm(_("options.confirmClear"))) {
			resetData()
			location.reload(false)
		}
	}
	
	// Control the install button
	var request, that = this
	if (navigator.mozApps) {
		request = navigator.mozApps.getInstalled()
		request.onsuccess = function () {
			if (request.result[0]) {
				setTimeout(function () {
					request.result[0].checkForUpdate()
				}, 15e3)
				that.$("install").style.display = "none"
			}
		}
	}
	this.$("install").onclick = function () {
		if (navigator.mozApps)
			navigator.mozApps.install("/webapp.webapp")
		else
			alert(_("options.installError"))
	}
	
	// Populate language options
	var element, langs, i, option, current
	langs = Lang.getPackNames()
	element = this.$("language")
	current = Lang.getCurrentTag()
	for (i=0; i<langs.length; i++) {
		option = document.createElement("option")
		option.textContent = langs[i].name
		option.value = langs[i].tag
		if (langs[i].tag.toLowerCase() == current)
			option.selected = true
		element.appendChild(option)
	}
	element.onchange = function () {
		Lang.setLanguage(this.value)
		location.reload(false)
	}
}})
