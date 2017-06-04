var util = {
	get now() {
		let d = new Date()
		return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
	}
}

let runningJobs = []

class Scheduler {
	constructor(scheduler = require('node-schedule')) {
		this.scheduler = scheduler
	}

	/**
	 * 
	 * @param {string} name 
	 * @param {string} crone 
	 * @param {function(function(string))} fn
	 * 
	 * @memberOf Scheduler
	 */
	start(name, crone, fn) {
		let log = function(message) {
			console.log(`[${util.now} ~ ${name}] ${message}`)
		}

		log('Starting Job')

		let job = this.scheduler.scheduleJob(name, crone, function() {
			fn(log)
		})

		runningJobs.push(job)

		return job.nextInvocation()
	}

	/** 
	 * @param {string} job 
	 * 
	 * @memberOf Scheduler
	 */
	stop(job) {
		return this.scheduler.cancelJob(job)
	}

	/**
	 * 
	 * 
	 * @param {string} job 
	 * @param {string} cron 
	 * @returns 
	 * 
	 * @memberOf Scheduler
	 */
	update(job, cron) {
		return this.scheduler.rescheduleJob(job, cron)
	}

	get jobs() {
		return this.scheduler.scheduledJobs
	}

	/**
	 * @returns {Array<Job>}
	 * 
	 * @readonly
	 * 
	 * @memberOf Scheduler
	 */
	get scheduledJobs() {
		return runningJobs
	}
}

// function create() {
// 	return require('node-schedule')
// }

// function start(name, crone, fn) {
// 	let schedule = require('node-schedule')
// 	let counter = 0	

// 	/**
// 	 * 
// 	 * @param {string} message 
// 	 */
// 	let log = function(message) {
// 		console.log(`[${util.now} ~ ${name}] ${message}`)
// 	}

// 	log('Starting Job')

// 	let job = schedule.scheduleJob(name, crone, function() {
// 		fn(log)
// 	})

// 	let stateObject = {
// 		get job() {
// 			return job
// 		},

// 		get counter() {
// 			return counter
// 		},

// 		get nodeScheduler() {
// 			return schedule
// 		}
// 	}

// 	return stateObject
// }

let scheduler = new Scheduler()

module.exports = scheduler