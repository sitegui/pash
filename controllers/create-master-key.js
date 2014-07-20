/*globals Screens, _, measurePasswordStrength, Storage*/
'use strict'

Screens.addController('create-master-key', {
	processPassword: function () {
		var hintsSpan, resultSpan, str, resultArea, scoreSpan
		var info, score, hints = []
		hintsSpan = this.$('hints')
		scoreSpan = this.$('score')
		resultSpan = this.$('result')
		resultArea = this.$('result-area')
		hintsSpan.textContent = scoreSpan.textContent = ''
		str = this.$('password').value
		resultArea.style.backgroundColor = 'rgba(0, 0, 0, .5)'
		if (str.length < 4) {
			resultSpan.textContent = _('createMasterKey.score.empty')
		} else if (str.length < 8) {
			resultSpan.textContent = _('createMasterKey.score.short')
			resultArea.style.backgroundColor = 'rgba(255, 0, 0, .5)'
		} else {
			info = {}
			score = measurePasswordStrength(str, info)
			if (score <= 32) {
				resultSpan.textContent = _('createMasterKey.score.weak')
				resultArea.style.backgroundColor = 'rgba(255, 0, 0, .5)'
			} else if (score <= 64) {
				resultSpan.textContent = _('createMasterKey.score.ok')
				resultArea.style.backgroundColor = 'rgba(255, 255, 0, .5)'
			} else if (score <= 96) {
				resultSpan.textContent = _('createMasterKey.score.great')
				resultArea.style.backgroundColor = 'rgba(0, 255, 0, .5)'
			} else {
				resultSpan.textContent = _('createMasterKey.score.awesome')
				resultArea.style.backgroundColor = 'rgba(0, 0, 255, .5)'
			}
			if (!info.hasDigits) {
				hints.push(_('createMasterKey.hints.digits'))
			}
			if (!info.hasLetters) {
				hints.push(_('createMasterKey.hints.letters'))
			} else if (!info.hasCases) {
				hints.push(_('createMasterKey.hints.cases'))
			} else if (score <= 96) {
				hints.push(_('createMasterKey.hints.phases'))
			}
			if (!info.hasSymbols) {
				hints.push(_('createMasterKey.hints.symbols'))
			}
			if (hints.length) {
				hintsSpan.textContent = _('createMasterKey.hints.prefix') +
					hints.slice(0, 2).join(_('createMasterKey.hints.infix'))
			}
			scoreSpan.textContent = _('createMasterKey.score.label') + score.toFixed(1)
		}
		this.updateHeight()
	},
	oninit: function () {
		var that = this

		this.$('pash').onclick = function () {
			Storage.data.welcomed = true
			Screens.show('generate')
		}
		this.$('show-helper').onclick = function () {
			that.$('helper').style.display = 'block'
			this.style.display = 'none'
			that.$('password').focus()
			that.updateHeight()
		}
		var interval = null
		this.$('password').onkeyup = function () {
			clearTimeout(interval)
			interval = setTimeout(function () {
				that.processPassword()
			}, 500)
		}
		this.$('show-password').onchange = function () {
			that.$('password').type = this.checked ? 'text' : 'password'
		}
		this.$('result-area').style.transition = 'background-color .5s ease'
	},
	onbeforeshow: function (wantHelp) {
		this.$('show-password').checked = false
		this.$('password').type = 'password'
		this.$('show-helper').style.display = wantHelp ? 'none' : ''
		this.$('helper').style.display = wantHelp ? 'block' : 'none'
		this.$('password').value = ''
		this.processPassword()
	},
	onaftershow: function (wantHelp) {
		if (wantHelp) {
			this.$('password').focus()
		}
	},
	onafterhide: function () {
		this.$('password').value = ''
	}
})