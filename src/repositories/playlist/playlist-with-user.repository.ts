import { IPlaylistRepositoryWithUser } from '../.'
import { IUser, Playlist } from '../../models'
import { BadRequest } from 'ts-httpexceptions'
import { PlaylistRepositoryWithId } from './playlist-with-id.repository'
import { EventEmitter } from 'events'

export class PlaylistRepositoryWithUser implements IPlaylistRepositoryWithUser {
	private forUser: string

	constructor(user: string | IUser, private eventEmitter: EventEmitter) {
		if ( typeof user === 'string' ) {
			this.forUser = user
		} else {
			this.forUser = user.id
		}
	}

	findAll() {
		return Playlist.find().where('forUser', this.forUser).exec()
	}

	async find(id: string) {
		const playlist = await Playlist.findById(id).where('forUser', this.forUser).exec()

		if ( playlist ) {
			return playlist
		} else {
			throw new BadRequest(`Playlist with id "${id}" not found`)
		}
	}

	async hasId(id: string) {
		return (await Playlist.count({ id, forUser: this.forUser })) === 1
	}

	create(name: string, playlistId: string, userId: string) {
		return Playlist.create({ name, playlistId, userId, forUser: this.forUser }).then((x) => {
			this.eventEmitter.emit('created', x)
			return x
		})
	}

	withPlaylist(playlist: string) {
		return new PlaylistRepositoryWithId(this.forUser, playlist, this.eventEmitter)
	}
}
