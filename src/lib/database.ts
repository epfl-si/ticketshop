"use server";
import { PrismaClient } from "@prisma/client";
import { getUserFundAuthorizations, getFundDetails } from "../services/funds";
import { getUserTravels } from "../services/travels";
import { DbUser } from "@/types/database";
import { UserData, EnrichedFund, EnrichedTravel } from "@/types/ui";
import { hasPermission } from "@/services/policy";
import { PERMISSIONS } from "@/constants/permissions";
import { auth, getUser as getUserSession } from "@/services/auth";

import { cookies } from "next/headers";
import log from "@/services/log";

const prisma = new PrismaClient();

export async function updateSetting(shownValue: boolean, settingId: string) {
	if (!(await hasPermission(PERMISSIONS.FUNDS.UPDATE) && await hasPermission(PERMISSIONS.TRAVELS.UPDATE))) {
		throw new Error("Unauthorized to update settings");
	}

	logDatabase({ action: "updateSetting.entry", itemId: settingId, value: shownValue, direction: "inband"})

	const update = await prisma.setting.update({
		where: { id: settingId },
		data: {
			shown: shownValue,
		},
	});

	let itemId = "";

	if (update.fundId) {
		itemId = (await prisma.fund.findUnique({ where: { id: update.fundId } })).resourceId;
	}
	else if(update.travelId) {
		itemId = (await prisma.travel.findUnique({ where: { id: update.travelId } })).resourceId;
	}

	logDatabase({ action: "updateSetting.result", itemId, value: update.shown, itemType: update.travelId ? "travel" : "fund", fundId: update.fundId, travelId: update.travelId, direction: "outband"})

	return update;
}

export async function getUser(uniqueId: string): Promise<DbUser | null> {
	const dbUser = await prisma.user.findUnique({
		where: { uniqueId },
		include: {
			travels: true,
			settings: {
				include: {
					fund: true,
					travel: true,
				},
			},
		},
	});

	return dbUser as DbUser | null;
}

export async function syncUserData(uniqueId: string): Promise<{ message: string }> {
	let dbUser = await prisma.user.findUnique({
		where: { uniqueId },
		include: { travels: true, settings: true },
	});

	if (!dbUser) {
		dbUser = await prisma.user.create({
			data: {
				uniqueId,
			},
			include: { travels: true, settings: true },
		});
	}

	try {
		const fundAuthorizations = await getUserFundAuthorizations(uniqueId);

		if (fundAuthorizations.length > 0) {
			const currentSettings = await prisma.setting.findMany({
				where: { userId: dbUser.id, fundId: { not: null } },
				include: { fund: true },
			});

			for (const auth of fundAuthorizations) {
				const resourceId = auth.resourceId;

				let fund = await prisma.fund.findUnique({
					where: { resourceId },
				});

				if (!fund) {
					fund = await prisma.fund.create({
						data: {
							resourceId,
							cf: auth.fund || "",
						},
					});
				}

				const settingExists = currentSettings.find((s) => s.fund?.resourceId === resourceId);

				if (!settingExists) {
					await prisma.setting.upsert({
						where: {
							userId_fundId: {
								userId: dbUser.id,
								fundId: fund.id,
							},
						},
						update: {
							shown: true,
						},
						create: {
							shown: true,
							userId: dbUser.id,
							fundId: fund.id,
						},
					});
				}
			}

			const validResourceIds = fundAuthorizations.map(auth => auth.resourceId);
			const settingsToRemove = currentSettings.filter((s) =>
				s.fund && !validResourceIds.includes(s.fund.resourceId),
			);

			for (const setting of settingsToRemove) {
				await prisma.setting.delete({
					where: { id: setting.id },
				});
			}
		} else {
			await prisma.setting.deleteMany({
				where: { userId: dbUser.id, fundId: { not: null } },
			});
		}
	} catch (error) {
		console.error("Error syncing funds:", error);
	}

	try {
		const travels = await getUserTravels(uniqueId);

		if (travels.length > 0) {
			const currentTravels = await prisma.travel.findMany({
				where: { userId: dbUser.id },
			});

			for (const travel of travels) {
				const exists = currentTravels.find((t) => t.requestId === travel.requestID.toString());

				if (!exists) {
					const createdTravel = await prisma.travel.create({
						data: {
							requestId: travel.requestID.toString(),
							name: travel.name,
							dates: travel.dates,
							destination: travel.destination,
							userId: dbUser.id,
						},
					});

					await prisma.setting.create({
						data: {
							shown: true,
							userId: dbUser.id,
							travelId: createdTravel.id,
						},
					});
				}
			}

			const validRequestIds = travels.map(travel => travel.requestID.toString());
			const travelsToRemove = currentTravels.filter((t) => !validRequestIds.includes(t.requestId));

			for (const travel of travelsToRemove) {
				await prisma.travel.delete({
					where: { id: travel.id },
				});
			}
		}
	} catch (error) {
		console.error("Error syncing travels:", error);
	}

	return { message: `User ${uniqueId} data synchronized` };
}

