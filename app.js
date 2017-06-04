let express = require('express'),
	app = express(),
	request = require('request'),
	querystring = require('querystring'),
	cookieParser = require('cookie-parser'),
	db = require('./mongoose'),
	userModel = require('./mongoose/models/user'),
	playlistModel = require('./mongoose/models/playlist'),
	backupModel = require('./mongoose/models/backup'),
	{ generateRandomString } = require('./helper/util')

db()

var client_id = process.env.CLIENT_ID; // Your client id
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = 'http://localhost:7000/callback'; // Your redirect uri

var stateKey = 'spotify_auth_state'

app.use(express.static(__dirname + '/public'))
	.use(cookieParser())

app.get('/jobs', async (req, res, next) => {
	try {
		res.json(await backupModel.getJobs())
	} catch (error) {
		res.status(500).json(error.message)
		console.error(error)
	}
	
})

app.get('/jobs/:jobId/invoke', async (req, res, next) => {
	try {
		res.json(await backupModel.invokeNow(req.params.jobId))
	} catch (error) {
		res.status(500).json(error.message)
		console.error(error)
	}	
})

app.get('/login', function(req, res) {

	var state = generateRandomString(16);
	res.cookie(stateKey, state);

	// your application requests authorization
	var scope = 'user-read-private user-read-email playlist-read-private playlist-modify-private playlist-modify-public'
	res.redirect('https://accounts.spotify.com/authorize?' +
		querystring.stringify({
			response_type: 'code',
			client_id: client_id,
			scope: scope,
			redirect_uri: redirect_uri,
			state: state
		}));
})

app.get('/callback', function(req, res) {

	// your application requests refresh and access tokens
	// after checking the state parameter

	let code = req.query.code || null;
	let state = req.query.state || null;
	let storedState = req.cookies ? req.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		res.redirect('/#' +
			querystring.stringify({
				error: 'state_mismatch'
			}));
	} else {
		res.clearCookie(stateKey);
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code'
			},
			headers: {
				'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
			},
			json: true
		};

		request.post(authOptions, function(error, response, body) {
			if (!error && response.statusCode === 200) {

				var access_token = body.access_token,
					refresh_token = body.refresh_token,
					expires_in = body.expires_in

				refreshToken = refresh_token

				var options = {
					url: 'https://api.spotify.com/v1/me',
					headers: { 'Authorization': 'Bearer ' + access_token },
					json: true
				};

				// use the access token to access the Spotify Web API
				request.get(options, function(error, response, body) {

					let expires = new Date()
					expires.setSeconds(expires.getSeconds() + expires_in)

					userModel.findOneAndUpdate({ userId: body.id }, { 
						userId: body.id, 
						token: access_token, 
						refreshToken: refresh_token,
						expireDate: expires
					}, { 
						new: true, 
						upsert: true 
					})

					.then(ok => console.log(body))
					.catch(err => console.log(err))
				});

				// we can also pass the token to the browser to make requests from there
				res.redirect('/#' +
					querystring.stringify({
						access_token: access_token,
						refresh_token: refresh_token
					}));
			} else {
				res.redirect('/#' +
					querystring.stringify({
						error: 'invalid_token'
					}));
			}
		});
	}
})

console.log('Listening on 7000');
app.listen(7000);

let refreshToken = null

/**
 * 
 * 
 * @param {string} refresh_token 
 * @returns {Promise<string>}
 */
function getNewToken(refresh_token) {
	let authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
		form: {
			grant_type: 'refresh_token',
			refresh_token: refresh_token
		},
		json: true
	}

	return new Promise((resolve, reject) => {
		request.post(authOptions, (error, response, body) => {
			if (!error && response.statusCode === 200) {
				resolve(body)
			} else {
				reject(error)
			}
		})
	})	
}

let scheduler = require('./helper/scheduler')

backupModel.scheduleBackups(scheduler, client_id, client_secret)

// let spotify = require('./helper/spotify')
// var s = require('./scheduler').start('renew-token', '*/50 * * * * *', function(log) {

// 	userModel.findOne({ userId: '1141166133' })
// 		.populate({
// 			path: 'backups',
// 			populate: { path: 'origin target' }})
// 		.then(user => {
// 			if(user.refreshToken === null)
// 				log('Refresh token is null, needs re-login')
// 			else
// 				doJob(user.userId, user.token, user.refreshToken, user.expireDate, user.backups)
// 		})
// 		.catch(reason => {
// 			log(reason)
// 		})


// 	function doJob(userId, access_token, refresh_token, expires_in, backups) {
// 		let now = new Date()
// 		let api = spotify.createApi(access_token, client_id, client_secret)

// 		if(now > expires_in) {
// 			log('Token is expired, getting new token')

// 			getNewToken(refresh_token).then(params => {

// 				let expires = new Date()
// 				expires.setSeconds(expires.getSeconds() + params.expires_in)

// 				userModel.findOneAndUpdate({ userId: userId }, {
// 					token: params.access_token, 
// 					refreshToken: params.refresh_token,
// 					expireDate: expires
// 				})
// 				.then(x => doJob(userId, params.access_token, params.refresh_token, expires, backups))
// 				.catch(reason => log(reason))				
// 			})
// 		} else {
// 			log('Token is fresh')

// 			handleBackups(api, backups)
// 		}
// 	}

// 	/**
// 	 * @param {object} api 
// 	 * @param {object[]} backups 
// 	 */
// 	function handleBackups(api, backups) {

// 		backups.forEach(backup => {

// 			log(`Getting Playlists '${backup.origin.name}' and '${backup.target.name}'`)

// 			Promise.all([
// 				getOrigin(backup),
// 				getTarget(backup)
// 			]).then(values => {

// 				let lastAddedToOrigin = new Date()
// 				let lastAddedToBackup = new Date()

// 				/**
// 				 * @type {object[]}
// 				 */
// 				let origin = []

// 				for (var key in values) {
// 					let playlist = values[key]

// 					if(playlist.href.includes(backup.origin.playlistId)) {
// 						lastAddedToOrigin = playlist.items[0].added_at
// 						origin = playlist
// 					} else {
// 						lastAddedToBackup = playlist.items[0].added_at
// 					}
// 				}

// 				backupModel.findByIdAndUpdate(backup.id, { lastChecked: new Date() })
// 					.catch(console.log)

// 				if(lastAddedToOrigin > lastAddedToBackup) {
// 					log('Backup is out of date!')

// 					/**@type {string[]} */
// 					let uris = origin.items.map(x => x.track.uri)
					
// 					if(uris.length <= 0)
// 						return

// 					api.postPlaylistTracks(backup.target.userId, backup.target.playlistId, uris)
// 						.then(x => backupModel.findByIdAndUpdate(backup._id, { lastUpdated: new Date() }).catch(console.log))
// 						.catch(console.log)
// 				} else {
// 					log('Backup is up-to-date!')
// 				}
// 			})
// 		})

// 		function getOrigin(backup) {
// 			return api.getPlaylistTracks(backup.origin.userId, backup.origin.playlistId)
// 		}

// 		function getTarget(backup) {

// 			return new Promise((resolve, reject) => {
// 				api.getPlaylistTracks(backup.target.userId, backup.target.playlistId, limit = null, offset = null, fields = 'total')
// 				.then(({ total } )=> { 
// 					api.getPlaylistTracks(backup.target.userId, backup.target.playlistId, limit = 30, offset = total - 30)
// 						.then(resolve)
// 						.catch(reject)
// 				})
// 				.catch(reject)
// 			})
// 		}
		
// 	}
// })
