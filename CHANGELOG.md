# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog][keepachangelog], and this project
adheres to [Semantic Versioning][semver]. Patch releases are folded into
the minor release they belong to; the full list is available on the
[releases page][releases].


## [2.16.0] - 2026-08-26

- Application access is gated on the `railticket` Accred right only.

## [2.15.0] - 2026-06-10

- CSV export of the activity logs.
- URL parameters for log search, such as `/logs/123456?t=fund_disabled`,
  and basic monitoring.
- Improved search on the logs page.
- Request type count on the summary card and missing translation tags
  (2.15.1).
- SCIPER extraction for the oldest log entries, which used a different
  syntax (2.15.3).
- Error objects are parsed into a human-readable form (2.15.4).

## [2.14.0] - 2026-02-03

- Richer log retrieval with a structured metadata layout.
- Docker builds use `npm ci` instead of `npm install`.
- Database types renamed from `DbUser`, `DbFund`, `DbTravel` and
  `DbSetting` to their explicit `Database*` equivalents.
- Dependencies updated.
- Client IP header retrieval and `userId` logging in the middleware.
- Bullet rendering in the rights list (2.14.1).

## [2.13.0] - 2025-12-12

- Response time improved on the critical SOAP path.
- `User not found` artifact error.

## [2.12.0] - 2025-12-01

- Per-user administration page.
- Route protection check simplified in the middleware.
- Next.js bumped to 15.5.7 (2.12.1).

## [2.11.0] - 2025-11-21

- Event logs page with filters, backed by a new `logs` table.
- `logs:read` permission and protected `/logs` route.
- Structured log types and parameters, persisted to the database.
- `/cgi-bin/cff` redirects to `/home`.
- Email extraction in `parseArtifactRequest`.
- User synchronisation on artifact server requests.

## [2.10.0] - 2025-11-17

- Buttons to enable or disable all funds and travels at once.
- Button to open or close every fund group.

## [2.9.0] - 2025-11-17

- Application logging, including middleware and user synchronisation.

## [2.8.0] - 2025-11-11

- Redis cache for users, with `POST /api/reload` to rebuild it.
- Known dependency vulnerabilities removed.
- Middleware matcher excludes the `api/reload` route.

## [2.7.0] - 2025-11-10

- Home page content, help and about sections reworked.
- Footer links and header styling cleaned up.
- `HOME` route renamed to `SETTINGS` for clarity.
- Missing first name or last name handled when building a user name.
- French translations corrected.

## [2.6.0] - 2025-11-07

- Page footer with version and source code links.

## [2.5.0] - 2025-11-07

- Sortable table of funds and travels.
- Flat and grouped-by-CF views, with filter modes and a hidden-items count.
- Partial state indication for group visibility.

## [2.4.0] - 2025-11-03

- Header title uses the primary colour and links to the main page.

## [2.3.0] - 2025-10-31

- Success and error notifications when toggling an item (2.3.1).
- Success messages report the resulting status of funds and travels.

## [2.2.0] - 2025-10-28

- Fund details are fetched in batches.
- Settings are created with `upsert` to avoid duplicates.
- Payload and debug logging removed from artifact requests.
- XML structure of `getArtifactID` responses simplified.

## [2.1.0] - 2025-10-24

- Per-route rewrite target on permission denial, including the `/denied`
  page with a retry action.
- Toast notifications.
- `railticket-right_AppGrpU` also grants update permissions.
- Session validation added to user data access.
- Build workflow supports pull requests and improved version detection.

## [2.0.0] - 2025-10-21

- First production release of the Next.js rewrite: Entra ID sign-in, funds
  and travels settings, administration search and the SOAP artifact server.
- Docker standalone build, Prisma permissions and start-up migrations
  (2.0.1 to 2.0.7).

## [1.0.0] - 2025-08-14

- Initial version, developed from December 2024: EPFL API and SAP clients,
  Entra ID authentication, fund listing, artifact server and Prisma
  persistence.



[keepachangelog]: https://keepachangelog.com/en/1.1.0/
[releases]: https://github.com/epfl-si/ticketshop/releases
[semver]: https://semver.org/spec/v2.0.0.html
