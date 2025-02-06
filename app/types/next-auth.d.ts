// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Session } from 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			username: string | undefined;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			sciper: string | null;
		};
	}
	interface User {
		username: string | null;
		sciper: string;
		name: string;
		email: string;
		image?: string;
	}
}
