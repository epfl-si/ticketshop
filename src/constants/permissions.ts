export const PERMISSIONS = {
	FUNDS: {
		LIST: "funds:list",
		READ: "funds:read",
		UPDATE: "funds:update",
		ALL: "funds:all",
	},
	TRAVELS: {
		LIST: "travels:list",
		READ: "travels:read",
		UPDATE: "travels:update",
		ALL: "travels:all",
	},
};

export const PROTECTED_ROUTES = {
	SEARCH: {
		PATH: "/search",
		PERMISSIONS: [PERMISSIONS.FUNDS.ALL, PERMISSIONS.TRAVELS.ALL],
	},
	HOME: {
		PATH: "/",
		PERMISSIONS: [PERMISSIONS.FUNDS.LIST, PERMISSIONS.TRAVELS.LIST],
	},
} as const;
