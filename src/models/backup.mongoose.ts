import { mongoose } from '../config/database'
import { Document, Schema, Model, ValidationError } from 'mongoose'

import { SchedulerService, SpotifyJobService } from '../services'

import { IUser, IPlaylist } from './'

export interface IBackup extends mongoose.Document {
	forUser: IUser | Schema.Types.ObjectId
	origin: IPlaylist | Schema.Types.ObjectId
	target: IPlaylist | Schema.Types.ObjectId

	name: string
	cron: string

	lastUpdated?: Date
	lastChecked?: Date
}

export interface IBackupStatic {
	scheduleBackups(scheduler: SchedulerService, spotify: SpotifyJobService): Promise<SchedulerService>
	getJobs(scheduler: SchedulerService, forUserId: string): Promise<{[name: string]: {}}>
	getJob(scheduler: SchedulerService, id: string, forUserId: string): Promise<{ nextInvocation: Date, backup: IBackup } | null>
	invokeNow(scheduler: SchedulerService, id: string, forUserId: string): Promise<{name: string} | null>
}

const schema = new Schema({
	forUser: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},

	origin: {
		type: Schema.Types.ObjectId,
		ref: 'Playlist',
		required: true
	},

	target: {
		type: Schema.Types.ObjectId,
		ref: 'Playlist',
		required: true
	},

	name: {
		type: String,
		required: true,
		minlength: 1
	},

	cron: {
		type: String,
		required: true
	},

	lastUpdated: Date,
	lastChecked: Date
}, { timestamps: true })

schema.index({ name: 1, forUser: 1 }, { unique: true })

// tslint:disable-next-line:only-arrow-functions
schema.path('origin').validate(function(value) {
	return value !== this.target
}, 'validation of `{PATH}` failed. Cannot reference the same Playlist as `target`')

// tslint:disable-next-line:only-arrow-functions
schema.path('target').validate(function(value) {
	return value !== this.origin
}, 'validation of `{PATH}` failed. Cannot reference the same Playlist as `origin`' )

// tslint:disable-next-line:only-arrow-functions
schema.path('cron').validate(function(value) {
	const cronParser = require('cron-parser')
	cronParser.parseExpression(value)
}, 'validation of `{PATH}` failed. Given cron is not valid')

schema.static('stopBackup', async function(id: string, scheduler: SchedulerService, spotify: SpotifyJobService) {
	const backup = await this.findById(id).populate('origin target')

	if ( backup ) {
		scheduler.stop(backup.name)
		return scheduler
	} else {
		return null
	}
})

schema.static('updateBackup', async function(id: string, scheduler: SchedulerService, spotify: SpotifyJobService) {
	const backup = await this.findById(id).populate('origin target')

	if ( backup ) {
		scheduler.update(backup.name, backup.cron)
		return scheduler
	} else {
		return null
	}
})

schema.static('scheduleBackups', async function(scheduler: SchedulerService, spotify: SpotifyJobService) {
	const backups = await this.find().populate('origin target')

	for (const backup of backups) {
		scheduler.start(backup.name, backup.cron, spotify.createJob(backup))
	}

	return scheduler
})

schema.static('getJob', async function(scheduler: SchedulerService, id: string, forUserId: string) {
	const backup = await (this as BackupType).findById(id, 'name forUser origin target lastUpdated lastChecked cron')
								.where('forUser', forUserId)
								.populate('forUser', 'userId')
								.populate('origin', 'name')
								.populate('target', 'name')

	if ( backup ) {
		const job = scheduler.jobs[backup.name]

		if ( job ) {
			return {
				nextInvocation: job.nextInvocation(),
				backup
			}
		}
	}

	return null
})

schema.static('getJobs', async function(scheduler: SchedulerService, forUserId: string) {
	const output = {}

	for ( const name in scheduler.jobs ) {
		if ( scheduler.jobs.hasOwnProperty(name) ) {
			const job = scheduler.jobs[name]

			const backup = await this.findOne({ name }, 'forUser origin target lastUpdated lastChecked cron')
						.where('forUser', forUserId)
						.populate('forUser', 'userId')
						.populate('origin', 'name')
						.populate('target', 'name')

			output[name] = {
				nextInvocation: job.nextInvocation(),
				backup
			}
		}
	}

	return output
})

schema.static('invokeNow', async function(scheduler: SchedulerService, id: string, forUserId: string): Promise<{name: string} | null> {

	const backup = await this.findById(id).where('forUser', forUserId)

	if ( backup ) {
		scheduler.jobs[backup.name].invoke()
		return { name: backup.name }
	} else {
		return null
	}
})

export type BackupType = Model<IBackup> & IBackupStatic
export const Backup = mongoose.model<IBackup>('Backup', schema) as BackupType
