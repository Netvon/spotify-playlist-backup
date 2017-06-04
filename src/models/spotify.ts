export interface IExternalUrl {
	spotify: string
}

export interface IUserFollowers {
	href?: any
	total: number
}

export interface IImage {
	height?: any
	url: string
	width?: any
}

export interface IUser {
	birthdate: string
	country: string
	display_name: string
	email: string
	external_urls: IExternalUrl
	followers: IUserFollowers
	href: string
	id: string
	images: IImage[]
	product: string
	type: string
	uri: string
}

export interface IArtist {
	external_urls: IExternalUrl
	href: string
	id: string
	name: string
	type: string
	uri: string
}

export interface IAlbum {
	album_type: string
	artists: IArtist[]
	available_markets: string[]
	external_urls: IExternalUrl
	href: string
	id: string
	images: IImage[]
	name: string
	type: string
	uri: string
}

export interface IExternalId {
	isrc: string
}

export interface ITrack {
	album: IAlbum
	artists: IArtist[]
	available_markets: string[]
	disc_number: number
	duration_ms: number
	explicit: boolean
	external_ids: IExternalId
	external_urls: IExternalUrl
	href: string
	id: string
	name: string
	popularity: number
	preview_url: string
	track_number: number
	type: string
	uri: string
}

export interface IPlaylistItem {
	added_at: Date
	added_by?: any
	is_local: boolean
	track: ITrack
}

export interface IPlaylistTracks {
	href: string
	items: IPlaylistItem[]
	limit: number
	next: string
	offset: number
	previous?: any
	total: number
}
