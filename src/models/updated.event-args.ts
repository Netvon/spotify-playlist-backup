interface IUpdatedEventArgs<K extends string> {
	id: string
	updated?: IUpdated<K>
}

type IUpdated<K extends string> = { [key in K]?: IUpdate }

interface IUpdate {
	new: any
	old: any
}

export class UpdatedEventArgs<K extends string> implements IUpdatedEventArgs<K> {

	updated?: IUpdated<K>

	constructor(public id: string ) { }

	addUpdated(name: K, newValue: any, oldValue: any) {
		if ( !this.updated ) {
			this.updated = { }
		}

		this.updated[name] = { old: oldValue, new: newValue }
	}
}
