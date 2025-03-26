import NextAuth, { User, Session, Profile, Account } from "next-auth"
import { JWT } from "next-auth/jwt";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
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
            name: profile.name,
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
      const dbUser = await prisma.users.findUnique({
        where: { sciper: parseInt(user.sciper) },
      });
      if(!dbUser) {
        // User does not yet exists in the database, creating it
        await prisma.users.create({
          data: {
            sciper: parseInt(user.sciper),
            username: user.username || '',
          }
        });
      }
      const fundsResponse = await fetch(`${process.env.APP_URL}/api/funds/${user.sciper}`);
      const funds = await fundsResponse.json();
      // If no `funds.error`, it means the user has at least one fund
      if(!funds.error) {
        const userAndFunds = await prisma.users.findUnique({
          where: { sciper: parseInt(user.sciper) },
          include: { funds: true },
        });
        // If funds returned from api.epfl.ch does not yet exsist in the database, we create them
        for (const fund of funds) {
          const fundExists = userAndFunds?.funds.find(f => f.resourceId === fund.resourceid && f.uniteId === fund.accredunitid);
          if (!fundExists) {
            await prisma.funds.create({
              data: {
                resourceId: fund.resourceid,
                uniteId: fund.accredunitid,
                users: {
                  connect: {
                    sciper: parseInt(user.sciper),
                  },
                },
              },
            });
          }
        }
        // If funds does not exist anymore from api.epfl.ch but exists in TicketShop's database, we delete them
        const fundsToDelete = userAndFunds?.funds.filter(f => !funds.find(fund => fund.resourceid === f.resourceId && fund.accredunitid === f.uniteId)) || [];
        if (fundsToDelete.length > 0) {
          for (const fund of fundsToDelete) {
            await prisma.funds.delete({
              where: { id: fund.id },
            });
          }
        }
      }
      return true;
    }
	},
})