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

Sanity queries are built with [groqd](https://commerce.nearform.com/open-source/groqd/docs/) in `sanity/lib/queries.ts` (the builder `q` and shared image validators live in `sanity/lib/groqd.ts`). TypeGen only generates the schema types groqd uses: `sanity.types.ts` and `sanity/extract.json` are not committed, `npm run typegen` creates them, and `npm run setup`, `predev`, `prebuild` and `pretypecheck` run it automatically (so Vercel builds and CI generate them too). It needs `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` (any values will do), which the CLI reads from `.env.local`.

Every projected field has a validator, and responses are parsed against them when a query runs, so bad content fails at the fetch with the field named. Run live queries with `fetchQuery` (`sanity/lib/live.ts`) and uncached server-side ones with `runQuery` (`sanity/lib/writeClient.ts`); both return the parsed, typed result. A few notes:

- Import `z` from `sanity/lib/groqd`, not from `zod`: groqd bundles Zod 3, and the two versions' schemas are not interchangeable.
- Reusable field sets are fragments (`q.fragment(...)`), spread into projections. Where the builder has no method (merging two lists, `^.` parent references) use `raw(expression, validator)`; those expressions are validated but not checked against the schema.
- Use a nullable validator for anything that can be missing, and `.nullable(true)` on a query that can find nothing, or parsing throws instead of returning `null`.
- Keep validators plain (`z.string()`, `z.number()`, ...). In draft mode strings carry invisible stega characters, so `.url()`, `.regex()` or literals on content strings would fail there.

After changing a schema or a query, `npm run typecheck` shows what breaks.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
