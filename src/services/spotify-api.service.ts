import * as rp from 'request-promise-native'
import { Service } from 'ts-express-decorators'
import * as Express from 'express'
import * as querystring from 'querystring'
import { generateRandomString, getSecret } from '../utils'
import { User, IUser } from '../models'

import * as spotify from '../models/spotify'

@Service()
export class SpotifyApiService {

	private baseApiUrl = 'https://api.spotify.com/v1'
	private baseAuthUrl = 'https://accounts.spotify.com'
	private client_id = getSecret('CLIENT_ID')
	private client_secret = getSecret('CLIENT_SECRET')
	private stateKey = getSecret('STATE_KEY')
	private redirect_uri = process.env.HOST_URL + '/callback'

	private get defaulApiOptions() {
		return {
			baseUrl: this.baseApiUrl
		}
	}

	private get defaulRequestOptions() {
		return {
			...this.defaulApiOptions,
			json: true
		}
	}

	private get defaulTokenOptions() {
		return {
			baseUrl: this.baseAuthUrl,
			json: true,
			headers: {
				Authorization: 'Basic ' + (new Buffer(this.client_id + ':' + this.client_secret).toString('base64'))
			}
		}
	}

	private defaulOptions(token: string) {
		return {
			...this.defaulRequestOptions,
			headers: this.bearerAuthHeader(token)
		}
	}

	private bearerAuthHeader(currentToken: string) {
		return { Authorization: `Bearer ${currentToken}` }
	}

	public getMe(token: string): Promise<spotify.IUser> {
		return rp('/me', { ...this.defaulOptions(token) } ).promise()
	}

	public getPlaylist(token: string, userId: string, playlistId: string) {
		return rp(`/users/${userId}/playlists/${playlistId}`, {
			...this.defaulApiOptions,
			...this.defaulOptions(token)
		})
	}

	public getRenewedToken(refresh_token: string): Promise<spotify.ITokenResponse> {
		const options = {
			...this.defaulTokenOptions,
			method: 'POST',
			form: {
				grant_type: 'refresh_token',
				refresh_token
			}
		}

		return rp('/api/token', options).promise()
	}

	public getToken(code: string): Promise<spotify.ITokenResponse> {
		const options = {
			...this.defaulTokenOptions,
			method: 'POST',
			form: {
				code,
				grant_type: 'authorization_code',
				redirect_uri: this.redirect_uri
			}
		}

		return rp('/api/token', options).promise()
	}

	public getPlaylistTracks(
		token: string,
		userId: string,
		playlistId: string,
		limit: number = null,
		offset: number = null,
		fields: string = 'href,items(added_at,track(uri)),total'
	): Promise<spotify.IPlaylistTracksResponse | any> {
		const options = {
			...this.defaulOptions(token),
			qs: { fields: undefined, limit: undefined, offset: undefined }
		}

		if (fields !== null) {
			options.qs.fields = fields
		}

		if (limit !== null && limit > 0) {
			options.qs.limit = limit
		}

		if (offset !== null && offset > 0) {
			options.qs.offset = offset
		}

		return rp(`/users/${userId}/playlists/${playlistId}/tracks`, options).promise()
	}

	public postPlaylistTracks(token: string, userId: string, playlistId: string, trackUris: string[], position = 0) {
		const options = {
			...this.defaulOptions(token),
			method: 'POST',
			qs: { uris: null }
		}

		if (trackUris.length > 0) {
			options.qs.uris = trackUris.join(',')
		} else {
			throw new RangeError('No Track Uris where specified')
		}

		return rp(`/users/${userId}/playlists/${playlistId}/tracks`, options)
	}

	public redirectToAuth(res: Express.Response) {
		const state = generateRandomString(16)
		res.cookie(this.stateKey, state)

		const scope = 'playlist-read-private playlist-modify-private playlist-modify-public playlist-read-collaborative'
		res.redirect(`${this.baseAuthUrl}/authorize?` +
			querystring.stringify({
				response_type: 'code',
				client_id: this.client_id,
				scope,
				redirect_uri: this.redirect_uri,
				state
			}))
	}

	public async handleCallback(req: Express.Request, res: Express.Response) {
		const code = req.query.code || null
		const state = req.query.state || null
		const storedState = req.cookies ? req.cookies[this.stateKey] : null

		if ( state === null || state !== storedState ) {
			res.redirect('/')
		} else {
			res.clearCookie(this.stateKey)

			const token = await this.getToken(code)
			const me = await this.getMe(token.access_token)

			const expires = new Date()
			expires.setSeconds(expires.getSeconds() + token.expires_in)

			await User.findOneAndUpdate({ userId: me.id }, {
				userId: me.id,
				token: token.access_token,
				refreshToken: token.refresh_token,
				expireDate: expires
			}, {
				new: true,
				upsert: true
			})
		}
	}
}
