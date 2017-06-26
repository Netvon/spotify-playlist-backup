import { Service } from 'ts-express-decorators'
import { Backup, Playlist, IUser, IBackup, IPlaylist, PlaylistUpdatedEventArgs } from '../models'
import { BadRequest, NotFound } from 'ts-httpexceptions'
import { Types, Schema } from 'mongoose'
import { IPlaylistRepositoryWithUser, IPlaylistRepositoryWithId, IPlaylistRepository } from './'
import { PlaylistRepositoryWithUser } from './playlist/playlist-with-user.repository'
import { EventEmitter } from 'events'

@Service()
export class PlaylistRepository implements IPlaylistRepository {
	private readonly eventEmitter = new EventEmitter()

	// constructor() {
	// 	this.on('created', console.dir)
	// 	this.on('updated', console.dir)
	// 	this.on('removed', console.dir)
	// }

	withUser(user: string | IUser): IPlaylistRepositoryWithUser {
		return new PlaylistRepositoryWithUser(user, this.eventEmitter)
	}

	findAll() {
		return Playlist.find().populate('forUser').exec()
	}

	// async addBackupToPlaylist(playlist: IPlaylist | string, backup: IBackup | string) {
	// 	const push = (p: string, b: string) => Playlist.findByIdAndUpdate(p, { $push: { backups: b } })

	// 	if ( typeof playlist === 'string' ) {
	// 		if ( typeof backup === 'string' ) {
	// 			await push(playlist, backup)
	// 		} else {
	// 			await push(playlist, backup.id)
	// 		}
	// 	} else {
	// 		if ( typeof backup === 'string' ) {
	// 			await push(playlist.id, backup)
	// 		} else {
	// 			playlist = await playlist.populate('backups').execPopulate();
	// 			(playlist.backups as IBackup[]).push(backup)
	// 		}
	// 	}
	// }

	async find(id: string) {
		const playlist = await Playlist.findById(id).populate('forUser').exec()

		if ( playlist ) {
			return playlist
		} else {
			throw new BadRequest(`Playlist with id "${id}" not found`)
		}
	}

	async remove(id: string) {
		return await Playlist.remove({ _id: id }).exec().then((x) => {
			this.eventEmitter.emit('removed', id)
			return x
		})
	}

	async hasId(id: string) {
		return (await Playlist.count({ id })) === 1
	}

	on(event: 'created' | 'updated' | 'removed', callback: (data: string | IPlaylist | PlaylistUpdatedEventArgs) => void) {
		this.eventEmitter.on(event, callback)
	}
}
