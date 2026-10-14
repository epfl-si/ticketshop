# EPFL TicketShop

TicketShop is the EPFL web application that informs CFF/SBB which EPFL
collaborators are allowed to order public transport tickets and travel passes on
specific EPFL funds (invoice centres).

It serves two audiences:

- CFF/SBB systems, which call a SOAP endpoint to validate the `railticket`
  Accred right and retrieve the list of authorised cost assignments.
- EPFL collaborators, who sign in with their EPFL account to toggle the funds
  that the CFF webshop may offer them.

TicketShop runs under <https://ticketshop.epfl.ch>.


## How it works

1. CFF calls `getArtifactID` with a user email. TicketShop resolves the
   SCIPER through the EPFL API, synchronises the user in the database and
   returns the artifact ID, or a SOAP fault when the user has no
   `railticket` right.
   This endpoint is called to allow a collaborator to link their account with
   the EPFL contract on the CFF/SBB website, and whenever the user browses the
   CFF/SBB website.
2. CFF calls `getArtifact` with that SCIPER. TicketShop returns the funds the
   user is authorised for, minus the ones the user chose to hide in the web
   interface.
3. Users manage those choices on `/settings`. Administrators inspect other
   users and the activity logs.

Synchronisation towards CFF is not immediate; changes can take several
hours to appear on the CFF side due to cache.


## Stack

- [Next.js][nextjs] 16 (App Router, standalone output) with TypeScript
- [Prisma][prisma] 7 on PostgreSQL (users, funds, travels, settings, logs)
- [Redis][redis] for the users cache
- [Auth.js][authjs] v5 with Microsoft Entra ID
- [next-intl][nextintl] for English and French (French by default)
- [Tailwind CSS][tailwind] 4 with Radix/shadcn and MUI components


## Getting started

Requirements: Docker with Compose, and access to the Keybase team folder
`/keybase/team/epfl_ticketshop/` which holds the shared `.env`.

```bash
git clone git@github.com:epfl-si/ticketshop.git
cd ticketshop
make dev
```

`make dev` starts PostgreSQL, Redis and the development server with hot
reload, applies the Prisma migrations and exposes the application on
<http://localhost:3000>.

Without Keybase, copy `.env.example` to `.env` and fill it in. The
application then runs with placeholder credentials, so the EPFL API, SAP
and Entra ID calls will fail.

Other targets:

- `make help` lists the documented targets.
- `make up` and `make down` start and stop the development stack.
- `make logs` shows the container logs.


## Configuration

Environment variables, as listed in `.env.example`:

| Variable                           | Description                             |
| ---------------------------------- | --------------------------------------- |
| `API_URL`                          | EPFL API base URL for persons and funds |
| `API_USERNAME`                     | EPFL API username                       |
| `API_PASSWORD`                     | EPFL API password                       |
| `SAP_URL`                          | SAP endpoint for travel requests        |
| `DFS_USERNAME`                     | SAP/DFS username                        |
| `DFS_PASSWORD`                     | SAP/DFS password                        |
| `AUTH_MICROSOFT_ENTRA_ID_ID`       | Entra ID application (client) ID        |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET`   | Entra ID client secret                  |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER`   | Entra ID issuer URL                     |
| `AUTH_MICROSOFT_GRAPH_API_URL`     | Microsoft Graph API base URL            |
| `AUTH_SECRET`                      | Auth.js secret used to encrypt sessions |
| `AUTH_TRUST_HOST`                  | Trusted host of the deployment          |
| `TICKETSHOP_PG_HOST`               | PostgreSQL host name                    |
| `TICKETSHOP_PG_DB`                 | PostgreSQL database name                |
| `TICKETSHOP_PG_USER`               | PostgreSQL user name                    |
| `TICKETSHOP_PG_PASS`               | PostgreSQL password                     |

The four `TICKETSHOP_PG_*` variables are combined into `DATABASE_URL` by the
development Compose file; you do not need to set `DATABASE_URL` yourself.

Never commit a real `.env`; it is ignored by Git.


## Build and deployment

- `Dockerfile` builds a Node 22 Alpine image with the Next.js standalone
  output; Prisma migrations are applied at container start-up.
- Pushing to `master` builds and pushes
  `quay-its.epfl.ch/svc0049/ticketshop`, then creates a GitHub release
  whenever the `version` field of `package.json` changes. Pull requests
  build a `<short-hash>-dev` tag.
- Deployment to EPFL OpenShift lives in the [ticketshop.ops][ops]
  repository.


## Support

- Accred rights and funds: open a ticket through 1234.
- Travel questions: <mailto:mobilite@epfl.ch>.
- SwissPass and purchases on sbb.ch: CFF hotline.
- Application issues and contributions: open an [issue][issues].

[authjs]: https://authjs.dev
[issues]: https://github.com/epfl-si/ticketshop/issues
[nextintl]: https://next-intl.dev
[nextjs]: https://nextjs.org
[ops]: https://github.com/epfl-si/ticketshop.ops
[prisma]: https://www.prisma.io
[redis]: https://redis.io
[tailwind]: https://tailwindcss.com
