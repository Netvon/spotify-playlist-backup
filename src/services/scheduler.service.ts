import * as s from 'node-schedule'
import { Service } from 'ts-express-decorators'
import * as moment from 'moment'

@Service()
export class SchedulerService {

	private scheduler = s
	private runningJobs: s.Job[] = []

	get jobs() {
		return this.scheduler.scheduledJobs
	}

	start(name: string, cron: Cron, callback: SchedulerCallback): Date {
		const job = s.scheduleJob(name, cron, () => {
			callback(this.createLog(name))
		})

		this.runningJobs.push(job)

		return job.nextInvocation()
	}

	stop(job: string | s.Job): boolean {
		return this.scheduler.cancelJob(job)
	}

	update(job: string | s.Job, cron: Cron): s.Job {
		return this.scheduler.rescheduleJob(job, cron)
	}

	private createLog(name: string) {
		return (message: string) => console.log(`[${moment().toLocaleString()} ~ ${name}] ${message}`)
	}
}

export type SchedulerCallback = (log: (message: string) => void) => void
export type Cron = s.RecurrenceRule | s.RecurrenceSpec | Date | string
