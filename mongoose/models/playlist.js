let mongoose = require('mongoose')

let schema = new mongoose.Schema({
	name: {type: String, required: true },
	playlistId: { type: String, required: true, unique: true },
	userId: { type: String, required: true },

	backups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Backup' }]
})

module.exports = mongoose.model('Playlist', schema)