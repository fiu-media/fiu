# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people who commission work (brands, agencies, broadcasters) deciding whether Fiú Media should make their next film. They look at the work, check the credits and stills, then get in touch through Contact.

Secondary: people booking someone from the talent roster (Contact with type Talent). Later: production crews hiring gear, once Rentals comes back.

Editors: a non-technical in-house team that runs all content in Sanity Studio, including Presentation/visual editing.

## Product Purpose

The public site for Fiú Media, an Irish media company. It covers its own productions, client and commercial work, a talent roster, and a gear rental house. Success: a commissioning client sees work that convinces them and sends an enquiry. Talent and rental enquiries come in the same way, through forms, never through payments.

## Positioning

Craft and care, in an Irish voice. The brand line "Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart" ("if it's worth doing, it's worth doing right") is the claim, and it stays in Irish in every language. The site has to show that care in how it is built, not just say it.

## Operating Context

- Visitors judge Fiú by watching films (Vimeo) and looking through stills. Each project has a type, client, year, description, credits linked to roster talent, and separate landscape (desktop) and portrait (mobile) stills.
- Talent profiles have a name, roles, a bio, availability, a showreel, and the projects they worked on.
- Enquiries go through the contact form (Project / Talent / Rentals / Other). Rentals uses a quote basket with hire dates and no public prices. Forms send a Resend notification to the studio and a confirmation to the visitor. Deep links can prefill parts of a form (see `lib/forms/prefill.ts`).
- Navigation: About, Our Work, Talent, Rentals, Contact. Rentals is hidden for now (`features.rentals` in `lib/features.ts`).

## Capabilities and Constraints

- Next.js 16 App Router on Vercel, Sanity CMS (Studio hosted at fiu.sanity.studio), Vimeo video, Resend email, BotID on forms, cookieless Vercel Analytics.
- English first, built so Irish (`/ga`) can follow. All UI copy lives in `lib/i18n/dictionaries`, and editors write page lines per language in Site settings.
- Privacy: there are no advertising or tracking cookies, and Vimeo runs with do-not-track. Any new tracking or third-party service must be added to the Privacy page.
- Every content area must handle being empty ("being added, check back soon") and missing images ("Portrait coming soon").
- The live 3D logo falls back on weak devices (`fiu:logo-tier:v2`).
- Undecided: when Rentals launches; when the Irish translation ships.

## Brand Commitments

- Name: Fiú Media. Legal entity: Fiu Media Limited, registered in Ireland.
- The slogan stays in Irish in every language. An optional gloss can be added per language.
- The logo mark is the clear-acrylic glass logo from `design/fiu-logo-glass.blend`, rendered live, with avatar marks in `design/avatar/`.
- Voice (from the shipped copy): plain, warm, direct and short. No hype, and everything addressed to "you". Each page can carry a playful "Fiú line" under its title.
- The owner wants a say in design decisions. The original Canva draft wasn't made by a designer, so treat it as a starting point, not a spec.

## Evidence on Hand

- Projects (films, stills, credits, clients, years), the talent roster, team photo and manifesto, and the rental catalogue, all in Sanity. The organised source assets are in `~/Downloads/Fiu Assets`.
- Brand references are in `design/refs/`.
- Client names and logos may be shown, but only ones the client has cleared. Client names are already stored per project (`project.client`). There is no logo field or logo asset in the repo yet, so they need to be supplied.
- There are no awards, festival selections, press coverage or testimonials. Don't invent or suggest any.

## Product Principles

1. The work persuades. Films and stills come first, and the interface stays out of their way.
2. Done properly or not at all: every detail, including empty states, errors and emails, follows the slogan.
3. Irish at heart and open to everyone: the Irish identity is real and visible, and nobody needs Irish to use the site.
4. Editors stay in charge. Content lives in Sanity, so non-technical editors can run it without a developer.
5. Respect visitors: collect little, track nothing that follows people around, and say plainly what is collected.

## Accessibility & Inclusion

WCAG 2.1 AA. Axe runs in CI on every public page with its default rule set (`e2e/a11y.spec.ts`), and a pass there is the minimum, not the full check. Respect reduced motion and give a fallback for the 3D logo on low-power devices.
