import * as dotenv from 'dotenv'
dotenv.config()

import * as express from 'express'
import { ServerLoader, ServerSettings, InjectorService, GlobalAcceptMimesMiddleware } from 'ts-express-decorators'
import * as Path from 'path'
import { Backup } from './models'
import { SchedulerService, SpotifyJobService } from './services'

const rootDir = Path.resolve(__dirname)

@ServerSettings({
	rootDir,
	port: 7001,
	mount: {
		'': `${rootDir}/controllers/**/**.js`
	},
	componentsScan: [
		`${rootDir}/services/**/**.js`
	],
	serveStatic: {
		'/': Path.resolve(__dirname, '../public')
	},
	acceptMimes: ['application/json']
})
export class Server extends ServerLoader {

	static Initialize = (): Promise<any> => new Server().start()

	public $onMountingMiddlewares(): void|Promise<any> {
		const cookieParser = require('cookie-parser')
		// const bodyParser = require('body-parser')

		this.use(cookieParser())
			// .use(bodyParser.json())
			// .use(bodyParser.urlencoded( { extended: true } ))
			.use(GlobalAcceptMimesMiddleware)
	}

	public $onReady() {
		console.log('Server started...')

		Backup.scheduleBackups(
			this.injectorService.get<SchedulerService>(SchedulerService),
			this.injectorService.get<SpotifyJobService>(SpotifyJobService)
		)
	}

	public $onServerInitError(err) {
		console.error(err)
	}
}

Server.Initialize()
