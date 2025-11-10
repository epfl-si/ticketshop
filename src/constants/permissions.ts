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
	ADMIN: {
		PATH: "/admin",
		PERMISSIONS: [PERMISSIONS.FUNDS.ALL, PERMISSIONS.TRAVELS.ALL],
		REWRITE: "/not-found",
	},
	SETTINGS: {
		PATH: "/settings",
		PERMISSIONS: [PERMISSIONS.FUNDS.LIST, PERMISSIONS.TRAVELS.LIST],
		REWRITE: "/denied",
	},
} as const;
