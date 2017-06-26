import { IBackupRepositoryWithId, IPlaylistRepositoryWithUser } from '../.'
import { IBackup, Backup, IUser, BackupUpdatedEventArgs } from '../../models'
import { EventEmitter } from 'events'

export class BackupRepositoryWithId implements IBackupRepositoryWithId {
	private forUser: string
	private forBackup: string | IBackup

	constructor(
		user: string | IUser,
		backup: string | IBackup,
		private playlistRepo: IPlaylistRepositoryWithUser,
		private eventEmitter: EventEmitter
	) {
		if ( typeof user === 'string' ) {
			this.forUser = user
		} else {
			this.forUser = user.id
		}

		this.forBackup = backup
	}

	async update(name?: string, cron?: string, target?: string, origin?: string) {
		let backup: IBackup

		if ( typeof this.forBackup === 'string') {
			backup = await Backup.findById(this.forBackup).where('forUser', this.forUser)
		} else {
			backup = this.forBackup
		}

		const updatedEventArgs = new BackupUpdatedEventArgs(backup.id, backup.name)

		if ( name && backup.name !== name ) {
			updatedEventArgs.addUpdated('name', name, backup.name)
			backup.name = name
		}
		if ( cron && backup.cron !== cron ) {
			updatedEventArgs.addUpdated('cron', cron, backup.cron)
			backup.cron = cron
		}

		if ( target ) {
			updatedEventArgs.addUpdated('target', target, backup.target)
			backup.target = await this.playlistRepo.find(target)
		}

		if ( origin ) {
			updatedEventArgs.addUpdated('origin', origin, backup.origin)
			backup.target = await this.playlistRepo.find(origin)
		}

		return await backup.save().then((x) => {
			this.eventEmitter.emit('updated', updatedEventArgs)
			return x
		})
	}

	async remove() {
		if ( typeof this.forBackup === 'string') {
			return await Backup.remove({ _id: this.forBackup, forUser: this.forUser }).exec().then((x) => {
				this.eventEmitter.emit('removed', this.forBackup)
				return x
			})
		} else {
			await this.forBackup.remove().then((x) => {
				this.eventEmitter.emit('removed', x.id)
				return x
			})
		}
	}
}
