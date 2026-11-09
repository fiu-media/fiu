---
name: Fiú Media
description: A dark screening room for Irish film work, with clear-acrylic glass controls and a soft Fraunces voice.
colors:
  ink: "#0c0b0d"
  paper: "#f4f1ec"
  surface-raised: "#17151a"
  text: "#f2eee8"
  text-muted: "#a39da8"
  line: "rgb(255 255 255 / 0.12)"
  skeleton: "#24222a"
  signal-red: "#ff5a6e"
  on-signal: "#0c0b0d"
  focus-blue: "#8ab4ff"
  glass-tint: "rgb(255 255 255 / 0.015)"
  glass-tint-strong: "rgb(255 255 255 / 0.07)"
  glass-edge: "rgb(255 255 255 / 0.24)"
  on-image: "#ffffff"
  scrim: "#000000"
typography:
  display:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "6rem"
    fontWeight: 450
    lineHeight: 1.02
    letterSpacing: "-0.03em"
    fontVariation: '"SOFT" 100, "opsz" 144'
  headline:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "3.75rem"
    fontWeight: 450
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontVariation: '"SOFT" 100, "opsz" 144'
  tagline:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 450
    lineHeight: 1.2
    letterSpacing: "-0.03em"
    fontVariation: '"SOFT" 100, "opsz" 144'
  title:
    fontFamily: "Fraunces, ui-serif, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 450
    lineHeight: 1.33
    letterSpacing: "-0.03em"
    fontVariation: '"SOFT" 100, "opsz" 144'
  body-lead:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
  button-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  eyebrow:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.14em"
rounded:
  thumb: "12px"
  control: "16px"
  card: "24px"
  panel: "28px"
  pill: "9999px"
spacing:
  gutter-sm: "20px"
  gutter-md: "40px"
  rail: "64px"
  content-max: "1152px"
  prose-max: "65ch"
components:
  button-pill:
    backgroundColor: "{colors.glass-tint}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 20px"
  button-pill-hover:
    backgroundColor: "{colors.glass-tint-strong}"
  button-pill-sm:
    backgroundColor: "{colors.glass-tint}"
    textColor: "{colors.text}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 14px"
  button-pill-lg:
    backgroundColor: "{colors.glass-tint}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 28px"
  filter-pill-current:
    backgroundColor: "{colors.glass-tint-strong}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 14px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  nav-rail:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    width: "{spacing.rail}"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
  count-badge:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.pill}"
---

# Design System: Fiú Media

## Overview

**Creative North Star: "The Screening Room"**

The site is a dark room built for watching. Films and stills run edge to edge and supply all the colour. The interface is the house lighting: low, warm and steady, with just enough light to find your seat. Every page is dark whatever the visitor's OS setting, and the browser chrome is tinted to match (`#0c0b0d`). The chrome steps back so the footage can lead, and the care shows in small finished details: a three-pixel dot under the current filter, a glint that follows the pointer across a pill, a caption that sits exactly in line with the logo.

The mood is cinematic, quiet and warm. Warmth comes from the type, not from colour. Fraunces is set soft (SOFT 100, optical size 144), and its italic carries the brand's voice: the Irish slogan, the playful "Fiú line" under each page title, project titles and talent names. Manrope does the work around it, upright and plain. The one material is clear acrylic, matching the live glass logo. It has no tint and no frost, and you see it only through a thin grey edge, a faint bevel and a moving glint.

Confirmed rejections: old-fashioned ornament in the UI (swashes, diamond markers, leaning shapes, italic nav); frosted or tinted glassmorphism; the agency-template look (gradient blobs, bento grids, big stat counters); bright colour accents in the chrome.

**Key Characteristics:**

