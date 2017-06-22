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

@Controller('/api/backups')
export class BackupsController {

	@Get('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public async getAll(
		@Request() req: Express.Request
	) {
		return await Backup.find({ forUser: req.user.id }, 'name cron origin target')
	}
}
