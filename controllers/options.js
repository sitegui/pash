/* globals Screens, _, Storage, Lang*/
'use strict'

Screens.addController('options', {
	oninit () {
		this.$('home').onclick = function () {
			Screens.show('generate', null, true)
		}

		// Set footer buttons
		this.$('clear').onclick = function () {
			if (confirm(_('options.confirmClear'))) {
				Storage.reset()
				location.reload(false)
			}
		}

		// Populate language options
		let element, langs, i, option, current
		langs = Lang.getPackNames()
		element = this.$('language')
		current = Lang.getCurrentTag()
		for (i = 0; i < langs.length; i++) {
			option = document.createElement('option')
			option.textContent = langs[i].name
			option.value = langs[i].tag
			if (langs[i].tag.toLowerCase() === current) {
				option.selected = true
			}
			element.appendChild(option)
		}
		element.onchange = function () {
			Lang.setLanguage(this.value)
			location.reload(false)
		}
	}
})