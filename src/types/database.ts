export interface DbUser {
	id: string;
	uniqueId: string;
	createdAt: Date;
	updatedAt: Date;
	travels: DbTravel[];
	settings: DbSetting[];
}

export interface DbFund {
	id: string;
	resourceId: string;
	cf: string;
	settings: DbSetting[];
}

export interface DbTravel {
	id: string;
	requestId: string;
	name: string;
	dates?: string;
	destination?: string;
	userId: string;
	user: DbUser;
	settings: DbSetting[];
}

export interface DbSetting {
	id: string;
	shown: boolean;
	userId: string;
	fundId?: string | null;
	travelId?: string | null;
	user: DbUser;
	fund?: DbFund | null;
	travel?: DbTravel | null;
}