- Always dark. Near-black Ink page with warm off-white type.
- Footage runs full-bleed, one project per screen, with scroll-snap.
- Clear-acrylic glass is the only material, and the only thing that rises off the page.
- Fraunces italic for the brand voice; upright Manrope for anything you operate.
- A 64px left rail on desktop. On phones, a floating bar with the logo and a glass menu button.
- Motion settles like a weighted object, with no bounce, and all of it turns off under reduced motion.

## Colors

The chrome uses near-black, warm off-white and greys only. The one colour accent, Signal Red, is kept for errors and counts.

### Primary

- **Ink** (`ink`): the page background on every surface and the colour of the browser chrome. A very slightly violet near-black, so that warm footage glows against it rather than sitting on flat grey.
- **Paper** (`paper`): the warm off-white of the brand, used as the page background when a surface is pinned to the light scheme. Text on dark is its slightly brighter sibling, `text`.

### Secondary

- **Signal Red** (`signal-red`): error borders, error messages, the error summary and the quote-basket count badge. It is too light on dark for white text to pass AA, so anything filled with it takes Ink text (`on-signal`). In the light scheme it deepens to `#a3122a`.

### Neutral

- **Raised Ink** (`surface-raised`): the fill of form controls, rental cards, image placeholders and the error summary. It shows a control is there; it doesn't put content on a layer.
- **Screen White** (`text`): headings and body text on dark.
- **Muted Grey** (`text-muted`): intros, taglines, footer, optional-field hints, the rail's inactive labels (at 60% white), placeholders at 70%.
- **Hairline** (`line`): 12% white rules. Control borders, the rail's edge, rows in the talent index.
- **Skeleton** (`skeleton`): loading blocks, pulsing only when motion is allowed.
- **On Image** (`on-image`): type and marks over footage: slide titles and captions (80% for meta lines, 65% for roles), the About slogan, the lightbox, progress ticks. Over footage the scheme never applies, so this is always white.
- **Scrim** (`scrim`): the black that darkens footage under anything placed on it: caption gradients (75% at the foot), the top-of-frame fade on slides (45%), the phone bar's fade (50%), lightbox and drawer backdrops.
- **Focus Blue** (`focus-blue`): the 2px focus ring, offset 3px, on every focusable element. Composite fields (phone, combobox) ring the whole field instead of the inner input.

### Named Rules

**The Footage Is the Colour Rule.** Colour on screen comes from the films and stills. The chrome stays Ink, white and grey. Signal Red marks an error or a count and nothing else: no red links, no red buttons, no red decoration.

