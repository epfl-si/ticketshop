'use server';
import { PrismaClient } from '@prisma/client';
import { getDfs, getFunds } from './api';
import { Fund } from '@/app/types/main';

const prisma = new PrismaClient();

export async function updateSetting(shownValue: boolean, settingId: number) {
    return await prisma.settings.update({
        where: { id: settingId },
        data: {
            shown: shownValue
        },
    });
}

export async function getUser(sciper: string) {
    const dbUser = await prisma.users.findUnique({
        where: { sciper: parseInt(sciper) },
        include: { dfs: true, funds: true, settings: true },
    });

    return dbUser;
}

export async function updateUser(sciper: string) {
    const dbUser = await prisma.users.findUnique({
        where: { sciper: parseInt(sciper) },
    });
    if(!dbUser) {
        // User does not yet exists in the database, creating it
        await prisma.users.create({
            data: {
                sciper: parseInt(sciper),
            }
        });
    }
    const funds = await getFunds(sciper);
    const fundsFromDb = await prisma.funds.findMany({});
    // If no `funds.error`, it means the user has at least one fund
    if(!funds.error) {
        const userAndFunds = await prisma.users.findUnique({
            where: { sciper: parseInt(sciper) },
            include: { funds: true },
        });
        // If funds returned from api.epfl.ch does not yet exsist in the database, we create them
        for (const fund of funds) {
            const fundResourceIdWithoutPrefix = fund.resourceid.slice(2);
            const fundFinancalCenterWithoutPrefix = fund.value.slice(6);
            const fundAlreadyInDb = fundsFromDb.find((f:{resourceId: string}) => f.resourceId === fundResourceIdWithoutPrefix);
            const fundLinkedToUser = userAndFunds?.funds.find((f:{resourceId: string}) => f.resourceId === fundResourceIdWithoutPrefix);
            if (!fundAlreadyInDb) {
                const createdFund = await prisma.funds.create({
                    data: {
                        resourceId: fundResourceIdWithoutPrefix,
                        cf: fundFinancalCenterWithoutPrefix,
                        users: {
                            connect: {
                                sciper: parseInt(sciper),
                            },
                        },
                    },
                });

                await prisma.settings.create({
                    data: {
                        shown: true,
                        user: {
                            connect: { id: userAndFunds?.id }
                        },
                        fund: {
                            connect: { id: createdFund.id }
                        },
                    },
                });
            } else if (fundAlreadyInDb && !fundLinkedToUser) {
                // If the fund already exists in the database but is not linked to the user, we link it
                await prisma.users.update({
                    where: { sciper: parseInt(sciper) },
                    data: {
                        funds: {
                            connect: {
                                resourceId: fundResourceIdWithoutPrefix,
                            },
                        },
                    },
                });

                await prisma.settings.create({
                    data: {
                        shown: true,
                        user: {
                            connect: { id: userAndFunds?.id }
                        },
                        fund: {
                            connect: { id: fundAlreadyInDb.id }
                        },
                    },
                });
            }
        }
        // If funds does not exist anymore from api.epfl.ch but exists in TicketShop's database, we delete them
        const fundsToDelete = userAndFunds?.funds.filter((f:{resourceId:string}) => !funds.find((fund:Fund) => fund.resourceid.slice(2) === f.resourceId)) || [];
        if (fundsToDelete.length > 0) {
            for (const fund of fundsToDelete) {
                await prisma.funds.delete({
                    where: { id: fund.id },
                });
            }
        }
    } else if (funds.error) {
        // If the user has no funds (or no funds ANYMORE) in API, we delete all the relation between user and funds
        await prisma.users.update({
            where: { sciper: parseInt(sciper) },
            data: {
                funds: {
                    deleteMany: {},
                },
            },
        });
    }

    // DFs
    const dfs = await getDfs(sciper);
    if(dfs.length > 0) {
        const userAndDfs = await prisma.users.findUnique({
            where: { sciper: parseInt(sciper) },
            include: { dfs: true },
        });
        // If dfs returned from the service does not yet exsist in the database, we create them
        for (const df of dfs) {
            const dfExists = userAndDfs?.dfs.find((d:{requestID: number}) => d.requestID === df.requestID);
            const fundOfDf = await prisma.funds.findMany({
                where: { resourceId: df.imputation.fund.toString()},
            })
            // The fund of the DF does not yet exists, creating it
            if(!fundOfDf.length) {
                await prisma.funds.create({
                    data: {
                        resourceId: df.imputation.fund.toString(),
                        cf: df.imputation.cf.slice(1),
                    },
                });
            }
            if (!dfExists) {
                const createdDf = await prisma.dfs.create({
                    data: {
                        requestID: df.requestID,
                        name: df.name,
                        dates: df.dates,
                        destination: df.destination,
                        user: {
                            connect: {
                                sciper: parseInt(sciper),
                            },
                        },
                        fund: {
                            connect: {
                                resourceId: df.imputation.fund.toString(),
                            },
                        }
                    },
                })

                await prisma.settings.create({
                    data: {
                        shown: true,
                        user: {
                            connect: { id: userAndDfs?.id }
                        },
                        df: {
                            connect: { id: createdDf.id }
                        },
                    },
                });
            }
        }
    }

    return { message: `User ${sciper} has been updated` }
}