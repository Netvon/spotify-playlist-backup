import { Service } from 'ts-express-decorators'
import { Backup, Playlist, IUser, IBackup, BackupUpdatedEventArgs, IPlaylist } from '../models'
import { BadRequest, NotFound } from 'ts-httpexceptions'
import { Types } from 'mongoose'
import {
	PlaylistRepository,
	IBackupRepository,
	IBackupRepositoryWithUser
} from './'
import { BackupRepositoryWithUser } from './backup/backup-with-user.repository'
import { EventEmitter } from 'events'

@Service()
export class BackupRepository implements IBackupRepository {
	private readonly eventEmitter = new EventEmitter()

	constructor(private playlistRepository: PlaylistRepository) {
		// this.on('created', console.dir)
		const me = this as IBackupRepository
		me.on('updated', console.dir)
		// this.on('removed', console.dir)
	}

	withUser(user: string | IUser): IBackupRepositoryWithUser {
		return new BackupRepositoryWithUser(user, this.playlistRepository, this.eventEmitter)
	}

	findAll() {
		return Backup.find({}).populate('origin target forUser').exec()
	}

	findByPlaylist(playlist: string | IPlaylist) {
		let params = []
		if ( typeof playlist === 'string' ) {
			params = [{ origin: playlist }, { target: playlist }]
		} else {
			params = [{ origin: playlist.id }, { target: playlist.id }]
		}

		return Backup.find().or(params).exec()
	}

	async find(id: string) {
		const backup = await Backup.findById(id).populate('origin target forUser').exec()

		if ( backup ) {
			return backup
		} else {
			throw new NotFound(`Backup with id "${id}" not found`)
		}
	}

	async hasId(id: string) {
		return (await Backup.count({ id })) === 1
	}

	async remove(id: string) {
		return await Backup.remove({ _id: id}).exec().then((x) => {
			this.eventEmitter.emit('removed', id)
			return x
		})
	}

	on(event: 'created' | 'updated' | 'removed', callback: (data: string | IBackup | BackupUpdatedEventArgs) => void) {
		this.eventEmitter.on(event, callback)
	}
}
