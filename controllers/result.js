/* globals Screens, Pash, Storage*/
'use strict'

Screens.addController('result', {
	// Auto-exit interval
	timeout: null,

	// Store received data
	data: null,

	// Store the current selected format and length element
	format: null,
	length: null,

	// Set the selected format as the given element
	setFormat(value) {
		if (this.format) {
			this.format.classList.remove('option-selected')
		}
		this.format = value
		this.format.classList.add('option-selected')
	},

	// Set the selected length as the given element
	setLength(value) {
		if (this.length) {
			this.length.classList.remove('option-selected')
		}
		this.length = value
		this.length.classList.add('option-selected')
	},

	updateResult() {
		let format = Number(this.format.dataset.id),
			length = Number(this.length.dataset.id),
			that = this
		this.data.pash.generatePassword(format, length, pass => {
			that.$('result').textContent = pass
		})
	},

	oninit() {
		let that = this

		this.$('back').onclick = function () {
			Screens.show('generate', null, true)
		}
		this.$('more-button').onclick = function () {
			that.$('more-button').style.display = 'none'
			that.$('more-info').style.display = ''
			that.updateHeight()
		}
		this.$('result').onclick = function () {
			let range = document.createRange()
			range.selectNode(this)
			window.getSelection().removeAllRanges()
			window.getSelection().addRange(range)
		}

		this.$('format-standard').onclick =
			this.$('format-numeric').onclick =
			this.$('format-strong').onclick = function (event) {
				that.setFormat(event.currentTarget)
				that.data.service.format = Number(that.format.dataset.id)
				Storage.save()
				that.updateResult()
			}
		this.$('length-short').onclick =
			this.$('length-medium').onclick =
			this.$('length-long').onclick = function (event) {
				that.setLength(event.currentTarget)
				that.data.service.length = Number(that.length.dataset.id)
				Storage.save()
				that.updateResult()
			}

		this.$('result-notes').onchange = function (event) {
			let notes = event.currentTarget.value
			if (notes) {
				that.data.service.notes = notes
			} else {
				delete that.data.service.notes
			}
			Storage.save()
		}
	},
	// data is an object: {pash: Pash, userName: string, service: service, cssColor: string}
	onbeforeshow(data) {
		this.data = data

		if (data.service.format === Pash.FORMAT.NUMERIC) {
			this.setFormat(this.$('format-numeric'))
		} else if (data.service.format === Pash.FORMAT.STRONG) {
			this.setFormat(this.$('format-strong'))
		} else {
			this.setFormat(this.$('format-standard'))
		}

		if (data.service.length === Pash.LENGTH.SHORT) {
			this.setLength(this.$('length-short'))
		} else if (data.service.length === Pash.LENGTH.LONG) {
			this.setLength(this.$('length-long'))
		} else {
			this.setLength(this.$('length-medium'))
		}

		// Populate the interface
		this.$('name').textContent = data.userName
		this.$('service').textContent = data.service.name
		this.$('result').style.backgroundColor = data.cssColor
		this.$('more-info').style.display = 'none'
		this.$('more-button').style.display = ''
		this.$('result-notes').value = data.service.notes || ''
		this.updateResult()

		// Display timeout (for security reasons)
		this.timeout = setTimeout(() => {
			Screens.show('generate', null, true)
		}, 60e3)
	},
	onbeforehide() {
		clearTimeout(this.timeout)
	},
	onafterhide() {
		this.data = null
		this.$('result').textContent = ''
	}
})