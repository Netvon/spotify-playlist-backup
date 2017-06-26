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
import { Playlist } from '../models'
import { NotFound, BadRequest } from 'ts-httpexceptions'

import BearerAuthMiddleware from '../middlewares/bearer-auth.middleware'
import { PlaylistRepository } from '../repositories'

@Controller('/api/playlists')
export class PlaylistsController {

	constructor(private playlistRepository: PlaylistRepository) {}

	@Get('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public getAll(
		@Request() req: Express.Request
	) {
		return this.playlistRepository.withUser(req.user).findAll()
	}

	@Get('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public async getOne(
		@Request() req: Express.Request,
		@PathParams('id') id: string
	) {
		return this.playlistRepository.withUser(req.user).find(id)
	}

	@Post('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	@Status(201)
	public createPlaylist(
		@Request() req: Express.Request,
		@Required() @BodyParams('name') name: string,
		@Required() @BodyParams('playlistId') playlistId: string,
		@BodyParams('userId') userId: string
	) {
		if ( !userId ) {
			userId = req.user.userId
		}

		return this.playlistRepository.withUser(req.user).create(name, playlistId, userId)
	}

	@Patch('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public async updatePlaylist(
		@Request() req: Express.Request,
		@PathParams('id') id: string,
		@BodyParams('name') name: string,
		@BodyParams('playlistId') playlistId: string,
		@BodyParams('userId') userId: string
	) {
		return this.playlistRepository.withUser(req.user)
			.withPlaylist(id)
			.update(name, playlistId, userId)
	}

	@Delete('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public deletePlaylist(
		@Request() req: Express.Request,
		@PathParams('id') id: string
	) {
		return this.playlistRepository.withUser(req.user)
			.withPlaylist(id)
			.remove()
	}
}
