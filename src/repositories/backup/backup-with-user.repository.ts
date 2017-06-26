import { IBackupRepositoryWithUser, IPlaylistRepositoryWithUser, PlaylistRepository, IBackupRepositoryWithId } from '../.'
import { IUser, Backup } from '../../models'
import { BadRequest, NotFound } from 'ts-httpexceptions'
import { BackupRepositoryWithId } from './backup-with-id.repository'
import { EventEmitter } from 'events'

export class BackupRepositoryWithUser implements IBackupRepositoryWithUser {
	private forUser: string
	private playlistRepo: IPlaylistRepositoryWithUser

	constructor(user: string | IUser, private playlistRepository: PlaylistRepository, private eventEmitter: EventEmitter) {
		if ( typeof user === 'string' ) {
			this.forUser = user
		} else {
			this.forUser = user.id
		}

		this.playlistRepo = playlistRepository.withUser(this.forUser)
	}

	async create(name: string, cron: string, target: string, origin: string) {

		const originValid = await this.playlistRepo.hasId(origin)
		const targetValid = await this.playlistRepo.hasId(target)

		const errors = []

		if ( !originValid ) {
			errors.push('Found no Playlist matching "origin"')
		}

		if ( !targetValid ) {
			errors.push('Found no Playlist matching "target"')
		}

		if ( errors.length > 0 ) {
			throw new BadRequest(errors.join('. '))
		}

		return Backup.create({ origin, target, name, cron, forUser: this.forUser })
		.then((x) => {
			this.eventEmitter.emit('created', x)
			return x
		})
	}

	findAll() {
		return Backup.find({ forUser: this.forUser }, 'name cron origin target').exec()
	}

	async find(id: string) {
		const backup = await Backup.findById(id).where('forUser', this.forUser).populate('origin target').exec()

		if ( backup ) {
			return backup
		} else {
			throw new NotFound(`Backup with id "${id}" not found`)
		}
	}

	async hasId(id: string) {
		return (await Backup.count({ id, forUser: this.forUser })) === 1
	}

	withBackup(backupId: string): IBackupRepositoryWithId {
		return new BackupRepositoryWithId(this.forUser, backupId, this.playlistRepo, this.eventEmitter)
	}
}
