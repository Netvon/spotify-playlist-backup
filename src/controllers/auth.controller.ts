import { Controller, Get, Response, Request, CookiesParams, Redirect } from 'ts-express-decorators'
import * as Express from 'express'
import { SchedulerService, SpotifyApiService } from '../services'
import { Backup } from '../models'

@Controller('')
export class AuthController {

	constructor(
		private schedulerService: SchedulerService,
		private spotifyApiService: SpotifyApiService,
	) { }

	@Get('/login')
	public getLogin(
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
