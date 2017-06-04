let userModel = require('../mongoose/models/user'),
	backupModel = require('../mongoose/models/backup'),
	spotify = require('./spotify')

module.exports = function(backup, client_id, client_secret) {

	return function(log) {

		if(!backup.forUser.refreshToken) {
			log('Refresh token is null, needs re-login')
			return
		}

		doJob(backup.forUser.userId, 
			backup.forUser.token, 
			backup.forUser.refreshToken, 
			backup.forUser.expireDate)

		// userModel.findOne({ userId: backup_db.forUser.userId })
		// 	.populate({
		// 		path: 'backups',
		// 		populate: { path: 'origin target' }})
		// 	.then(user => {
		// 		if(user.refreshToken === null)
		// 			log('Refresh token is null, needs re-login')
		// 		else
		// 			doJob(user.userId, user.token, user.refreshToken, user.expireDate, user.backups)
		// 	})
		// 	.catch(reason => {
		// 		log(reason)
		// 	})


		function doJob(userId, access_token, refresh_token, expires_in) {
			let now = new Date()
			let api = spotify.createApi(access_token, client_id, client_secret)

			if(now > expires_in) {
				log('Token is expired, getting new token')

				api.getNewToken(refresh_token).then(params => {

					let expires = new Date()
					expires.setSeconds(expires.getSeconds() + params.expires_in)

					userModel.findOneAndUpdate({ userId: userId }, {
						token: params.access_token,
						expireDate: expires
					})
					.then(x => doJob(userId, params.access_token, params.refresh_token, expires))
					.catch(log)				
				})
			} else {
				log('Token is fresh')

				handleBackup(api)
			}
		}

		/**
		 * @param {object} api
		 */
		function handleBackup(api) {

			log(`Getting Playlists '${backup.origin.name}' and '${backup.target.name}'`)

			Promise.all([
				getOrigin(),
				getTarget()
			]).then(values => {

				let lastAddedToOrigin = new Date()
				let lastAddedToBackup = new Date()

				/**
				 * @type {object[]}
				 */
				let origin = []

				for (let playlist of values) {

					let items = playlist.items.map(x => new Date(x.added_at)).sort().reverse()

					if(playlist.href.includes(backup.origin.playlistId)) {
						lastAddedToOrigin = items[0]
						origin = playlist
					} else {
						lastAddedToBackup = items[0]
					}
				}

				backupModel.findByIdAndUpdate(backup.id, { lastChecked: new Date() })
					.catch(log)

				if(lastAddedToOrigin > lastAddedToBackup) {
					log('Backup is out of date!')

					/**@type {string[]} */
					let uris = origin.items.map(x => x.track.uri)
					
					if(uris.length <= 0)
						return

					api.postPlaylistTracks(backup.target.userId, backup.target.playlistId, uris)
						.then(x => backupModel.findByIdAndUpdate(backup._id, { lastUpdated: new Date() }).catch(console.log))
						.catch(log)
				} else {
					log('Backup is up-to-date!')
				}
			}).catch(log)

			function getOrigin() {
				return api.getPlaylistTracks(backup.origin.userId, backup.origin.playlistId)
			}

			function getTarget() {
				return api.getPlaylistTracks(backup.target.userId, backup.target.playlistId, limit = null, offset = null, fields = 'total')
					.then(({ total } )=> { 
						return api.getPlaylistTracks(backup.target.userId, backup.target.playlistId, limit = 30, offset = total - 30)
					})
			}		
		}
}}