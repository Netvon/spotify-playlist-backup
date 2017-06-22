import { Controller, Get, Post, PathParams, Response, Request, UseBefore, Authenticated } from 'ts-express-decorators'
import * as Express from 'express'
import { SchedulerService, SpotifyJobService } from '../services'
import { Backup } from '../models'
import { NotFound } from 'ts-httpexceptions'

import BearerAuthMiddleware from '../middlewares/bearer-auth.middleware'

@Controller('/api/jobs')
export class JobsController {

	constructor(
		private schedulerService: SchedulerService,
		private spotifyJobService: SpotifyJobService,
	) { }

	@Get('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public getJobs(
		@Request() req: Express.Request
	) {
		return Backup.getJobs(this.schedulerService, req.user.id)
	}

	@Get('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public async getJob(
		@Request() req: Express.Request,
		@PathParams('id') id: string
	) {
		const result = await Backup.getJob(this.schedulerService, id, req.user.id)

		if ( result ) {
			return result
		} else {
			throw new NotFound('No Job with the given id was found')
		}
	}

	@Get('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public async postRunJobNow(
		@Request() req: Express.Request,
		@PathParams('id') id: string
	) {
		const result = await Backup.invokeNow(this.schedulerService, id, req.user.id)

		if ( result ) {
			return result
		} else {
			throw new NotFound('No Job with the given id was found')
		}
	}
}
