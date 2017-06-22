process.env.NODE_ENV = 'testing'

import { connectDb } from '../../config/database'
import { Backup } from '../../models'
import { expect, should } from 'chai'
import { suite, test, slow, timeout } from 'mocha-typescript'
import { Mongoose, Schema, Document, Types } from 'mongoose'

@suite()
class HomeModelTests {

	static before() {
		return connectDb()
	}

	@test('it should not allow backup to reference the same playlist for "target" and "origin"')
	public testMinLength(done: MochaDone) {
		const testId = new Types.ObjectId(12)

		const backup = new Backup({
			origin: testId,
			target: testId,
			cron: '* * * * *',
			name: 'TestBackup',
			forUser: testId
		})

		const validate = backup.validateSync()

		expect(validate).to.have.property('errors').to.have.property('origin')
		expect(validate).to.have.property('errors').to.have.property('target')

		done()
	}

	@test('it should require name, cron, name, target, origin, forUser')
	public testRequiredValues(done: MochaDone) {

		const backup = new Backup({})

		const validate = backup.validateSync()

		expect(validate).to.have.property('name').that.equals('ValidationError')

		this.assertRequired(validate, 'name')
		this.assertRequired(validate, 'cron')
		this.assertRequired(validate, 'target')
		this.assertRequired(validate, 'origin')
		this.assertRequired(validate, 'forUser')

		done()
	}

	@test('it should only have a valid cron')
	public testValidPostalCode(done: MochaDone) {

		const backup = new Backup({ cron: 'hallo' })

		const validate = backup.validateSync()

		expect(validate).to.have.property('name').that.equals('ValidationError')
		expect(validate).to.have.property('errors').to.have.property('cron')

		done()
	}

	private assertRequired(object: object, name: string) {
		return expect(object).to.have.property('errors')
						.to.have.property(name)
						.to.have.property('kind')
						.that.equals('required')
	}

}
