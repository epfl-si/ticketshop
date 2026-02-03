export interface DatabaseUser {
    id: string;
    uniqueId: string;
    createdAt: Date;
    updatedAt: Date;
    travels: DatabaseTravel[];
    settings: DatabaseSetting[];
}

export interface DatabaseFund {
    id: string;
    resourceId: string;
    cf: string;
    settings: DatabaseSetting[];
}

export interface DatabaseTravel {
    id: string;
    requestId: string;
    name: string;
    dates?: string;
    destination?: string;
    userId: string;
    user: DatabaseUser;
    settings: DatabaseSetting[];
}

export interface DatabaseSetting {
    id: string;
    shown: boolean;
    userId: string;
    fundId?: string | null;
    travelId?: string | null;
    user: DatabaseUser;
    fund?: DatabaseFund | null;
    travel?: DatabaseTravel | null;
}
