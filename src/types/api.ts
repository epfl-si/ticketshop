export interface ApiUser {
	id: string;
	display: string;
	name: string;
	firstname?: string;
	lastname?: string;
	email: string;
	normalized?: string;
}

export interface ApiUnit {
	id: number;
	name: string;
	nameen?: string;
	namede?: string;
	nameit?: string;
	labelfr: string;
	labelen: string;
	labelde?: string;
	labelit?: string;
	startdate: string;
	enddate: string;
	path: string;
	level: number;
	parentid: number;
	type: string;
	responsibleid?: string;
	complementtype: string;
	unittypeid: number;
	address1: string;
	address2: string;
	address3: string;
	address4: string;
	city: string;
	country: string;
	cf: string;
	level1id: string;
	level2id: string;
	level3id: string;
	level4id: string;
	level1cf: string;
	level2cf: string;
	level3cf: string;
	level4cf: string;
	pathcf: string;
	url?: string;
	directchildren: string;
	allchildren: string;
	gid: number;
	ancestors: string[];
}

export interface ApiFund {
	id: string;
	label: string;
	cf: string;
	ownerid: string;
	clients: string;
	motif: string;
	unitid: number;
	unit: ApiUnit;
}

export interface ApiTravel {
	requestID: number;
	sciper: number;
	name: string;
	dates?: string;
	destination?: string;
	concatFunds?: number;
	imputation?: {
		fund: number;
		cf: string;
	} | {
		fund: number;
		cf: string;
	}[];
}

export interface ApiPerson {
	id: string;
	email: string;
	display: string;
	name?: string;
}
