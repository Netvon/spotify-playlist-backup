import { Controller, Get, Post, PathParams, Response, Request, UseBefore, Authenticated, Status } from 'ts-express-decorators'
import * as Express from 'express'
import { SchedulerService, SpotifyJobService, ScheduledBackupsService } from '../services'
import { Backup } from '../models'
import { NotFound } from 'ts-httpexceptions'

import BearerAuthMiddleware from '../middlewares/bearer-auth.middleware'

@Controller('/api/jobs')
export class JobsController {

	constructor(
		private schedulerService: SchedulerService,
		private spotifyJobService: SpotifyJobService,
		private scheduledBackupsService: ScheduledBackupsService
	) { }

	@Get('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public getJobs(
		@Request() req: Express.Request
	) {
		return this.scheduledBackupsService.getScheduledBackups(req.user.id)
	}

	@Get('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public getJob(
		@Request() req: Express.Request,
		@PathParams('id') id: string
	) {
		return this.scheduledBackupsService.getScheduledBackup(id, req.user.id)
	}

	@Post('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	@Status(204)
	public postRunJobNow(
		@Request() req: Express.Request,
		@PathParams('id') id: string
	) {
		return this.scheduledBackupsService.invokeBackup(id, req.user.id)
		// const result = await Backup.invokeNow(this.schedulerService, id, req.user.id)

		// if ( result ) {
		// 	return result
		// } else {
		// 	throw new NotFound('No Job with the given id was found')
		// }
	}
}
