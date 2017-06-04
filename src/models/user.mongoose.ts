import { mongoose } from '../config/database'
import { Document, Schema, Model } from 'mongoose'

import { IBackup } from './'

export interface IUser extends Document {
	userId: string
	token: string
	refreshToken: string,
	expireDate?: Date
	backups: IBackup[] | Schema.Types.ObjectId[]
}

const schema = new Schema({
	userId: { type: String, required: true, unique: true },
	token: { type: String, required: true },
	refreshToken: { type: String, required: true },
	expireDate: { type: Date, required: true },

	backups: [{
		type: Schema.Types.ObjectId,
		ref: 'Backup'
	}]
})

export type UserType = Model<IUser>

export const User = mongoose.model<IUser>('User', schema) as UserType
