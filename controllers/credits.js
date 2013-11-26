Screens.addController("credits", {oninit: function () {
	this.$("home").onclick = function () {
		Screens.show("welcome", true)
	}
}})
