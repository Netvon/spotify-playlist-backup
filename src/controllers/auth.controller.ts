import { Controller, Get, Response, Request, CookiesParams, Redirect } from 'ts-express-decorators'
import * as Express from 'express'
import { SpotifyApiService } from '../services'
import { Backup } from '../models'
import { getSecret } from '../utils'

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
}
