This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

With the [Vercel CLI](https://vercel.com/docs/cli) installed and logged in (`vercel login`), set everything up in one go:

```bash
npm run setup   # npm install, vercel link, vercel env pull (overwrites .env.local), npm run typegen
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Sanity types

The types of Sanity query results are generated from the schema and the `defineQuery` queries in `sanity/lib/queries.ts`. `sanity.types.ts` and `sanity/extract.json` are not committed: `npm run typegen` creates them, and `npm run setup`, `predev`, `prebuild` and `pretypecheck` run it automatically (so Vercel builds and CI generate them too). It needs `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` (any values will do), which the CLI reads from `.env.local`.

After changing a schema or a query, `npm run typecheck` shows what breaks. TypeGen evaluates queries statically, so build them from string literals and the generic helpers in `queries.ts` (called with literal arguments), not from arbitrary expressions.

## Emails

The notification emails are React Email components in `emails/`, rendered by `lib/email/templates.tsx` and sent through Resend (`lib/email/send.ts`). Their copy comes from `dict.emails`. `npm run email:dev` starts a preview server with sample data; keep `server-only` and `@/` imports out of `emails/` so it can load them.

## Environment variables

`env.ts` is the one place configuration is read and validated (`@t3-oss/env-nextjs`). `next.config.ts` imports it, so `next build` and `next dev` fail with a list of what's wrong instead of losing a form submission later. Import `env` from `@/env` rather than reading `process.env`; the exceptions are `NODE_ENV`/`CI` and the standalone tooling (`scripts/`, `e2e/global-teardown.ts`, `sanity.cli.ts`, `playwright.config.ts`), which run outside Next and check their own variables.

- Always required: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`.
- Required when `VERCEL_ENV=production`: `SANITY_API_WRITE_TOKEN`, `RESEND_API_KEY`. Previews and local runs may omit them (email is then logged and skipped).
- Optional: `SANITY_API_READ_TOKEN`, `EMAIL_FROM`, `QUOTE_TO_EMAIL`, `NEXT_PUBLIC_SITE_URL`.
- Empty values count as unset. `SKIP_ENV_VALIDATION=1` skips the checks for a deliberately secret-less build.
- Server-only variables throw if read from client code, but `env.ts` itself stays importable from the browser for the `NEXT_PUBLIC_*` values.

## Tests

```bash
npm test          # Vitest unit tests: logic, schemas, server actions (Sanity, BotID and Resend mocked)
npm run test:e2e  # Playwright + axe against a production build
```

Unit tests sit next to the code they cover (`*.test.ts`) and need no setup.

The e2e tests drive a real browser through the quote request, the contact form and the mobile menu, and run axe on the public pages. They read the `dev` Sanity dataset (see `npm run sync:dev`) and submit real forms to it, so they need `.env.local` with `NEXT_PUBLIC_SANITY_DATASET=dev` and an Editor token in `SANITY_API_WRITE_TOKEN`. First time only: `npx playwright install chromium`.

```bash
npm run build && npm run test:e2e   # Playwright starts `npm run start` itself
```

- Every submission uses an `@example.test` address. When the run ends, `e2e/global-teardown.ts` deletes the quote requests and contact messages with such an address, and does nothing unless the dataset is `dev`.
- No email is sent: the server runs without `RESEND_API_KEY`.
- BotID can't verify a production build outside Vercel, so Playwright starts the server with `E2E_BYPASS_BOTID=1` (see `lib/forms/submit.ts`). Never set that in a deployed environment.
- Axe runs on the public pages and any violation fails the test; there is no allowlist.
- CI runs the e2e job against `dev` when the repository secrets exist (`SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`) and the `NEXT_PUBLIC_SANITY_PROJECT_ID` variable; it is skipped on fork and Dependabot PRs.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
