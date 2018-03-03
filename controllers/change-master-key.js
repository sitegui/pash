/* globals Screens, Storage*/
'use strict'

Screens.addController('change-master-key', {
	// Store received data
	data: null,

	oninit () {
		let that = this
		this.$('try-again').onclick = function () {
			Screens.show('generate', {
				serviceName: that.data.serviceName,
				color: that.data.color
			}, true)
		}
		this.$('its-ok').onclick = function () {
			let data = that.data,
				service = Storage.useService(data.userName, data.key, data.serviceName, data.color, true)
			Screens.show('result', {
				pash: data.pash,
				userName: data.userName,
				service,
				cssColor: data.cssColor
			})
		}
		this.$('info-button').onclick = function () {
			that.$('info').style.display = 'inherit'
			this.style.display = 'none'
			that.updateHeight()
		}
	},
	// data is an object: {pash: Pash, userName: string, serviceName: string, color: string, cssColor: string, key: string}
	onbeforeshow (data) {
		this.data = data
		this.$('info').style.display = 'none'
		this.$('info-button').style.display = ''
		this.$('current').textContent = Storage.getUserData(data.userName).key
		this.$('new').textContent = data.key
	},
	onafterhide () {
		this.data = null
		this.$('current').textContent = ''
		this.$('new').textContent = ''
	}
})