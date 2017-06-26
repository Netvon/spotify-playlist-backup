import { mongoose } from '../config/database'
import { Document, Schema, Model, ValidationError } from 'mongoose'

import { SchedulerService, SpotifyJobService } from '../services'

import { IUser, IPlaylist, UpdatedEventArgs } from './'

export interface IBackup extends mongoose.Document {
	forUser: IUser | Schema.Types.ObjectId
	origin: IPlaylist | Schema.Types.ObjectId
	target: IPlaylist | Schema.Types.ObjectId

	name: string
	cron: string

	lastUpdated?: Date
	lastChecked?: Date
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

schema.path('origin').validate(function(value) {
	return value !== this.target
}, 'validation of `{PATH}` failed. Cannot reference the same Playlist as `target`')

schema.path('target').validate(function(value) {
	return value !== this.origin
}, 'validation of `{PATH}` failed. Cannot reference the same Playlist as `origin`' )

schema.path('cron').validate(function(value) {
	const cronParser = require('cron-parser')
	cronParser.parseExpression(value)
}, 'validation of `{PATH}` failed. Given cron is not valid')

export class BackupUpdatedEventArgs extends UpdatedEventArgs<'name' | 'cron' | 'target' | 'origin'> {
	constructor(id: string, public name: string ) {
		super(id)
	}
}

export const Backup = mongoose.model<IBackup>('Backup', schema)
