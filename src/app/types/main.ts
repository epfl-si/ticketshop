export type Fund = {
    id: number,
    accredunitid: number,
    attribution: string,
    authid: number,
    enddate: string,
    labelen: string,
    labelfr: string,
    name: string,
    persid: string,
    resourceId: string,
    resourceid: string,
    status: string,
    type: string,
    value: string,
    workflowid: number,
}

export type Df = {
    id: number,
    requestID: number,
    sciper: number,
    name: string,
    dates: string,
    destination: string,
    concatFunds: number,
    imputation: {
        fund: number,
        cf: string,
    }
}

export type Setting = {
    id: number,
    shown: boolean,
    userId: number,
    fundId?: number | null,
    dfId?: number | null 
}