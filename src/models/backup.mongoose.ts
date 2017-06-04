import { mongoose } from '../config/database'
import { Document, Schema, Model } from 'mongoose'

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
	getJobs(scheduler: SchedulerService): Promise<{[name: string]: {}}>
	getJob(scheduler: SchedulerService, id: string): Promise<{ nextInvocation: Date, backup: IBackup } | null>
	invokeNow(scheduler: SchedulerService, id: string): Promise<{name: string} | null>
}

const schema = new Schema({
	forUser: { type: Schema.Types.ObjectId, ref: 'User' },

	origin: { type: Schema.Types.ObjectId, ref: 'Playlist' },
	target: { type: Schema.Types.ObjectId, ref: 'Playlist' },

	name: { type: String, required: true, unique: true },
	cron: { type: String, required: true },

	lastUpdated: Date,
	lastChecked: Date
})

schema.static('scheduleBackups', async function(scheduler: SchedulerService, spotify: SpotifyJobService) {
	const backups = await this.find().populate('origin target')

	for (const backup of backups) {
		scheduler.start(backup.name, backup.cron, spotify.createJob(backup))
	}

	return scheduler
})

schema.static('getJob', async function(scheduler: SchedulerService, id: string) {
	const backup = await this.findById(id, 'name forUser origin target lastUpdated lastChecked cron')
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

schema.static('getJobs', async function(scheduler: SchedulerService) {
	const output = {}

	for ( const name in scheduler.jobs ) {
		if ( scheduler.jobs.hasOwnProperty(name) ) {
			const job = scheduler.jobs[name]

			const backup = await this.findOne({ name }, 'forUser origin target lastUpdated lastChecked cron')
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

schema.static('invokeNow', async function(scheduler: SchedulerService, id: string): Promise<{name: string} | null> {

	const backup = await this.findById(id)

	if ( backup ) {
		scheduler.jobs[backup.name].invoke()
		return { name: backup.name }
	} else {
		return null
	}
})

export type BackupType = Model<IBackup> & IBackupStatic
export const Backup = mongoose.model<IBackup>('Backup', schema) as BackupType
