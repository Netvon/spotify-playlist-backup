import { Controller, Get, Response, Request, CookiesParams, Redirect, UseBefore, Authenticated } from 'ts-express-decorators'
import * as Express from 'express'
import { SpotifyApiService } from '../services'
import { Backup } from '../models'
import { getSecret } from '../utils'

import BearerAuthMiddleware from '../middlewares/bearer-auth.middleware'

@Controller('')
export class AuthController {

	constructor(
		private spotifyApiService: SpotifyApiService,
	) { }

	@Get('/login')
	public getLogin(
		@Request() req: Express.Request,
		@Response() res: Express.Response
	) {
		this.spotifyApiService.redirectToAuth(res)
	}

	@Get('/callback')
	@Redirect('/')
	public getCallback(
		@Request() req: Express.Request,
		@Response() res: Express.Response
	) {
		this.spotifyApiService.handleCallback(req, res)
	}

	@Get('/me')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public getMe(
		@Request() req: Express.Request,
	) {
		return req.user
	}
}
