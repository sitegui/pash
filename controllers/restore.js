/* globals Screens, Storage */
'use strict'

Screens.addController('restore', {
	oninit() {
		this.$('back').onclick = function () {
			Screens.show('options', null, true)
		}
		this.$('restore').onclick = () => {
			try {
				Storage.restore(this.$('textarea').value)
			} catch (e) {
				this.$('textarea').value = String(e)
				return
			}
			Screens.show('generate', null, true)
		}
	},
	onbeforeshow() {
		this.$('textarea').value = ''
	},
	onaftershow() {
		this.$('textarea').focus()
	}
})