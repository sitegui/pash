/* globals Screens, Storage */
'use strict'

Screens.addController('backup', {
	oninit() {
		this.$('back').onclick = function () {
			Screens.show('options', null, true)
		}
	},
	onbeforeshow() {
		this.$('textarea').value = Storage.backup()
	},
	onaftershow() {
		this.$('textarea').select()
	}
})