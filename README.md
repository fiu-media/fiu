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

## Studio

The Studio is hosted by Sanity at https://fiu.sanity.studio (it opens inside the Sanity dashboard), not in this app. It auto-updates its Sanity packages (`deployment.autoUpdates` in `sanity.cli.ts`), but our schemas, structure and plugins only change when it is deployed: `.github/workflows/deploy-studio.yml` does that on every merge to `main` that touches `sanity/`, using the `SANITY_AUTH_TOKEN` secret (a project token with the `deploy-studio` role). To deploy by hand: `npx sanity deploy`.

- It is built by Sanity's tooling, so it reads `sanity/studio-env.ts` (`SANITY_STUDIO_*` variables) rather than `@/env`. Keep `next/*`, `server-only` and `@/` imports out of everything `sanity.config.ts` pulls in.
- Presentation previews the live site (`previewOrigin` in `sanity/studio-env.ts`). The site's draft-mode route sets partitioned cookies, so the preview works inside the Studio's frame.
- Sign in with Google, GitHub or email. The Vercel sign-in is hidden: it goes through the integration's SSO and ends on sanity.io instead of the Studio.
- `sanity dev` runs it locally; add `http://localhost:3333` to the project's CORS origins if it isn't there.

## Sanity types

The types of Sanity query results are generated from the schema and the `defineQuery` queries in `sanity/lib/queries.ts`. `sanity.types.ts` and `sanity/extract.json` are not committed: `npm run typegen` creates them, and `npm run setup`, `predev`, `prebuild` and `pretypecheck` run it automatically (so Vercel builds and CI generate them too). It needs `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` (any values will do), which the CLI reads from `.env.local`.

After changing a schema or a query, `npm run typecheck` shows what breaks. TypeGen evaluates queries statically, so build them from string literals and the generic helpers in `queries.ts` (called with literal arguments), not from arbitrary expressions.

## Emails

The notification emails are React Email components in `emails/`, rendered by `lib/email/templates.tsx` and sent through Resend (`lib/email/send.ts`). Their copy comes from `dict.emails`. `npm run email:dev` starts a preview server with sample data; keep `server-only` and `@/` imports out of `emails/` so it can load them.

## Environment variables

`env.ts` is the one place configuration is read and validated (`@t3-oss/env-nextjs`). `next.config.ts` imports it, so `next build` and `next dev` fail with a list of what's wrong instead of losing a form submission later. Import `env` from `@/env` rather than reading `process.env`; the exceptions are `NODE_ENV`/`CI` and the standalone tooling (`scripts/`, `e2e/global-teardown.ts`, `sanity.cli.ts`, `playwright.config.ts`), which run outside Next and check their own variables.

- Always required: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`.
- Required when `VERCEL_ENV=production`: `SANITY_API_WRITE_TOKEN`, `RESEND_API_KEY`, `RESEND_EMAIL_DOMAIN` (the last two come from the Resend integration on Vercel; mail is sent from `hello@` that domain, written as punycode if it is internationalised, so `fiú.ie` and `xn--fi-ska.ie` both work). Previews and local runs may omit them (email is then logged and skipped).
- Optional: `SANITY_API_READ_TOKEN`, `NEXT_PUBLIC_SITE_URL`.
- Notification recipients are not environment variables: editors set the Contact email and Quote request recipient in Site settings. With neither set, the notification is skipped (the visitor's confirmation is still sent).
- Empty values count as unset. `SKIP_ENV_VALIDATION=1` skips the checks for a deliberately secret-less build.
- Server-only variables throw if read from client code, but `env.ts` itself stays importable from the browser for the `NEXT_PUBLIC_*` values.

## Deep links into the forms

> **Rentals is hidden for now.** Its routes live in the private folder `app/(site)/[lang]/(adaptive)/_rentals`, so `/rentals*` returns a 404 and the nav has no Rentals link. Everything else (components, Sanity schema, quote actions, emails, form helpers) is still in place. To bring it back, follow the note at the top of `_rentals/layout.tsx`.

Links can open the contact and quote forms prefilled. The parameters, how each is validated, and why name, email, phone and message are never read from a URL (they would end up in logs, analytics and Referer headers) are documented in [`lib/forms/prefill.ts`](lib/forms/prefill.ts), which also has the link builders (`contactHref`, `quoteHref`). Use those rather than assembling a query string by hand. The quote form has a "Copy link to this quote" button that builds such a link from the visitor's kit, dates, company and production.

- `/contact?type=Talent`
- `/rentals/quote?pickup=YYYY-MM-DD&return=YYYY-MM-DD&company=…&production=…&item=<slug>[:qty]`

## Rate limiting

`/contact` and `/rentals/quote` are protected by BotID and a honeypot, but neither caps volume, so a single client could still flood the Sanity inbox and the Resend emails (the quote form also emails the visitor). A Vercel Firewall rate-limit rule covers that. It blocks before any function runs, so there is no code for it in this repo. `vercel.json` can't hold it either (routes there only support `deny` and `challenge`), so the rule lives in the Vercel project's firewall and has to be created there once:

```bash
vercel firewall rules add "Rate limit form submissions" \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --condition '{"type":"path","op":"re","value":"^(/ga)?/(contact|rentals/quote)/?$"}' \
  --action rate_limit --rate-limit-window 600 --rate-limit-requests 10 \
  --rate-limit-keys ip --rate-limit-action rate_limit \
  --description "Caps contact and quote submissions per IP" --yes
