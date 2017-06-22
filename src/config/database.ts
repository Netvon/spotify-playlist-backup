import mongoose = require('mongoose')
import { Mockgoose } from 'mockgoose'

function connectDb() {
	mongoose.Promise = global.Promise

	return new Promise((resolve, reject) => {
		if (process.env.NODE_ENV === 'testing') {
			const mockgoose = new Mockgoose(mongoose)
			mockgoose.prepareStorage()
				.then(() => mongoose.connect('mongodb://test.com/spb'))
				.then(resolve).catch(reject)
		} else {
			mongoose.connect(process.env.MONGO_DB).then(resolve).catch(reject)
		}
	})
}

export { mongoose, connectDb }
