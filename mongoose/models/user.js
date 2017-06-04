let mongoose = require('mongoose')

let schema = new mongoose.Schema({
	userId: { type: String, required: true, unique: true },
	token: { type: String, required: true },
	refreshToken: { type: String, required: true },
	expireDate: { type: Date, required: true },

	backups: [{type: mongoose.Schema.Types.ObjectId, ref: 'Backup'}]
})

module.exports = mongoose.model('User', schema)