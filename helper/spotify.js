let rp = require('request-promise-native')

/**
 * 
 * @param {string} token 
 * @param {string} client_id 
 * @param {string} client_secret 
 */
let createApi = function(token, client_id, client_secret) {

	let currentToken = token

	let authHeader = (token) => {
		return { Authorization: 'Bearer ' + token }
	}

	return {

		set token(token) {
			currentToken = token
		},

		/**
		 * @param {string} userId 
		 * @param {string} playlistId 
		 */
		getPlaylist(userId, playlistId) {
			return rp(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}`, {
				headers: authHeader(currentToken),
				json: true
			})
		},

		/**
		 * @param {string} userId 
		 * @param {string} playlistId 
		 * @param {string} fields
		 * @param {number} limit
		 * @param {number} offset
		 */
		getPlaylistTracks(userId, playlistId, limit = null, offset = null, fields = 'href,items(added_at,track(uri))') {

			let options = { headers: authHeader(currentToken), json: true, qs: {} }

			if(fields !== null)
				options.qs.fields = fields
			
			if(limit !== null && limit > 0 && Number.isInteger(limit))
				options.qs.limit = limit

			if(offset !== null && offset > 0 && Number.isInteger(offset))
				options.qs.offset = offset

			return rp(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, options)
		},

		/**
		 * 
		 * 
		 * @param {number|string} userId 
		 * @param {number} playlistId 
		 * @param {Array<String>} trackUris 
		 * @param {number} [position=0] 
		 */
		postPlaylistTracks(userId, playlistId, trackUris, position = 0) {
			let options = { method: 'POST', headers: authHeader(currentToken), json: true, qs: {} }

			if(Array.isArray(trackUris) && trackUris.length > 0) 
				options.qs.uris = trackUris.join(',')
			else
				throw new RangeError('No Track Uris where specified')

			return rp(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, options)
		},

		/**
		 *  
		 * @param {string} refresh_token
		 */
		getNewToken(refresh_token) {
			let options = {
				method: 'POST',
				headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
				form: {
					grant_type: 'refresh_token',
					refresh_token: refresh_token
				},
				json: true
			}
			
			return rp('https://accounts.spotify.com/api/token', options)
		}
	}
}

module.exports = {
	createApi
}