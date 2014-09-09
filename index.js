'use strict'

console.log('Starting at ' + new Date)

var http = require('http'),
	express = require('express'),
	app = express()

app.use(express.static('./public'))

http.createServer(app).listen(8087, function () {
	console.log('Listening on port 8087')
})