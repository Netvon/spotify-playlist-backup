import { Service } from 'ts-express-decorators'
import * as moment from 'moment'
import { SchedulerService, SpotifyJobService, Cron } from './'
import { BackupRepository, PlaylistRepository } from '../repositories'
import { IBackup, BackupUpdatedEventArgs, PlaylistUpdatedEventArgs, IPlaylist } from '../models'

@Service()
export class ScheduledBackupsService {
	constructor(
		private backupRepo: BackupRepository,
		private playlistRepo: PlaylistRepository,
		private scheduler: SchedulerService,
		private spotify: SpotifyJobService
	) {
		backupRepo.on('updated', this.onBackupUpdated.bind(this))
		backupRepo.on('created', this.onBackupCreated.bind(this))
		backupRepo.on('removed', this.onBackupRemoved.bind(this))

		playlistRepo.on('updated', this.onPlaylistUpdated.bind(this))
		playlistRepo.on('removed', this.onPlaylistRemoved.bind(this))
	}

	async scheduleBackups() {
		const backups = await this.backupRepo.findAll()

		for (const backup of backups) {
			await this.scheduleBackup(backup)
		}
	}

	async getScheduledBackup(jobId: string, forUser?: string) {
		const job = this.scheduler.jobs[jobId]
		let backup: IBackup

		if ( forUser ) {
			backup = await this.backupRepo.withUser(forUser).find(jobId)
		} else {
			backup = await this.backupRepo.find(jobId)
		}

		await backup.populate('forUser', 'userId')
			.populate('origin', 'name')
			.populate('target', 'name')
			.execPopulate()

		return {
			nextInvocation: job.nextInvocation(),
			...backup.toJSON()
		}
	}

	async getScheduledBackups(forUser?: string) {
		const jobIds = Object.getOwnPropertyNames(this.scheduler.jobs)
		const results = []

		for (const jobId of jobIds) {
			results.push(await this.getScheduledBackup(jobId))
		}

		return results
	}

	async scheduleBackup(backup: IBackup | string) {
		let backupInstance: IBackup

		if ( typeof backup === 'string' ) {
			backupInstance = await this.backupRepo.find(backup)
		} else {
			backupInstance = backup
		}

		this.scheduler.start(
			backupInstance.id,
			backupInstance.cron,
			this.spotify.createJob(backupInstance)
		)
	}

	cancelBackup(backup: IBackup | string) {
		let backupId: string

		if ( typeof backup === 'string' ) {
			backupId = backup
		} else {
			backupId = backup.id
		}

		return this.scheduler.stop(backupId)
	}

	rescheduleBackup(backup: IBackup | string, cron: Cron) {
		let backupId: string

		if ( typeof backup === 'string' ) {
			backupId = backup
		} else {
			backupId = backup.id
		}

		return this.scheduler.update(backupId, cron)
	}

	async invokeBackup(backupId: string, forUser?: string) {
		let backup: IBackup

		if ( forUser ) {
			backup = await this.backupRepo.withUser(forUser).find(backupId)
		} else {
			backup = await this.backupRepo.find(backupId)
		}

		this.scheduler.jobs[backup.id].invoke()
	}

	private async onBackupUpdated(data: string | IBackup | BackupUpdatedEventArgs) {

		if ( data instanceof BackupUpdatedEventArgs) {
			if ( data.updated.cron && !data.updated.name && !data.updated.origin && !data.updated.target) {
				this.rescheduleBackup(data.id, data.updated.cron.new)
			} else {
				this.cancelBackup(data.id)
				await this.scheduleBackup(data.id)
			}
		} else {
			this.cancelBackup(data)
			await this.scheduleBackup(data)
		}
	}

	private async onBackupCreated(data: IBackup) {
		await this.scheduleBackup(data)
	}

	private async onBackupRemoved(data: IBackup | string) {
		await this.cancelBackup(data)
	}

	private async onPlaylistUpdated(data: PlaylistUpdatedEventArgs) {
		if ( data.updated.playlistId || data.updated.userId ) {
			const backups = await this.backupRepo.findByPlaylist(data.id)

			for ( const backup of backups ) {
				this.cancelBackup(backup)
				await this.scheduleBackup(backup)
			}
		}
	}

	private async onPlaylistRemoved(data: IPlaylist | string) {
		let id: string

		if ( typeof data === 'string' ) {
			id = data
		} else {
			id = data.id
		}

		const backups = await this.backupRepo.findByPlaylist(id)

		for ( const backup of backups ) {
			this.backupRepo.remove(backup.id)
		}
	}
}
