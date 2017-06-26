import { IUser, IPlaylist, PlaylistUpdatedEventArgs } from '../../models'

export interface IPlaylistRepository {
	withUser(user: string | IUser): IPlaylistRepositoryWithUser

	find(id: string): Promise<IPlaylist>
	findAll(): Promise<IPlaylist[]>
	hasId(id: string): Promise<boolean>
	remove(id: string): Promise<void>

	on(event: 'removed', callback: (data: string | IPlaylist) => void): void
	on(event: 'updated', callback: (args: PlaylistUpdatedEventArgs) => void): void
	on(event: 'created', callback: (data: IPlaylist) => void): void
}

export interface IPlaylistRepositoryWithUser {
	create(name: string, playlistId: string, userId: string): Promise<IPlaylist>
	findAll(): Promise<IPlaylist[]>
	find(id: string): Promise<IPlaylist>
	hasId(id: string): Promise<boolean>

	withPlaylist(playlistId: string): IPlaylistRepositoryWithId
}

export interface IPlaylistRepositoryWithId {
	update(name?: string, playlistId?: string, userId?: string): Promise<IPlaylist>
	remove(): Promise<void>
}
