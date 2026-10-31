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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
