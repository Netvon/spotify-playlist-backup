import { IUser, IBackup, BackupUpdatedEventArgs } from '../../models'

export interface IBackupRepository {
	withUser(user: string | IUser): IBackupRepositoryWithUser

	find(id: string): Promise<IBackup>
	findAll(): Promise<IBackup[]>
	hasId(id: string): Promise<boolean>
	remove(id: string): Promise<void>

	on(event: 'removed', callback: (data: string | IBackup) => void): void
	on(event: 'updated', callback: (args: BackupUpdatedEventArgs) => void): void
	on(event: 'created', callback: (data: IBackup) => void): void
}

export interface IBackupRepositoryWithUser {
	create(name: string, cron: string, target: string, origin: string): Promise<IBackup>
	findAll(): Promise<IBackup[]>
	find(id: string): Promise<IBackup>
	hasId(id: string): Promise<boolean>

	withBackup(backupId: string): IBackupRepositoryWithId
}

export interface IBackupRepositoryWithId {
	update(name?: string, cron?: string, target?: string, origin?: string): Promise<IBackup>
	remove(): Promise<void>
}
