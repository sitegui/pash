Screens.addController("credits", {oninit: function () {
	this.$("home").onclick = function () {
		Screens.show("generate", true)
	}
}})
