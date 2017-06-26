import { IPlaylistRepositoryWithId } from '../.'
import { IPlaylist, IUser, Playlist, PlaylistUpdatedEventArgs } from '../../models'
import { BadRequest, NotFound } from 'ts-httpexceptions'
import { EventEmitter } from 'events'

export class PlaylistRepositoryWithId implements IPlaylistRepositoryWithId {
	private forPlaylist: string | IPlaylist
	private forUser: string

	constructor(user: string | IUser, playlist: string | IPlaylist, private eventEmitter: EventEmitter) {
		if ( typeof user === 'string' ) {
			this.forUser = user
		} else {
			this.forUser = user.id
		}

		this.forPlaylist = playlist
	}

	async update(name?: string, playlistId?: string, userId?: string) {
		if ( !name && !playlistId && !userId ) {
			throw new BadRequest('No values found to update')
		}

		let playlist: IPlaylist

		if ( typeof this.forPlaylist === 'string') {
			playlist = await Playlist.findById(this.forPlaylist).where('forUser', this.forUser)
		} else {
			playlist = this.forPlaylist
		}

		const updatedEventArgs = new PlaylistUpdatedEventArgs(playlist.id)

		if ( !playlist ) {
			throw new NotFound('Playlist with given id not found')
		}

		if ( name ) {
			updatedEventArgs.addUpdated('name', name, playlist.name)
			playlist.name = name
		}

		if ( playlistId ) {
			updatedEventArgs.addUpdated('playlistId', name, playlist.playlistId)
			playlist.playlistId = playlistId
		}

		if ( userId ) {
			updatedEventArgs.addUpdated('userId', name, playlist.userId)
			playlist.userId = userId
		}

		return await playlist.save().then((x) => {
			this.eventEmitter.emit('updated', updatedEventArgs)
			return x
		})
	}

	async remove() {
		if ( typeof this.forPlaylist === 'string') {
			return await Playlist.remove({ _id: this.forPlaylist, forUser: this.forUser }).exec().then((x) => {
				this.eventEmitter.emit('removed', this.forPlaylist)
				return x
			})
		} else {
			await this.forPlaylist.remove().then((x) => {
				this.eventEmitter.emit('removed', x)
				return x
			})
		}
	}

}
