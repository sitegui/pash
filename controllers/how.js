Screens.addController("how", {oninit: function () {
	var moreButton, moreInfo, that = this
	moreButton = this.$("more-button")
	moreInfo = this.$("more-info")
	moreButton.onclick = function () {
		moreButton.style.display = "none"
		moreInfo.style.display = "block"
		that.updateHeight()
	}
	this.$("check-for-yourself").onclick = function () {
		Screens.show("create-master-key")
	}
}, onbeforeshow: function () {
	this.$("more-button").style.display = ""
	this.$("more-info").style.display = "none"
}})
