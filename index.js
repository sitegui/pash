'use strict'

console.log('Starting at ' + new Date)

var http = require('http'),
	express = require('express'),
	mongoose = require('mongoose'),
	app = express()

// Set up mongoose
mongoose.connect('mongodb://localhost:27017/pash')
mongoose.model('Account', new mongoose.Schema({
	// Login key (256 bits)
	_id: Buffer,
	// Custom user data
	data: Buffer
}))

// Set up express
app.use(express.static('./public'))
app.use(require('./api'))

// Start the server
http.createServer(app).listen(8087, function () {
	console.log('Listening on port 8087')
})