import { IMiddleware, Middleware, Request, Response, Next } from 'ts-express-decorators'
import passport = require('passport')

@Middleware()
export default class BearerAuthMiddleware implements IMiddleware {

	use(
		@Request() request,
		@Response() response,
		@Next() next,
	) {
		passport.authenticate('bearer', { session: false, failureFlash: false } )( request, response, next )
	}
}
