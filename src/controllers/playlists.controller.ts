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

@Controller('/api/playlists')
export class PlaylistsController {

	@Get('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public async getAll(
		@Request() req: Express.Request
	) {
		return await Playlist.find({ forUser: req.user.id }, 'name playlistId userId')
	}

	@Get('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public async getOne(
		@Request() req: Express.Request,
		@PathParams('id') id: string
	) {
		const playlist = await Playlist.findById(id, 'name playlistId userId').where('forUser', req.user.id)
		if ( !playlist ) {
			throw new NotFound('No Playlist with the given id was found')
		} else {
			return playlist
		}
	}

	@Post('')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	@Status(201)
	public async createPlaylist(
		@Request() req: Express.Request,
		@Required() @BodyParams('name') name: string,
		@Required() @BodyParams('playlistId') playlistId: string,
		@BodyParams('userId') userId: string
	) {
		if ( !userId ) {
			userId = req.user.userId
		}

		return await Playlist.create({ name, playlistId, userId })
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
		if ( !name && !playlistId && !userId ) {
			throw new BadRequest('No values found on body to Patch')
		}

		const playlist = await Playlist.findById(id).where('forUser', req.user.userId)

		if ( !playlist ) {
			throw new NotFound('No Playlist with the given id was found')
		}

		if ( name ) { playlist.name = name }
		if ( playlistId ) { playlist.playlistId = playlistId }
		if ( userId ) { playlist.userId = userId }

		await playlist.save()

		return { message: 'The Playlist was successfully patched' }
	}

	@Delete('/:id')
	@UseBefore(BearerAuthMiddleware)
	@Authenticated()
	public async deletePlaylist(
		@Request() req: Express.Request,
		@PathParams('id') id: string
	) {
		return await Playlist.remove({ id, forUser: req.user.id })
	}
}
