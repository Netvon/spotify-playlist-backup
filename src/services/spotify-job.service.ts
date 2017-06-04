import { Service } from 'ts-express-decorators'
import { SpotifyApiService, IPlaylistTracksResponse } from './spotify-api.service'

import { IBackup, Backup, IUser, User, IPlaylist  } from '../models'

import { Schema } from 'mongoose'

import * as moment from 'moment'

@Service()
export class SpotifyJobService {
	constructor(private spotifyApiService: SpotifyApiService) { }

	createJob(forBackup: IBackup) {
		return async () => {
			const user = await this.checkToken(forBackup, forBackup.forUser.toString())
			await this.handleBackup(forBackup, user)
		}
	}

	private async checkToken(forBackup: IBackup, userId: string) {
		const user = await User.findById(userId)
		const now = new Date()

		if (now > user.expireDate) {
			this.log(forBackup, 'Token is expired, getting new token')

			const params = await this.spotifyApiService.getNewToken(user.refreshToken)
			const expires = new Date()
			expires.setSeconds(expires.getSeconds() + params.expires_in)

			user.token = params.access_token
			user.expireDate = expires

			await user.save()

			this.checkToken(forBackup, user._id.toString())
		} else {
			this.log(forBackup, 'Token is fresh')
		}

		return user
	}

	private async handleBackup(forBackup: IBackup, user: IUser) {
		const origin = forBackup.origin as IPlaylist
		const target = forBackup.target as IPlaylist

		const originResponse: IPlaylistTracksResponse = await this.spotifyApiService.getPlaylistTracks(
			user.token,
			origin.userId,
			origin.playlistId)

		const total: { total: number } = await this.spotifyApiService.getPlaylistTracks(
			user.token,
			target.userId,
			target.playlistId,
			null,
			null,
			'total')

		const targetResponse: IPlaylistTracksResponse = await this.spotifyApiService.getPlaylistTracks(
			user.token,
			target.userId,
			target.playlistId,
			30,
			total.total - 30)

		const originTracks = originResponse.items.map((x) => new Date(x.added_at)).sort().reverse()
		const targetTracks = targetResponse.items.map((x) => new Date(x.added_at)).sort().reverse()

		const lastAddedToOrigin = originTracks[0]
		const lastAddedToBackup = targetTracks[0]

		forBackup.lastChecked = new Date()

		if (lastAddedToOrigin > lastAddedToBackup) {
			this.log(forBackup, 'Backup is out of date!')

			const uris = originResponse.items.map((x) => x.track.uri)

			if (uris.length <= 0) {
				return
			}

			await this.spotifyApiService.postPlaylistTracks(user.token, target.userId, target.playlistId, uris)
			forBackup.lastUpdated = new Date()

			this.log(forBackup, 'Backup complete!')

		} else {
			this.log(forBackup, 'Backup is up-to-date!')
		}

		await forBackup.save()
	}

	private log(forBackup: IBackup, message: string) {
		console.log(`[${moment().toLocaleString()} ~ ${forBackup.name}] ${message}`)
	}
}
