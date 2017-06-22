import * as dotenv from 'dotenv'
dotenv.config()

import * as Express from 'express'
import { ServerLoader, ServerSettings, InjectorService, GlobalAcceptMimesMiddleware } from 'ts-express-decorators'
import * as Path from 'path'
import { connectDb } from './config/database'
import { Backup } from './models'
import { SchedulerService, SpotifyJobService, PassportService } from './services'
import { Exception } from 'ts-httpexceptions'

import passport = require('passport')

const rootDir = Path.resolve(__dirname)

@ServerSettings({
	rootDir,
	port: process.env.PORT || 7001,
	mount: {
		'': `${rootDir}/controllers/**/**.js`
	},
	componentsScan: [
		`${rootDir}/services/**/**.js`,
		`${rootDir}/middlewares/**/**.js`
	],
	serveStatic: {
		'/': Path.resolve(__dirname, '../public')
	},
	acceptMimes: ['application/json']
})
export class Server extends ServerLoader {

	static Initialize = (): Promise<any> => new Server().start()

	public async $onInit() {
		await connectDb()
	}

	public $onMountingMiddlewares(): void | Promise<any> {
		const cookieParser = require('cookie-parser')
		const bodyParser = require('body-parser')

		this.use(cookieParser())
			.use(bodyParser.json())
			.use(bodyParser.urlencoded({ extended: true }))
			.use(GlobalAcceptMimesMiddleware)
			.use(passport.initialize())

		this.injectorService.get<PassportService>(PassportService).init()
	}

	public $onReady() {
		console.log('Server started...')

		Backup.scheduleBackups(
			this.injectorService.get<SchedulerService>(SchedulerService),
			this.injectorService.get<SpotifyJobService>(SpotifyJobService)
		)
	}

	public $onAuth(request, response, next, authorization?: any): void {
		next(request.isAuthenticated())
	}

	public $onServerInitError(err) {
		console.error(err)
	}

	public $onError(error: any, request: Express.Request, response: Express.Response, next: Express.NextFunction) {
		if (response.headersSent) {
			return next(error)
		}

		if (typeof error === 'string') {
			response.status(404).json({ error })
			return next()
		}

		if (error instanceof Exception) {
			response.status(error.status).json({ error: error.message })
			return next()
		}

		if (error.name === 'CastError' || error.name === 'ObjectID' || error.name === 'ValidationError') {
			response.status(400).send('Bad Request')
			return next()
		}

		console.error(error)
		response.status(error.status || 500).send('Internal Error')

		return next()
	}
}

Server.Initialize()
