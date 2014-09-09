/*globals Screens, Storage*/
'use strict'

Screens.addController('change-master-key', {
	// Store received data
	data: null,

	oninit: function () {
		var that = this
		this.$('try-again').onclick = function () {
			Screens.show('generate', {
				serviceName: that.data.serviceName,
				color: that.data.color
			}, true)
		}
		this.$('its-ok').onclick = function () {
			var data = that.data,
				service = Storage.useService(data.userName, data.key, data.serviceName, data.color, true)
			Screens.show('result', {
				pash: data.pash,
				userName: data.userName,
				service: service,
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
	onbeforeshow: function (data) {
		this.data = data
		this.$('info').style.display = 'none'
		this.$('info-button').style.display = ''
		this.$('current').textContent = Storage.getUserData(data.userName).key
		this.$('new').textContent = data.key
	},
	onafterhide: function () {
		this.data = null
		this.$('current').textContent = ''
		this.$('new').textContent = ''
	}
})