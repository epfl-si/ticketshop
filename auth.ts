import NextAuth, { User, Session, Profile, Account } from "next-auth"
import { JWT } from "next-auth/jwt";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
        clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
        clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
        issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
        async profile(profile, tokens) {
          const response = await fetch(`${process.env.AUTH_MICROSOFT_GRAPH_API_URL}/me?$select=employeeId,id,displayName,jobTitle,mail,surname,userPrincipalName,birthday,companyName,joinedTeams,department`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const profileData = await response.json();
          return {
            id: profile.id,
            sciper: profileData.employeeId,
            name: profileData.displayName,
            email: profile.email,
            image: profile.picture,
            username: profileData.userPrincipalName
          }
        }
      })
  ],
  callbacks: {
		jwt: async ({ token, user }: { token: JWT; user: User }): Promise<JWT> => {
      try {
        if (user) {
          return {
            ...token,
            sciper: user?.sciper,
          }
        } else {
          return token;
        }
      } catch (error) {
        console.error('Token enhancement error:', error);
        return token;
      }
    },
    session: async ({ session, token }: { session: Session; token: JWT }): Promise<Session> => {
      return {
        ...session,
        user: {
          ...session.user,
          sciper: token.sciper as string,
        },
        
      }
    },
    signIn: async ({ user, account, profile }: { user: User; account: Account | null; profile?: Profile }) => {
      fetch(`${process.env.APP_URL}/api/updateUser`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sciper: parseInt(user.sciper) }),
      }).catch((error) => {
        console.error('Error updating user:', error);
      });
      return true;
    }
	},
})