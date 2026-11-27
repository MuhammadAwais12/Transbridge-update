<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```

## Database setup and migrations

The schema is managed by TypeORM migrations in `src/migrations` (CLI config: `src/data-source.ts`).
Keep `DB_SYNC=false`; schema changes go through migrations.

Fresh database, in this order:

1. Create an empty PostgreSQL database, e.g. `createdb transbridge`.
2. Copy `.env.example` to `.env` and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (plus `JWT_SECRET` and the rest), with `DB_SYNC=false`.
3. Create the schema: `yarn migration:run`.
4. Start the app: `yarn start:dev` (or `yarn build && yarn start:prod`).

New migration after changing an entity:

```bash
# writes src/migrations/<timestamp>-<Name>.ts from the diff between the entities and the database in .env
$ yarn migration:generate src/migrations/AddSomething
# preview only, no file written
$ yarn migration:generate src/migrations/AddSomething --dr
$ yarn migration:run      # apply pending migrations
$ yarn migration:revert   # undo the most recent one
```

Generate against a database that is up to date with the existing migrations, and review the generated SQL before committing.

## Security configuration

- Apply all pending migrations before deploying; the current auth changes add `users.token_version`.
- Set `CORS_ORIGINS` to a comma-separated allowlist of trusted dashboard origins. HTTP and WebSocket connections use this list.
- Set `DB_SSL=true` for production PostgreSQL TLS. Certificate validation is enabled; set `DB_SSL_CA` to the PEM CA certificate if it is not in the host's default trust store.
- JWTs expire after one hour and are held in browser `sessionStorage` (per tab). The dashboard refreshes them via `POST /client/refresh-token` or `POST /msb-admin/refresh-token`; a session is capped at 12 hours from the last password login. Tokens are invalidated server-side at logout and password reset; a password change revokes other sessions and returns a new token to the current one. Existing users must log in again after deployment.
- Login is rate limited per account (6 attempts / 3 min, regardless of source IP) and per IP (30 attempts / 3 min).
- New and changed passwords must be 12-128 characters. Login still accepts legacy shorter passwords so existing accounts can authenticate and change them.
- Password reset requests and token submissions are rate limited. Reset tokens expire after 30 minutes and are single-use.
- Transaction completion must come from verified provider updates; the manual-completion endpoint is removed. Reconcile a `payout_processing` transaction with the provider before any retry after an uncertain payout response.

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Update MSB Branding

### Endpoint

    PATCH /msb-admin/branding/:msbId

### Description
Update the branding (colors, theme, logo) for a specific MSB.

### Request Body (JSON)
- `primary_color` (string, optional): e.g. "#3b82f6"
- `secondary_color` (string, optional): e.g. "#22c55e"
- `accent_color` (string, optional): e.g. "#f97316"
- `theme` (string, optional): "light" or "dark"
- `logo_url` (string, optional): URL to logo image

#### Example
```
PATCH /msb-admin/branding/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
Content-Type: application/json

{
  "primary_color": "#1e40af",
  "secondary_color": "#059669",
  "accent_color": "#dc2626",
  "theme": "dark",
  "logo_url": "https://example.com/logo.png"
}
```

### Response
```
{
  "message": "Branding updated successfully",
  "msb": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "FinTech Solutions Ltd",
    "domain": "banking.fintechsolutions.com",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#1e40af",
    "secondary_color": "#059669",
    "accent_color": "#dc2626",
    "theme": "dark",
    ...
  }
}
```

## Get MSB by ID

### Endpoint

    GET /msb-admin/:msbId

### Description
Fetch a single MSB by its ID.

#### Example
```
GET /msb-admin/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```

### Response
```
{
  "msb": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "name": "FinTech Solutions Ltd",
    "domain": "banking.fintechsolutions.com",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#1e40af",
    "secondary_color": "#059669",
    "accent_color": "#dc2626",
    "theme": "dark",
    ...
  }
}
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
