import * as rp from 'request-promise-native'
import { Service } from 'ts-express-decorators'
import * as Express from 'express'
import * as querystring from 'querystring'
import { generateRandomString, getSecret } from '../utils'
import { User, IUser } from '../models'

import * as spotify from 'models/spotify'

export interface ITokenResponse {
	access_token: string
	token_type: string
	scope: string
	expires_in: number
	refresh_token: string
}

export interface IPlaylistTracksResponse {
	href: string
	items: Array<{
		added_at: string
		track: { uri: string }
	}>,
	total: number
}

export let baseApiUrl = 'https://api.spotify.com/v1'
export let baseAuthUrl = 'https://accounts.spotify.com'
export let client_id = getSecret('CLIENT_ID')
export let client_secret = getSecret('CLIENT_SECRET')
export let stateKey = 'spotify_auth_state'
export let redirect_uri = process.env.HOST_URL + '/callback'

@Service()
export class SpotifyApiService {

	private get defaulApiOptions() {
		return {
			baseUrl: baseApiUrl
		}
	}

	private get defaulAuthOptions() {
		return {
			baseUrl: baseAuthUrl
		}
	}

	private defaulOptions(token: string) {
		return {
			headers: this.bearerAuthHeader(token),
			json: true
		}
	}

	private bearerAuthHeader(currentToken: string) {
		return { Authorization: `Bearer ${currentToken}` }
	}

	public getMe(token: string): Promise<spotify.IUser> {
		return rp(`/me`, { ...this.defaulApiOptions, ...this.defaulOptions(token) } ).promise()
	}

	public getPlaylist(token: string, userId: string, playlistId: string) {
		return rp(`/users/${userId}/playlists/${playlistId}`, {
			...this.defaulApiOptions,
			...this.defaulOptions(token)
		})
	}

	public getNewToken(refresh_token: string): Promise<ITokenResponse> {
		const options = {
			...this.defaulAuthOptions,
			method: 'POST',
			headers: {
				Authorization: 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
			},
			form: {
				grant_type: 'refresh_token',
				refresh_token
			},
			json: true
		}

		return rp(`${baseAuthUrl}/api/token`, options).promise()
	}

	public getToken(code: string): Promise<ITokenResponse> {
		const options = {
			method: 'POST',
			headers: {
				Authorization: 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
			},
			form: {
				code,
				grant_type: 'authorization_code',
				redirect_uri
			},
			json: true
		}

		return rp(`${baseAuthUrl}/api/token`, options).promise()
	}

	public getPlaylistTracks(
		token: string,
		userId: string,
		playlistId: string,
		limit: number = null,
		offset: number = null,
		fields: string = 'href,items(added_at,track(uri)),total'
	): Promise<IPlaylistTracksResponse | any> {
		const options = { headers: this.bearerAuthHeader(token), json: true, qs: { fields: undefined, limit: undefined, offset: undefined } }

		if (fields !== null) {
			options.qs.fields = fields
		}

		if (limit !== null && limit > 0) {
			options.qs.limit = limit
		}

		if (offset !== null && offset > 0) {
			options.qs.offset = offset
		}

		return rp(`${baseApiUrl}/users/${userId}/playlists/${playlistId}/tracks`, options).promise()
	}

	public postPlaylistTracks(token: string, userId: string, playlistId: string, trackUris: string[], position = 0) {
		const options = { method: 'POST', headers: this.bearerAuthHeader(token), json: true, qs: { uris: null } }

		if (trackUris.length > 0) {
			options.qs.uris = trackUris.join(',')
		} else {
			throw new RangeError('No Track Uris where specified')
		}

		return rp(`${baseApiUrl}/users/${userId}/playlists/${playlistId}/tracks`, options)
	}

	public redirectToAuth(res: Express.Response) {
		const state = generateRandomString(16)
		res.cookie(stateKey, state)

		const scope = 'user-read-private user-read-email playlist-read-private playlist-modify-private playlist-modify-public'
		res.redirect(`${baseAuthUrl}/authorize?` +
			querystring.stringify({
				response_type: 'code',
				client_id,
				scope,
				redirect_uri,
				state
			}))
	}

	public async handleCallback(req: Express.Request, res: Express.Response) {
		const code = req.query.code || null
		const state = req.query.state || null
		const storedState = req.cookies ? req.cookies[stateKey] : null

		if ( state === null || state !== storedState ) {
			res.redirect('/')
		} else {
			res.clearCookie(stateKey)

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
