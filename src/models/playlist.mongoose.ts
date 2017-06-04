import { mongoose } from '../config/database'
import { Document, Schema, Model } from 'mongoose'

import { IBackup } from './'

export interface IPlaylist extends Document {
	name: string
	playlistId: string
	userId: string

	backups: IBackup[] | Schema.Types.ObjectId[]
}

const schema = new Schema({
	name: { type: String, required: true },
	playlistId: { type: String, required: true, unique: true },
	userId: { type: String, required: true },

	backups: [{
		type: Schema.Types.ObjectId,
		ref: 'Backup'
	}]
})

export type PlaylistType = Model<IPlaylist>

export const Playlist = mongoose.model<IPlaylist>('Playlist', schema) as PlaylistType