**The Scrim Rule.** Nothing light sits on footage without a Scrim under it, and the Scrim is light falling off, never a band: soft gradients that fade to nothing, no hard edges, no opaque strips. Text over imagery must hold 4.5:1 against the brightest frame it can land on, and icons 3:1; the scrim, not a text shadow, is what guarantees it. Where the footage is usually dark enough on its own, the Scrim can be adaptive: measured per still and applied only to the frames that need it (the rail over Home's hero, see Navigation).

**The Light-Dark Rule.** Every colour token is declared with `light-dark()` and re-declared on each `[data-surface]` element, so a surface can be pinned to light without any JS. New colours follow the same pattern; never hard-code a dark-only value on an adaptive surface.

## Typography

**Display Font:** Fraunces (with ui-serif, Georgia, serif), variable, SOFT 100, opsz 144, weight 450, tracking -0.03em
**Body Font:** Manrope (with ui-sans-serif, system-ui, sans-serif)

**Character:** Fraunces is soft and slightly old-world. In italic it reads as a warm, handwritten-feeling voice. Manrope is a clean, modern grotesk that keeps the controls plain. The contrast between the two is the whole typographic idea.

### Hierarchy

- **Display** (`display`; 3rem on phones to 6rem from `md`, line-height 1.02, italic): the Irish slogan over the About still. Project titles on full-bleed slides use the same voice at 2.25rem to 4.5rem.
- **Headline** (`headline`; 3rem to 3.75rem, upright): each page's `<h1>` ("Our Work", "Talent", "Contact").
- **Tagline** (`tagline`; 1.5rem to 1.875rem, italic, Muted Grey): the playful "Fiú line" under a page title ("Fiú Reels", "Fiú Faces"). It is hidden from assistive tech, and "Fiú" is marked `lang="ga"`.
- **Title** (`title`; 1.5rem to 3rem): section headings such as "Or reach us directly" and "The team". Talent names in the index are italic, 1.875rem to 3.75rem.
- **Body lead** (`body-lead`; 1.125rem, line-height 1.625, Muted Grey): the intro line under a page title, max 42rem. Manifesto and project descriptions step up to 1.25rem to 1.5rem, max `65ch`.
- **Body** (`body`): form controls, captions and general text.
- **Button** (`button`, `button-sm`; 600, 0.9375rem, or 0.8125rem on small pills and 1rem on large ones): every glass pill.
- **Label** (`label`; 0.875rem, 500): form labels and the rail's vertical nav labels.
- **Eyebrow** (`eyebrow`; 0.75rem, 500, 0.14em tracking, uppercase, Muted Grey): small spaced capitals above a heading, such as roles or "404".

### Named Rules

**The Upright Chrome Rule.** Italic Fraunces is for content: the slogan, taglines, project titles, talent names. Anything you operate (nav, pills, labels, fields, footer) is upright Manrope. The one exception is the full-screen phone menu, whose links are upright Fraunces at 3rem.

**The Irish Stays Irish Rule.** The slogan is set in Irish in every language, with an optional gloss below it in Manrope. Never translate it in the display line.

## Layout

On desktop (from `md`, 768px) a 64px rail is fixed down the left edge. It holds the logo at the top, the nav labels in the middle, and the language switcher at the bottom. The labels are set vertically (rotated, reading bottom to top), and a faint column of sprocket ticks runs down the rail's inner edge, its one nod to film. Content starts beside the rail with a 40px gutter (20px on phones), centred within 1152px.

On phones the rail becomes a top bar: the logo on the left, a 40px glass Menu button on the right. On cinematic pages the bar floats over the footage; on adaptive pages it takes its own row. The menu opens as a full-screen, opaque Ink overlay with large Fraunces links.

On Home the first screen is the still alone, fitted to the viewport, with no fade: on desktop the hero ends in a hard edge at the fold, and phones dissolve into Ink over the 12rem bleed below it. Other seams (fade, mirror, light spill, frame edge, lights down) are kept for comparison on /dev/home-below-fold. Cinematic pages (Home, About, Work, Talent) are built from full-bleed slides that snap one per screen (`scroll-snap-type: y mandatory`). Captions sit at the bottom left, in line with the page gutter, over a Scrim gradient that darkens the frame toward the foot. Phones get portrait stills cut separately from the landscape set, not a crop of it. Adaptive pages (Contact, Privacy, later Rentals) sit in the same 1152px container. Contact splits into a 3:2 grid from `lg` (1024px): the form on the left, direct contact details on the right.

All edge padding respects `env(safe-area-inset-*)`, so nothing sits under a notch or the home indicator. The footer is one quiet row (copyright, email, Instagram, Privacy) and snaps into view at the end of a slide sequence.

## Elevation & Depth

The room is flat. Pages, slides, cards and fields have no drop shadows and no tonal layering for hierarchy. Depth belongs to one material: clear acrylic. A glass piece is drawn entirely with inset shadows (a 1px grey edge, a 2.5px faint bevel, two specular highlights at top-left and bottom-right) and a tiny outer shade so it sits on the footage. In Chromium, an SVG displacement lens bends the backdrop across the bevel only, with a touch of chromatic aberration. Other browsers get a 2px blur instead.

### Shadow Vocabulary

- **Acrylic edge** (`box-shadow: inset 0 0 0 1px var(--glass-edge), inset 0 0 0 2.5px var(--glass-bevel), inset 1px 1.5px 0.5px -0.5px var(--glass-spec), inset -1px -1.5px 0.5px -0.5px var(--glass-spec-soft), 0 2px 10px -4px var(--glass-shade)`): every glass piece and panel. Nothing else.
- **On-image legibility** (`text-shadow: 0 1px 6px rgb(0 0 0 / 0.3)`, backdrop brightness 0.88): glass and text placed over photography.

### Named Rules

**The One Lift Rule.** Only glass lifts. If something needs to stand off the page and it isn't a glass pill, button or panel, it doesn't stand off the page.

**The Clear Acrylic Rule.** Glass has no colour. The face tint stays at or under 7% white, even on hover. Small pieces blur 2px at most. Panels that carry text (drawers, forms) may frost to 12px with a 30% tint, because they have to stay readable. Under `prefers-reduced-transparency` glass becomes a 92% opaque surface.

## Shapes

The shapes are soft and rounded, but never bubbly. Pills are fully round. Form controls have 16px corners, cards and inline media (stills, portraits, team photo, rental gallery) 24px, and large glass panels 28px. Small thumbnails have 12px corners. Full-bleed footage has no corners at all; it runs to the screen edge. The 2px country flags in the phone field are the only near-square shape. The round focus dot (3px) and the round count badge are the only purely decorative circles.

## Components

### Buttons (glass pills)

Quiet acrylic, tactile under the hand.

- **Shape:** fully round, in three sizes: small (32px tall, 14px side padding), medium (40px, 20px), large (48px, 28px).
- **Tap area:** every pill carries an invisible tap area of at least 44px square, centred on it, so small pills are easy to hit without looking bigger. Rows of wrapped pills are 12px apart so those areas meet without overlapping.
- **Rest:** clear face (`glass-tint`), acrylic edge, Screen White label in 600 Manrope.
- **Hover:** the face lifts to `glass-tint-strong` and the bevel brightens. A 90px radial glint follows the pointer (`plus-lighter`, 14% white). The piece tilts toward the pointer by up to 4° vertically and 6° horizontally.
- **Press:** scales to 0.97. Everything settles on `cubic-bezier(0.2, 0.7, 0.2, 1)` over 220 to 320ms, with no overshoot.
- **On image:** forced light-on-dark, backdrop dimmed to 0.88, soft text shadow.
- **Submit:** the large pill. Mouse-down doesn't steal focus from the field being filled in.
- **Reduced motion:** no tilt, no transitions.

### Chips (filter pills)

- **Style:** small glass pills ("All", "Commercial", "Originals").
- **State:** the current filter keeps the hover face and bevel, and adds a 3px dot centred 5px above its bottom edge. The dot appears only on links that are the current page and on filter toggles, never on action buttons like "Add to quote".

### Inputs / Fields

- **Style:** Raised Ink fill, 1px Hairline border, 16px corners, 12px by 16px padding, 1rem text. The label sits above in 0.875rem 500; "(optional)" follows it in Muted Grey.
- **Placeholder:** a real example of what to type ("Aoife Murphy", "name@example.com") in Muted Grey at 70%. Empty date fields use the same grey.
- **Focus:** the global 2px Focus Blue ring, offset 3px.
- **Error:** the border turns Signal Red and a Signal Red message appears below it. An error summary panel (Raised Ink, Signal Red border, 16px corners) leads the form after a failed submit.
- **Select:** the native arrow is replaced by a small rotated-square chevron at 50% white, also used on the phone field's country picker.
- **Textarea:** grows with content between its minimum and maximum line counts, never taller than 60% of the screen, and resizes vertically only.

### Cards / Containers

- **Corner Style:** 24px.
- **Background:** Raised Ink.
- **Shadow Strategy:** none (see The One Lift Rule).
- **Border:** 1px Hairline.
- **Use:** rental items only. Projects and talent are never cards; they are full-bleed slides and an index of names.

### Navigation

- **Desktop rail:** 64px, Ink, Hairline right edge, sprocket ticks at 10% opacity. Labels are 0.875rem 500 Manrope set vertically at 60% white, full white on hover. The current page goes full white with a 1px vertical rule beside it. Where footage runs under it (Home's hero), the rail has no backdrop, so the footage keeps its light: the hairline drops away, and the labels and the language codes share one set of tones, 80% white at rest and full white for the current language and on hover, with a tight halo hugging each letter (`text-shadow` at 63%, 53%, 39% and 25% black, 1px to 18px; a matching `drop-shadow` on the logo and language codes). Under them, an adaptive edge light: the hero reads the strip of each still under the rail (in word-sized bands, so a bright patch behind one label counts) and sets `--hero-edge` to just the darkening that keeps 80% white at 4.5:1, 0 on most stills and at most about 0.62 for a white frame, fading to nothing 12rem in. It rises before a brighter still fades in and only eases off once a crossfade has finished, so it never lags. It sits in the photo layer, under the logo, so the logo is never dimmed.
- **Phone bar:** logo (36px tall) left, small glass Menu pill (40px square, 44px tap area) right. On Home, where the hero runs under the bar, a 160px Scrim fades down from 50% black behind them.
- **Phone menu:** a full-screen opaque Ink overlay (opaque so Safari tints its bars correctly). Links are upright Fraunces at 3rem, 60% white, full white when current. Content fades over 300ms. Focus is trapped, Esc closes the menu, and focus goes back to the Menu button.
- **Language switcher:** "EN" / "GA" at the foot of the rail, and inside the phone menu.

### Talent index (signature)

A list of names in large italic Fraunces divided by Hairline rules, with roles right-aligned in Muted Grey. On hover a portrait follows the pointer beside the name (12px corners, fades over 200ms, off under reduced motion). The index is typographic: names lead, and no grid of headshots.

### Project slide (signature)

A full-screen still or silent preview loop. The italic Fraunces title and a meta line (type, year, client) at 80% white sit bottom-left, with glass Play and View pills bottom-right (stacked under the title on small phones), over a 75% black gradient rising from the bottom. A gradient darkens the top of the frame for the floating bar. Play opens the Vimeo player in place. A 1-of-N counter and a column of progress ticks sit at the right edge.

## Do's and Don'ts

### Do:

- **Do** let footage fill the frame: full-bleed, no corners, one project per screen.
- **Do** build every raised control from the glass classes (`.glass`, `.glass-piece`, `.glass-interactive`) so edge, bevel, glint, tilt and press stay consistent.
- **Do** mark the current page or filter with the brighter bevel and the 3px dot, and nothing more.
- **Do** set brand voice (slogan, taglines, titles, names) in soft italic Fraunces, and everything you operate in upright Manrope.
- **Do** use `light-dark()` tokens and `data-surface` for every colour, so a surface can be pinned light.
- **Do** honour `prefers-reduced-motion` (no tilt, no drift, no pulse) and `prefers-reduced-transparency` (opaque glass).
- **Do** pad every screen edge with `env(safe-area-inset-*)`.
- **Do** put a Scrim under anything light that sits on footage, and use `on-image` / `scrim` rather than literal white and black there.
- **Do** give every control a tap area of at least 44px, even when it looks smaller.

### Don't:

- **Don't** add ornament to the chrome: no swashes, diamond markers, leaning shapes or italic nav.
- **Don't** tint or frost glass: no coloured glass, no heavy blur on pills, and nothing above 7% white on the face.
- **Don't** reach for the agency-template look: no gradient blobs, bento grids or big stat counters.
- **Don't** add bright colour to the UI. Signal Red is for errors and counts only.
- **Don't** put drop shadows on cards, images or text blocks; only glass lifts.
- **Don't** put projects or talent in card grids; they are slides and a name index.
- **Don't** translate the slogan in its display line.
