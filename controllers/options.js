/* globals Screens, _, Storage, Lang */
'use strict'

Screens.addController('options', {
	oninit() {
		this.$('home').onclick = function () {
			Screens.show('generate', null, true)
		}

		this.$('clear').onclick = function () {
			if (confirm(_('options.confirmClear'))) {
				Storage.reset()
				location.reload(false)
			}
		}

		this.$('backup').onclick = () => {
			Screens.show('backup')
		}

		this.$('restore').onclick = () => {
			Screens.show('restore')
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

		// Save breadcrumbs configuration
		this.$('show-breadcrumbs').onchange = function () {
			Storage.data.breadcrumbs = this.checked
		}
	},
	onbeforeshow() {
		this.$('show-breadcrumbs').checked = Storage.data.breadcrumbs
	}
})