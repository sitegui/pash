'use strict'

var express = require('express'),
	api = express.Router(),
	mongoose = require('mongoose'),
	Account = mongoose.model('Account')

module.exports = api

/**
 * @param {*} user
 * @returns {?Buffer} null if invalid
 */
function toUser(user) {
	user = String(user)
	return /^[0-9a-f]{64}$/i.test(user) ? new Buffer(user, 'hex') : null
}

/**
 * @param {*} data
 * @returns {?Buffer} null if invalid
 */
function toData(data) {
	data = String(data)
	return /^[0-9a-f]{128,}$/i.test(data) ? new Buffer(data, 'hex') : null
}

api.use(require('body-parser').json())

api.use(function (req, res, next) {
	/**
	 * @param {number} code
	 * @param {string} message
	 */
	res.error = function (code, message) {
		res.json({
			error: {
				code: code,
				message: message
			}
		})
	}
	/**
	 * @param {Object} [data]
	 */
	res.succes = function (data) {
		data = data || {}
		data.error = null
		res.json(data)
	}
	next()
})

/*
 * get(user) -> data
 */
api.post('/get', function (req, res) {
	var user = toUser(req.body.user)
	if (!user) {
		return res.error(101, 'Invalid user')
	}
	Account.findById(user, function (err, account) {
		if (err) {
			return res.error(100, String(err))
		} else if (!account) {
			return res.error(200, 'User not found')
		}
		res.success({
			data: account.data.toString('hex')
		})
	})
})

/*
 * set(user, data)
 */
api.post('/set', function (req, res) {
	var user = toUser(req.body.user),
		data = toData(req.body.data)
	if (!user) {
		return res.error(101, 'Invalid user')
	} else if (!data) {
		return res.error(101, 'Invalid data')
	}
	Account.update({
		_id: user
	}, {
		data: data
	}, {
		upsert: true
	}, function (err) {
		err ? res.error(100, err) : res.success()
	})
})

/*
 * unset(user)
 */
api.post('/unset', function (req, res) {
	var user = toUser(req.body.user)
	if (!user) {
		return res.error(101, 'Invalid user')
	}
	Account.remove({
		_id: user
	}, function (err) {
		err ? res.error(100, err) : res.success()
	})
})