import { Service } from 'ts-express-decorators'
import { SpotifyApiService } from './spotify-api.service'

import { IBackup, Backup, IUser, User, IPlaylist } from '../models'
import { IPlaylistTracksResponse } from '../models/spotify'

import { Schema } from 'mongoose'
import * as moment from 'moment'

@Service()
export class SpotifyJobService {
	constructor(private spotifyApiService: SpotifyApiService) { }

	createJob(forBackup: IBackup, forUser?: string) {
		return async () => {
			const user = await this.checkAndUpdateToken(forBackup, (forBackup.forUser as IUser).id || forBackup.forUser.toString() || forUser)
			await this.handleBackup(forBackup, user)
		}
	}

	private async checkAndUpdateToken(forBackup: IBackup, userId: string) {
		const user = await User.findById(userId)
		const now = moment()

		// get the difference in token expire time and now
		const diff = Math.abs(moment(user.expireDate).diff(new Date(), 'minutes'))

		// if the difference is less than or equals 2 renew the token
		if ( diff <= 2 /* minutes */ ) {
			this.log(forBackup, 'Token is expired, getting new token')

			const params = await this.spotifyApiService.getRenewedToken(user.refreshToken)
			const expires = moment()
			expires.add(params.expires_in, 'seconds')

			user.token = params.access_token
			user.expireDate = expires.toDate()

			await user.save()

			this.checkAndUpdateToken(forBackup, user.id)
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
		console.log(`[${moment().toLocaleString()} ~ ${forBackup.id}] ${message}`)
	}
}
