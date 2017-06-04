let mongoose = require('mongoose')

module.exports = function() {
	mongoose.Promise = Promise
	return mongoose.connect('mongodb://localhost:27017')
}
