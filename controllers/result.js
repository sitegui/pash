/*globals Screens, Pash*/
'use strict'

Screens.addController('result', {
	oninit: function () {
		var _decoder, _length, that = this

		this.$('back').onclick = function () {
			Screens.show('generate', null, true)
		}
		this.$('more-button').onclick = function () {
			that.$('more-button').style.display = 'none'
			that.$('more-info').style.display = ''
			that.updateHeight()
		}
		this.$('result').onclick = function () {
			var range = document.createRange()
			range.selectNode(this)
			window.getSelection().removeAllRanges()
			window.getSelection().addRange(range)
		}

		this.updateResult = function () {
			var format = Number(that.decoder.dataset.id),
				length = Number(that.length.dataset.id)
			that.pash.generatePassword(format, length, function (pass) {
				that.$('result').textContent = pass
			})
		}

		// Create decoder and length properties
		_decoder = null
		_length = null
		Object.defineProperty(this, 'decoder', {
			get: function () {
				return _decoder
			},
			set: function (value) {
				if (_decoder) {
					_decoder.classList.remove('option-selected')
				}
				_decoder = value
				_decoder.classList.add('option-selected')
			}
		})
		Object.defineProperty(this, 'length', {
			get: function () {
				return _length
			},
			set: function (value) {
				if (_length) {
					_length.classList.remove('option-selected')
				}
				_length = value
				_length.classList.add('option-selected')
			}
		})

		this.$('decoder-standard').onclick =
			this.$('decoder-numeric').onclick =
			this.$('decoder-strong').onclick = function (event) {
				that.decoder = event.currentTarget
				that.serviceData.decoder = Number(that.decoder.dataset.id)
				that.updateResult()
		}
		this.$('length-short').onclick =
			this.$('length-medium').onclick =
			this.$('length-long').onclick = function (event) {
				that.length = event.currentTarget
				that.serviceData.length = Number(that.length.dataset.id)
				that.updateResult()
		}
	},
	// data is an object: {pash: Pash, userName: string, service: service, cssColor: string}
	// service is an object: {name: string, color: string, hitCount: int, decoder, length}
	onbeforeshow: function (data) {
		// Output format
		this.serviceData = data.service

		if (data.service.decoder === Pash.FORMAT.NUMERIC) {
			this.decoder = this.$('decoder-numeric')
		} else if (data.service.decoder === Pash.FORMAT.STRONG) {
			this.decoder = this.$('decoder-strong')
		} else {
			this.decoder = this.$('decoder-standard')
		}

		if (data.service.length === Pash.length.SHORT) {
			this.length = this.$('length-short')
		} else if (data.service.length === Pash.length.LONG) {
			this.length = this.$('length-long')
		} else {
			this.length = this.$('length-medium')
		}
		this.pash = data.pash

		// Populate the interface
		this.$('name').textContent = data.userName
		this.$('service').textContent = data.service.name
		this.$('result').style.backgroundColor = data.cssColor
		this.$('more-info').style.display = 'none'
		this.$('more-button').style.display = ''
		this.updateResult()

		// Display timeout (for security reasons)
		this.interval = setTimeout(function () {
			Screens.show('generate', null, true)
		}, 60e3)
	},
	onbeforehide: function () {
		clearTimeout(this.interval)
	},
	onafterhide: function () {
		this.serviceData = null
		this.pash = null
		this.$('result').textContent = ''
	}
})