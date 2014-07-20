/*globals Screens*/
'use strict'

Screens.addController('credits', {
	oninit: function () {
		this.$('home').onclick = function () {
			Screens.show('generate', null, true)
		}
	}
})