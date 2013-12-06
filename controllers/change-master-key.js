Screens.addController("change-master-key", {oninit: function () {
	var that = this
	this.$("try-again").onclick = function () {
		var data = {serviceName: that.serviceData.name, color: that.serviceData.color}
		Screens.show("generate", data, true)
	}
	this.$("its-ok").onclick = function () {
		_data.lastUsedMasterKeyHashed = that.hashedMasterKey
		_data.services.push(that.serviceData)
		Screens.show("result", that.resultData)
	}
	this.$("info-button").onclick = function () {
		that.$("info").style.display = "inherit"
		this.style.display = "none"
		that.updateHeight()
	}
}, onbeforeshow: function (data) {
	this.serviceData = data.service
	this.hashedMasterKey = data.hashedMasterKey
	this.resultData = data.resultData
	this.$("info").style.display = "none"
	this.$("info-button").style.display = ""
	this.$("current").textContent = _data.lastUsedMasterKeyHashed
	this.$("new").textContent = data.hashedMasterKey
}, onafterhide: function () {
	this.serviceData = null
	this.hashedMasterKey = null
	this.resultData = null
	this.$("current").textContent = _data.lastUsedMasterKeyHashed
	this.$("new").textContent = data.hashedMasterKey
}})
