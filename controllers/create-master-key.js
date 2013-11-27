Screens.addController("create-master-key", {oninit: function () {
	var that = this
	
	this.processPassword = function () {
		var hintsSpan, resultSpan, str, resultArea
		var info, score, hints = []
		hintsSpan = that.$("hints")
		resultSpan = that.$("result")
		resultArea = that.$("result-area")
		hintsSpan.textContent = ""
		str = that.$("password").value
		resultArea.style.backgroundColor = "rgba(0, 0, 0, .5)"
		if (str.length < 4) {
			resultSpan.textContent = _("createMasterKey.score.empty")
		} else if (str.length < 8) {
			resultSpan.textContent = _("createMasterKey.score.short")
			resultArea.style.backgroundColor = "rgba(255, 0, 0, .5)"
		} else {
			info = {}
			score = measurePasswordStrength(str, info)
			if (score < 10) {
				resultSpan.textContent = _("createMasterKey.score.weak")
				resultArea.style.backgroundColor = "rgba(255, 0, 0, .5)"
			} else if (score < 20) {
				resultSpan.textContent = _("createMasterKey.score.ok")
				resultArea.style.backgroundColor = "rgba(255, 255, 0, .5)"
			} else if (score < 30) {
				resultSpan.textContent = _("createMasterKey.score.great")
				resultArea.style.backgroundColor = "rgba(0, 255, 0, .5)"
			} else {
				resultSpan.textContent = _("createMasterKey.score.awesome")
				resultArea.style.backgroundColor = "rgba(0, 0, 255, .5)"
			}
			if (!info.hasDigits)
				hints.push(_("createMasterKey.hints.digits"))
			if (!info.hasLetters)
				hints.push(_("createMasterKey.hints.letters"))
			else if (!info.hasDifferentCases)
				hints.push(_("createMasterKey.hints.cases"))
			if (!info.hasSymbols)
				hints.push(_("createMasterKey.hints.symbols"))
			if (hints.length)
				hintsSpan.textContent = _("createMasterKey.hints.prefix")+hints.slice(0, 2).join(_("createMasterKey.hints.infix"))
		}
		that.updateHeight()
	}
	
	this.$("pash").onclick = function () {
		_data.welcomed = true
		Screens.show("generate")
	}
	this.$("show-helper").onclick = function () {
		that.$("helper").style.display = "block"
		this.style.display = "none"
		that.$("password").focus()
		that.updateHeight()
	}
	var interval = null
	this.$("password").onkeyup = function () {
		clearTimeout(interval)
		interval = setTimeout(that.processPassword, 500)
	}
	this.$("result-area").style.transition = "background-color .5s ease"
}, onbeforeshow: function (wantHelp) {
	this.$("show-helper").style.display = wantHelp ? "none" : ""
	this.$("helper").style.display = wantHelp ? "block" : "none"
	this.$("password").value = ""
	this.processPassword()
}, onaftershow: function (wantHelp) {
	if (wantHelp)
		this.$("password").focus()
}, onafterhide: function () {
	this.$("password").value = ""
}})
