import * as nodeSchedule from 'node-schedule'
import { Service } from 'ts-express-decorators'
import * as moment from 'moment'

@Service()
export class SchedulerService {

	private scheduler = nodeSchedule

	constructor() {
		console.log('SchedulerService created')
	}

	get jobs() {
		return this.scheduler.scheduledJobs
	}

	start(name: string, cron: Cron, callback: SchedulerCallback): Date {
		const job = nodeSchedule.scheduleJob(name, cron, () => {
			callback(this.createLogger(name))
		})

		return job.nextInvocation()
	}

	stop(job: string | nodeSchedule.Job): boolean {
		return this.scheduler.cancelJob(job)
	}

	update(job: string | nodeSchedule.Job, cron: Cron): nodeSchedule.Job {
		return this.scheduler.rescheduleJob(job, cron)
	}

	private createLogger(name: string) {
		return (message: string) => console.log(`[${moment().toLocaleString()} ~ ${name}] ${message}`)
	}
}

export type SchedulerCallback = (log: (message: string) => void) => void
export type Cron = nodeSchedule.RecurrenceRule | nodeSchedule.RecurrenceSpec | Date | string