export async function getUserData(uniqueId: string): Promise<UserData> {
	try {
		if (!(await hasPermission(PERMISSIONS.FUNDS.LIST) && await hasPermission(PERMISSIONS.TRAVELS.LIST))) {
			throw new Error("Unauthorized to read user data");
		}

		if (!(await hasPermission(PERMISSIONS.FUNDS.ALL) && await hasPermission(PERMISSIONS.TRAVELS.ALL))) {
			const session = await auth();
			if (session?.user?.userId !== uniqueId) {
				throw new Error("Unauthorized to read other users' data");
			}
		}

		await syncUserData(uniqueId);

		const dbUser = await getUser(uniqueId);
		if (!dbUser) {
			return {
				user: null,
				funds: [],
				travels: [],
				error: "User not found",
			};
		}

		const fundSettings = dbUser.settings.filter((s) => s.fundId);
		const fundIds = fundSettings.map((s) => s.fund?.resourceId).filter(Boolean) as string[];
		let enrichedFunds: EnrichedFund[] = [];

		if (fundIds.length > 0) {
			const fundDetails = await getFundDetails(fundIds);
			enrichedFunds = fundDetails.map(fund => ({
				...fund,
				setting: fundSettings.find((s) => s.fund?.resourceId === fund.id),
			}));
		}

		const travelDetails = await getUserTravels(uniqueId);
		const enrichedTravels: EnrichedTravel[] = travelDetails.map(travel => ({
			...travel,
			uniqueId,
			setting: dbUser.settings.find((s) =>
				s.travelId && dbUser.travels.find((t) => t.id === s.travelId)?.requestId === travel.requestID.toString(),
			),
		}));

		return {
			user: dbUser,
			funds: enrichedFunds,
			travels: enrichedTravels,
		};
	} catch (error) {
		console.error("Error getting user data:", error);
		return {
			user: null,
			funds: [],
			travels: [],
			error: "Failed to fetch user data",
		};
	}
}

export async function getUserFunds(uniqueId: string): Promise<EnrichedFund[]> {
	try {
		const dbUser = await getUser(uniqueId);
		if (!dbUser) return [];

		const fundSettings = dbUser.settings.filter((s) => s.fundId);
		const fundIds = fundSettings.map((s) => s.fund?.resourceId).filter(Boolean) as string[];
		if (fundIds.length === 0) return [];

		const fundDetails = await getFundDetails(fundIds);
		const userFounds = fundDetails.map(fund => ({
			...fund,
			setting: fundSettings.find((s) => s.fund?.resourceId === fund.id),
		}));
		logDatabase({action: "getUserFunds"})
		return userFounds;
	} catch (error) {
		console.error("Error getting user funds:", error);
		return [];
	}
}

export async function getUserTravelsEnriched(uniqueId: string): Promise<EnrichedTravel[]> {
	try {
		const dbUser = await getUser(uniqueId);
		if (!dbUser) return [];

		const travelDetails = await getUserTravels(uniqueId);
		return travelDetails.map(travel => ({
			...travel,
			uniqueId,
			setting: dbUser.settings.find((s) =>
				s.travelId && dbUser.travels.find((t) => t.id === s.travelId)?.requestId === travel.requestID.toString(),
			),
		}));
	} catch (error) {
		console.error("Error getting user travels:", error);
		return [];
	}
}

export async function createUser(uniqueId: string) {
	return await prisma.user.create({
		data: {
			uniqueId,
		},
	});
}

async function logDatabase(param: object): Promise<void> {
	const cookieStore = await cookies();
	const requestId = cookieStore.get('requestId')?.value;
	log.database({ ...param, requestId });
}