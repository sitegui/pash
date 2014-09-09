/*globals Screens*/
'use strict'

Screens.addController('welcome', {
	enterListener: function (event) {
		if (event.keyCode === 13) {
			event.preventDefault()
			Screens.show('generate')
		}
	},
	oninit: function () {
		this.$('know-more-button').onclick = function () {
			Screens.show('how')
		}
		this.$('skip-button').onclick = function () {
			Screens.show('generate')
		}
	},
	onaftershow: function () {
		document.body.addEventListener('keyup', this.enterListener)
	},
	onbeforehide: function () {
		document.body.removeEventListener('keyup', this.enterListener)
	}
})