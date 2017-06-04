import { Controller, Get, Post, PathParams, Response } from 'ts-express-decorators'
import * as Express from 'express'
import { SchedulerService, SpotifyJobService } from '../services'
import { Backup } from '../models'

@Controller('/api/jobs')
export class JobsController {

	constructor(
		private schedulerService: SchedulerService,
		private spotifyJobService: SpotifyJobService,
	) { }

	@Get('')
	public getJobs() {
		return Backup.getJobs(this.schedulerService)
	}

	// @Get('/:id')
	// public getJob(
	// 	@PathParams('id') id: string
	// ) {
	// 	return Backup.getJob(this.schedulerService, id)
	// }

	@Get('/:id')
	public postRunJobNow(
		@PathParams('id') id: string
	) {
		return Backup.invokeNow(this.schedulerService, id)
	}
}
