let mongoose = require('mongoose')

let schema = new mongoose.Schema({
	forUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

	origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' },
	target: { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' },

	name: { type: String, required: true, unique: true },
	cron: { type: String, required: true },

	lastUpdated: Date,
	lastChecked: Date
})

schema.statics.scheduleBackups = async function(scheduler, client_id, client_secret) {
	let spotify = require('../../helper/spotify')
	let spotifyJob = require('../../helper/spotifyJob')

	let backups = await model.find().populate('origin target forUser')

	for (let backup of backups) {
		scheduler.start(backup.name, backup.cron, spotifyJob(backup, client_id, client_secret))
	}

	return scheduler
}

schema.statics.getJobs = async function() {
	let scheduler = require('../../helper/scheduler')

	let output = {}

	for(let name in scheduler.jobs) {
		let job = scheduler.jobs[name]
		let backup = await model.findOne({ name: name }, 'forUser origin target lastUpdated lastChecked cron')
						.populate('forUser', 'userId')
						.populate('origin', 'name')
						.populate('target', 'name')

		output[name] = {
			name,
			nextInvocation: job.nextInvocation(),
			backup
		}
	}

	return output
}

schema.statics.invokeNow = async function(id) {
	let scheduler = require('../../helper/scheduler')

	let backup = await model.findById(id)

	scheduler.jobs[backup.name].invoke()	

	return { message: `Invoking '${backup.name}'` }
}

schema.post('save', function(doc) {
	console.log('%s has been saved', doc._id)
})

schema.post('update', function(doc) {
	console.log('%s has been updated', doc._id)
})

let model = module.exports = mongoose.model('Backup', schema)