import { Service } from 'ts-express-decorators'
import { Strategy } from 'passport'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import { SpotifyApiService } from './'
import { User } from '../models'

import { Unauthorized, Exception } from 'ts-httpexceptions'
import { StatusCodeError } from 'request-promise-core'

import passport = require('passport')

@Service()
export class PassportService {

	static serialize(user, done) {
		done(null, user.id)
	}

	constructor(private spotifyApi: SpotifyApiService) { }

	public async deserialize(id, done) {
		done(null, await User.findById(id))
	}

	public init() {
		const strategy = new BearerStrategy(async (token, done) => {
			try {
				const user = await this.spotifyApi.getMe(token)

				if ( !user ) {
					done(null, false)
				} else {
					const dbUser = await User.findOne({ userId: user.id })

					if ( !dbUser ) {
						done(null, false)
					} else {
						done(null, dbUser)
					}
				}
			} catch ( error ) {
				console.log(error.statusCode)
				if ( error.name === 'StatusCodeError' && error.statusCode === 401 ) {
					done(new Unauthorized(error.error.error.message), null, error.error.error.message)
				} else if ( error.name === 'StatusCodeError' && error.statusCode ) {
					done(new Exception(error.statusCode, error.error.error.message, error), null, error.error.error.message)
				} else {
					done(error, null, error.message)
				}
			}
		})

		passport.use('bearer', strategy as Strategy)
	}
}
