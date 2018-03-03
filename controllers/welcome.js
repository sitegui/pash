/* globals Screens*/
'use strict'

Screens.addController('welcome', {
	enterListener (event) {
		if (event.keyCode === 13) {
			event.preventDefault()
			Screens.show('generate')
		}
	},
	oninit () {
		this.$('know-more-button').onclick = function () {
			Screens.show('how')
		}
		this.$('skip-button').onclick = function () {
			Screens.show('generate')
		}
	},
	onaftershow () {
		document.body.addEventListener('keyup', this.enterListener)
	},
	onbeforehide () {
		document.body.removeEventListener('keyup', this.enterListener)
	}
})