/* globals Screens*/
'use strict'

Screens.addController('credits', {
	oninit () {
		this.$('home').onclick = function () {
			Screens.show('generate', null, true)
		}
	}
})