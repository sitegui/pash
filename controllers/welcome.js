Screens.addController("welcome", {oninit: function () {
	this.$("know-more-button").onclick = function () {
		Screens.show("how")
	}
}})
