import {
	Controller,
	Get,
	Post,
	PathParams,
	Required,
	Request,
	UseBefore,
	Authenticated,
	BodyParams,
	Status,
	Patch,
	Delete
} from 'ts-express-decorators'

import * as Express from 'express'
import { SchedulerService, SpotifyJobService } from '../services'
import { Backup, Playlist } from '../models'
import { NotFound, BadRequest } from 'ts-httpexceptions'

import BearerAuthMiddleware from '../middlewares/bearer-auth.middleware'
import { BackupRepository } from '../repositories'

@Controller('/api/backups')
export class BackupsController {

	constructor(private backupRepository: BackupRepository) {}

	@Get('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public getAll(
		@Request() req: Express.Request
	) {
		return this.backupRepository.withUser(req.user).findAll()
	}

	@Get('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public getById(
		@Request() req: Express.Request,
		@PathParams('id') backupId: string,
	) {
		return this.backupRepository.withUser(req.user).find(backupId)
	}

	@Post('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	@Status(201)
	public createBackup(
		@Request() req: Express.Request,
		@Required() @BodyParams('origin') origin: string,
		@Required() @BodyParams('target') target: string,
		@Required() @BodyParams('name') name: string,
		@Required() @BodyParams('cron') cron: string,
	) {
		return this.backupRepository.withUser(req.user).create(name, cron, target, origin)
	}

	@Patch('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public updateBackup(
		@Request() req: Express.Request,
		@PathParams('id') backupId: string,
		@BodyParams('origin') origin: string,
		@BodyParams('target') target: string,
		@BodyParams('name') name: string,
		@BodyParams('cron') cron: string,
	) {
		return this.backupRepository.withUser(req.user)
			.withBackup(backupId)
			.update(name, cron, target, origin)
	}

	@Delete('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public deleteBackup(
		@Request() req: Express.Request,
		@PathParams('id') backupId: string
	) {
		return this.backupRepository.withUser(req.user)
			.withBackup(backupId)
			.remove()
	}
}
