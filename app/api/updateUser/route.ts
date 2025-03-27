import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PUT(request: Request) {
  const body = await request.json();
  console.log(body)
  if(typeof body !== 'object' || !body.sciper || typeof body.sciper !== 'number') {
      return new Response(JSON.stringify({
          error: 'Invalid body',
          message: 'Body must be an object with the `sciper` property that is a number.',
      }), {
          headers: { 'content-type': 'application/json' },
          status: 400,
      });
  }

  const dbUser = await prisma.users.findUnique({
      where: { sciper: parseInt(body.sciper) },
  });
  if(!dbUser) {
    // User does not yet exists in the database, creating it
    await prisma.users.create({
      data: {
        sciper: parseInt(body.sciper),
      }
    });
  }
  const fundsResponse = await fetch(`${process.env.APP_URL}/api/funds/${body.sciper}`);
  const funds = await fundsResponse.json();
  // If no `funds.error`, it means the user has at least one fund
  if(!funds.error) {
    const userAndFunds = await prisma.users.findUnique({
      where: { sciper: parseInt(body.sciper) },
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
                sciper: parseInt(body.sciper),
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
  } else if (funds.error) {
    // If the user has no funds (or no funds ANYMORE) in API, we delete all the relation between user and funds
    await prisma.users.update({
      where: { sciper: parseInt(body.sciper) },
      data: {
        funds: {
          deleteMany: {},
        },
      },
    });
  }

  return new Response(JSON.stringify({ message: `User ${body.sciper} has been updated` }), {
      headers: { 'content-type': 'application/json' },
  });
}