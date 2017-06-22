import { mongoose } from '../config/database'
import { Document, Schema, Model } from 'mongoose'

import { IBackup, IUser } from './'

export interface IPlaylist extends Document {
	name: string
	playlistId: string
	userId: string
	forUser: IUser | Schema.Types.ObjectId

	backups: IBackup[] | Schema.Types.ObjectId[]
}

const schema = new Schema({
	name: {
		type: String,
		required: true,
		minlength: 1,
	},

	playlistId: {
		type: String,
		required: true,
		unique: true,
		minlength: 1
	},

	userId: {
		type: String,
		required: true,
		minlength: 1
	},

	forUser: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},

	backups: [{
		type: Schema.Types.ObjectId,
		ref: 'Backup'
	}]
}, { timestamps: true })

export type PlaylistType = Model<IPlaylist>

export const Playlist = mongoose.model<IPlaylist>('Playlist', schema) as PlaylistType
