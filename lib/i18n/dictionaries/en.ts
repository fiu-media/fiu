// All UI copy lives here. The brand slogan is deliberately absent: it stays Irish in every language.
export const en = {
  site: {
    name: "Fiú Media",
    description: "Más fiú é a dhéanamh, is fiú é a dhéanamh i gceart.",
  },
  common: {
    loading: "Loading…",
  },
  nav: {
    label: "Primary",
    home: "Fiú Media, home",
    menu: "Menu",
    closeMenu: "Close menu",
    language: "Language",
    about: "About Us",
    work: "Our Work",
    talent: "Talent",
    rentals: "Rentals",
    contact: "Contact",
  },
  home: {
    aboutCta: "About Us",
    workCta: "All work",
  },
  slides: {
    label: "{title}, {index} of {total}",
  },
  contactLinks: {
    email: "Email",
    instagram: "Instagram",
  },
  notFound: {
    eyebrow: "404",
    heading: "Page not found",
    body: "That page doesn’t exist, or it has moved.",
    home: "Back home",
    backTo: "Back to {section}",
  },
  footer: {
    copyright: "Fiú Media © {year}",
    privacy: "Privacy",
  },
  vimeo: {
    // `play` is the visible label; `playTitle` is the accessible name, which says which film.
    play: "Play",
    playTitle: "Play {title}",
    stop: "Stop video",
  },
  privacy: {
    title: "Privacy",
    updated: "Last updated {date}",
    intro:
      "This page explains what personal data this website collects, why, who handles it for us, and what your rights are. We collect very little, and we don't use advertising or tracking cookies.",
    who: {
      heading: "Who we are",
      body: "This website is run by Fiu Media Limited, trading as Fiú Media. It is a private company registered in Ireland. Fiu Media Limited is the controller of the personal data described on this page, which means we decide how and why it is used.",
    },
    collect: {
      heading: "What we collect",
      body: "Only what you send us through the contact form:",
      items: [
        "your name and email address, and your phone number if you give one",
        "what your enquiry is about (project, talent, rentals or other)",
        "the message you write",
      ],
    },
    why: {
      heading: "Why we use it",
      paragraphs: [
        "To read and answer your enquiry, and to keep a record of it. We email you a confirmation of what you sent. We don't use your details for marketing or newsletters, and we don't sell or share them for anyone else's use.",
        "The legal basis is our legitimate interest in replying to people who contact us, and, where you're asking about work or hire, taking steps at your request before a contract.",
      ],
    },
    providers: {
      heading: "Who handles it for us",
      body: "We use a few services to run the site. They process data only on our behalf. Each link below goes to the part of their policy that covers visitors to a site like ours, not people with an account on their platform.",
      items: [
        {
          name: "Sanity",
          purpose: "Stores the enquiries you send, and the content of this site.",
          links: [
            {
              label: "Privacy policy (see “Information within content owned by our users”)",
              href: "https://www.sanity.io/legal/privacy",
            },
          ],
        },
        {
          name: "Resend",
          purpose:
            "Sends our emails (the notification to us and the confirmation to you) and keeps your name, email address and phone number as a contact record. You're not subscribed to anything.",
          links: [
            { label: "Data processing addendum (covers the people our emails go to)", href: "https://resend.com/legal/dpa" },
          ],
        },
        {
          name: "Vercel",
          purpose:
            "Hosts the site, so it handles the IP address of every request. It also checks that form submissions come from a person rather than a bot, and measures page views and loading speed without cookies. Its analytics tell visitors apart only by a hash of the request, which it discards after 24 hours.",
          links: [
            { label: "Web Analytics privacy", href: "https://vercel.com/docs/analytics/privacy-policy" },
            { label: "Speed Insights privacy", href: "https://vercel.com/docs/speed-insights/privacy-policy" },
            { label: "How BotID checks visitors", href: "https://vercel.com/docs/botid" },
          ],
        },
        {
          name: "Vimeo",
          purpose:
            "Plays our films and the short previews of them. We ask Vimeo not to track you, and it then blocks its session data and analytics. Your browser still connects to Vimeo when a film or preview loads, and Vimeo sets a few security cookies (listed below).",
          links: [
            { label: "Player cookies", href: "https://help.vimeo.com/hc/en-us/articles/26080940921361" },
            { label: "Privacy policy", href: "https://vimeo.com/privacy" },
          ],
        },
      ],
    },
    storage: {
      heading: "Cookies and local storage",
      body: "Nothing here is used for advertising or to follow you across sites. The site stores these in your browser:",
      ours: "Set by this site",
      theirs: "Set by Vimeo, only when a film or preview loads",
      items: [
        {
          name: "fiu-lang",
          type: "Cookie",
          lasts: "Kept for 1 year",
          description: "Remembers the language you chose with the language switcher. Only set once you choose one.",
        },
        {
          name: "fiu:logo-tier:v2",
          type: "Local storage",
          lasts: "Kept for 7 days",
          description:
            "Notes that your device was too slow for the 3D logo, so the next visit skips it. Only set if that happens.",
        },
      ],
      vimeoItems: [
        {
          name: "player_clearance",
          type: "Cookie",
          lasts: "Kept for 7 days",
          description: "Vimeo's bot prevention.",
        },
        {
          name: "cf_clearance",
          type: "Cookie",
          lasts: "Kept for 1 year",
          description: "Cloudflare's bot prevention, for Vimeo.",
        },
        {
          name: "_cf_bm",
          type: "Cookie",
          lasts: "Kept for 30 minutes",
          description: "Cloudflare's bot manager, for Vimeo.",
        },
        {
          name: "_cfuvid",
          type: "Cookie",
          lasts: "Until you close your browser",
          description: "Cloudflare's rate limiting, for Vimeo.",
        },
      ],
    },
    retention: {
      heading: "How long we keep it",
      body: "We keep an enquiry for 24 months after we last heard from you, then we delete it. You can ask us to delete it sooner, and we will within one month.",
      records:
        "If an enquiry leads to work or a rental, the invoices and contracts that follow are business records, and we keep those for the six years Irish company and tax law requires.",
      providersBody:
        "When we delete something, copies can stay in our providers' systems until they expire on their own. This is how long:",
      items: [
        {
          name: "Sanity",
          text: "Deleted enquiries are removed from its history when we delete them, but copies can remain in its cloud infrastructure for up to 180 days.",
        },
        {
          name: "Resend",
          text: "Keeps the emails it sent for us, including their content, for about 30 days.",
        },
        {
          name: "Vercel",
          text: "Keeps the site's server logs for about a day, and its anonymous page-view statistics for about 12 months.",
        },
        {
          name: "Our own email",
          text: "Copies of enquiries in our mailbox are deleted at the same 24-month mark.",
        },
      ],
    },
    transfers: {
      heading: "Outside the EU",
      body: "Some of the services above are based, or have staff and servers, outside the European Economic Area. They are responsible for protecting the data they handle under their own terms and the safeguards the law requires.",
    },
    rights: {
      heading: "Your rights",
      body: "You can ask us to show you the data we hold about you, correct it, delete it, or restrict or stop how we use it, and you can ask for a copy to take elsewhere. You can also object to our use of it.",
      complaint:
        "If you're unhappy with how we've handled your data, you can complain to the {authority}, Ireland's data protection authority. If you live in another EU country, you can also complain to your own country's data protection authority.",
      authority: "Data Protection Commission",
    },
    contactHeading: "Contact us",
    contactBody: "To use any of these rights, or to ask us anything about this page, get in touch:",
    contactForm: "Use the contact form",
    opensInNewTab: "opens in a new tab",
  },
  about: {
    title: "About",
    teamHeading: "The team",
  },
  work: {
    title: "Our Work",
    filterLabel: "Filter by project type",
    all: "All",
    empty: "No projects of this type yet.",
    emptyAll: "Our work is being added. Check back soon.",
    credits: "Credits",
    stills: "Stills",
    openStill: "View still {n} of {total}",
    closeStill: "Close",
    previousStill: "Previous still",
    nextStill: "Next still",
    stillCounter: "{n} of {total}",
    next: "Next project",
    back: "All work",
    view: "View project",
    progressLabel: "Projects",
    goTo: "Go to {title}",
  },
  talent: {
    title: "Talent",
    empty: "Our roster is being updated.",
    indexLabel: "Our talent",
    showreel: "Showreel",
    projects: "Projects",
    projectsOf: "{name}'s work",
    noPortrait: "Portrait coming soon",
    back: "All talent",
  },
  rentals: {
    title: "Rentals",
    filterLabel: "Filter by category",
    allCategories: "All",
    empty: "Nothing in this category yet.",
    emptyCatalogue: "Our kit list is being updated. Get in touch and we'll help with what you need.",
    addToQuote: "Add to quote",
    inQuote: "In quote ({qty})",
    maxReached: "Maximum in quote",
    available: "{max} available",
    viewDetails: "Details",
    backToRentals: "All rentals",
    noImage: "Photo coming soon",
    galleryLabel: "Photos of {name}",
    // The large photo, which takes focus so the arrow keys can step through the photos.
    largePhoto: "Large photo",
    showImage: "Show photo {n} of {total}",
    photoOf: "Photo {n} of {total}",
    previousImage: "Previous photo",
    nextImage: "Next photo",
    keyFeatures: "Key features",
    specs: "Specs",
    includedInKit: "Included in kit",
    quantity: "Quantity",
    fewer: "One fewer",
    more: "One more",
    notFoundTitle: "Rental item",
  },
  basket: {
    open: "Open quote basket",
    openWithCount: "Open quote basket, {count, plural, one {# item} other {# items}} in quote",
    title: "Your quote",
    empty: "Your quote is empty. Add gear from the catalogue.",
    close: "Close quote basket",
    review: "Review and send",
    remove: "Remove {name}",
    increase: "Add one more {name}",
    decrease: "Remove one {name}",
    quantityOf: "Quantity of {name}",
    unknownItem: "Item no longer available",
  },
  quote: {
    title: "Request a quote",
    itemsHeading: "Your kit",
    emptyBasket: "Your quote is empty.",
    browse: "Browse rentals",
    datesHeading: "Hire dates",
    startDate: "Pick-up",
    endDate: "Return",
    contactHeading: "Your details",
    company: "Company",
    production: "Production",
    message: "Anything else we should know?",
    copyLink: "Copy link",
    shareLink: "Share link",
    shareTitle: "Quote from Fiú Media",
    linkCopied: "Link copied",
    linkCopyFailed: "Couldn't copy automatically. Copy this link:",
    copyLinkHint: "The link includes the kit, dates, company and production, but not your contact details.",
    placeholders: {
      company: "Murphy Pictures",
      production: "Working title of the shoot",
      message: "Location, crew size, anything that affects the kit",
    },
    submit: "Send quote request",
    successTitle: "Request sent",
    successBody: "Thanks, we've received your quote request and sent a confirmation to your email. We'll be in touch soon.",
    successBodyNoEmail:
      "Thanks, we've received your quote request. We can't email a confirmation to that address, but we'll be in touch soon.",
    successAction: "Back to rentals",
  },
  contact: {
    title: "Contact",
    enquiryType: "What's this about?",
    enquiryTypes: { Project: "A project", Talent: "Our talent", Rentals: "Rentals", Other: "Something else" },
    message: "Message",
    placeholders: {
      message: "Tell us about your project, or what you're looking for",
    },
    submit: "Send message",
    successTitle: "Message sent",
    successBody: "Thanks for getting in touch. We've sent a copy to your email, and we'll reply as soon as we can.",
    successBodyNoEmail: "Thanks for getting in touch. We can't email a copy to that address, but we'll reply as soon as we can.",
    directHeading: "Or reach us directly",
  },
  forms: {
    // Labels and example text both forms (contact, quote) share.
    fields: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      phoneCountry: "Phone number country",
      optional: "optional",
      sending: "Sending…",
      placeholders: {
        name: "Aoife Murphy",
        email: "name@example.com",
      },
    },
    errorSummary: "Please check the highlighted fields",
    errors: {
      required: "This field is required.",
      invalid: "Please check this value.",
      emailInvalid: "Enter an email address like name@example.com.",
      phoneInvalid: "Enter a valid phone number for the selected country.",
      dateInvalid: "Choose a date.",
      tooLong: "That's too long. Please shorten it.",
      empty: "Add at least one item to your quote.",
      beforeStart: "Return must be on or after pick-up.",
      past: "Pick-up can't be in the past.",
      tooFar: "Pick-up can't be more than two years away.",
      hireTooLong: "A hire can't run longer than a year. For longer hires, email us.",
      overLimit: "Some quantities are over the maximum we can offer. Please review the quantities in your quote.",
      unavailable: "Some items in your quote are no longer available. Remove the ones marked below and try again.",
      rejected: "We couldn't verify this submission. Please try again.",
      failed: "Something went wrong on our side. Please try again, or email us directly.",
    },
  },
  dates: {
    dayOne: "{count} day",
    dayMany: "{count} days",
    rangeSummary: "{range} · {duration}",
  },
  emails: {
    quoteNotify: {
      subject: "Quote request from {name} ({count, plural, one {# item} other {# items}} in quote)",
      heading: "New quote request",
      openInStudio: "Open in Studio",
    },
    quoteConfirm: {
      subject: "We've received your quote request",
      heading: "Thanks, we've got your request",
      body: "Here's what you asked for. We'll reply with availability and a quote.",
      signoff: "Fiú Media",
    },
    contactConfirm: {
      subject: "We've received your message",
      heading: "Thanks, we've got your message",
      body: "Here's a copy of what you sent. We'll reply as soon as we can.",
      signoff: "Fiú Media",
    },
    contactNotify: {
      subject: "{type} enquiry from {name}",
      heading: "New message",
      openInStudio: "Open in Studio",
    },
    labels: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      company: "Company",
      production: "Production",
      dates: "Dates",
      kit: "Kit",
      message: "Message",
      enquiryType: "Enquiry type",
    },
  },
};

export type Dictionary = typeof en;