vercel firewall diff      # check the staged change
vercel firewall publish   # make it live
```

That allows 10 submissions per IP per 10 minutes and answers the rest with a 429 until the window resets. Every POST counts, including ones that fail validation, so the limit is deliberately generous: fixing a typo and resubmitting still works.

Things to know:

- Visitors over the limit see Vercel's generic block page, not the localised form error.
- Shared IPs (offices, mobile carriers) share one allowance. Raise `--rate-limit-requests` if that bites.
- The regex already covers the `/ga/...` paths, ready for when Irish is enabled.
- The rule is project configuration, not code: recreate it if the project is re-created or moved to another team. Rate-limit rules may depend on the Vercel plan.
- Inspect or adjust it with `vercel firewall rules inspect|edit|disable "Rate limit form submissions"`, and see blocked traffic with `vercel firewall overview`.

## Tests

```bash
npm test          # Vitest unit tests: logic, schemas, server actions (Sanity, BotID and Resend mocked)
npm run test:e2e  # Playwright + axe against a production build
```

Unit tests sit next to the code they cover (`*.test.ts`) and need no setup.

The e2e tests drive a real browser through the quote request, the contact form and the mobile menu, and run axe on the public pages. They run against the `dev` Sanity dataset and don't depend on what is in it: the suite creates the content it needs (rental items, talent, a project and their photos, all with ids starting `e2e-`, listed in `e2e/fixtures/data.ts`), acts on that, and removes it again. They submit real forms, so they need `.env.local` with `NEXT_PUBLIC_SANITY_DATASET=dev` and an Editor token in `SANITY_API_WRITE_TOKEN`. First time only: `npx playwright install chromium`.

```bash
npm run test:e2e   # seeds the content, builds the site, starts it, runs the tests, then cleans up
```

- The content is written before `next build`, because the pages read it at build time and keep it until Sanity reports a change. That is why Playwright's web server command (`npm run e2e:serve`) seeds, builds and starts in that order, and why a server that is already running is never reused: it wouldn't have this run's content.
- Tests use the fixtures by slug (`rentalItems.multi.slug`, `featuredTalent.path`, ...) and never "the first item on the page". Add what a new test needs to `e2e/fixtures/data.ts` and `documents.ts`.
- `e2e/fixtures/cleanup.ts` removes the fixtures, the images they uploaded (labelled `e2e-fixture`) and the submissions the tests made, and nothing else. It also runs before seeding, so a crashed run's leftovers don't pile up. It, and the seeding, refuse any dataset except `dev` (or `dev-…`).

- Every submission uses an `@example.test` address, which is how cleanup finds the quote requests and contact messages the tests sent.
- No email is sent: the server runs without `RESEND_API_KEY`.
- BotID can't verify a production build outside Vercel, so Playwright starts the server with `E2E_BYPASS_BOTID=1` (see `lib/forms/submit.ts`). Never set that in a deployed environment.
- Axe runs on the public pages and any violation fails the test; there is no allowlist.
- CI runs the e2e job against `dev` when the repository secrets exist (`SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`) and the `NEXT_PUBLIC_SANITY_PROJECT_ID` variable; it is skipped on fork and Dependabot PRs. The `dev` dataset must be public, like production, because the site reads published content without a token.

## Formatting and class names

Prettier formats everything (`npm run format`; CI runs `npm run format:check`, and lint-staged formats staged files on commit). `prettier-plugin-tailwindcss` sorts Tailwind classes, including those inside `cn()`.

Compose class names with `cn()` from `lib/cn.ts` (clsx + tailwind-merge). In a shared component, `cn("base classes", className)` lets the caller's classes win over the defaults, so pass `size-10 px-0` rather than `size-10! px-0!`.

The one-off reformat commit is listed in `.git-blame-ignore-revs`. GitHub honours it automatically; locally run `git config blame.ignoreRevsFile .git-blame-ignore-revs`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
