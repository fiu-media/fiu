import { dateLocale, type Locale } from "@/lib/i18n/config";
import { href, routes } from "@/lib/routes";
import { absoluteUrl, siteUrl } from "@/lib/siteUrl";
import { parseVimeo, vimeoEmbedUrl } from "@/lib/vimeo";

/** Stable id for the company node, so every page can point at the same entity. */
export const organizationId = () => `${siteUrl}/#organization`;

/** Stable id for the website node. */
export const websiteId = () => `${siteUrl}/#website`;

/** The company behind the trading name, as the privacy policy names it. */
export const LEGAL_NAME = "Fiu Media Limited";

const LOGO = {
  "@type": "ImageObject" as const,
  url: absoluteUrl("/brand/fiu-avatar.png"),
  width: 512,
  height: 512,
};

type BreadcrumbItem = { name: string; path: string };

/** One trail of crumbs as schema.org BreadcrumbList. Paths are locale-aware site paths. */
export function breadcrumbList(lang: Locale, items: readonly BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList" as const,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: absoluteUrl(href(lang, item.path)),
    })),
  };
}

type OrganizationInput = {
  name: string;
  description: string;
  email?: string | null | undefined;
  instagramUrl?: string | null | undefined;
};

/**
 * Who Fiú Media is: name, logo, Ireland, how to reach them. Only facts that already appear on the site (or in the
 * privacy policy). `sameAs` is Instagram when the editors have set one.
 */
export function organizationNode({ name, description, email, instagramUrl }: OrganizationInput) {
  const sameAs = instagramUrl ? [instagramUrl] : undefined;
  return {
    "@type": "Organization" as const,
    "@id": organizationId(),
    name,
    legalName: LEGAL_NAME,
    url: siteUrl,
    logo: LOGO,
    image: LOGO,
    description,
    address: { "@type": "PostalAddress" as const, addressCountry: "IE" },
    areaServed: { "@type": "Country" as const, name: "Ireland" },
    ...(email
      ? {
          email,
          contactPoint: {
            "@type": "ContactPoint" as const,
            contactType: "customer service",
            email,
            url: absoluteUrl(href("en", routes.contact())),
            availableLanguage: ["English", "Irish"],
          },
        }
      : {}),
    ...(sameAs ? { sameAs } : {}),
  };
}

/** The site itself, pointing at the organisation that publishes it. */
export function websiteNode(name: string) {
  return {
    "@type": "WebSite" as const,
    "@id": websiteId(),
    url: siteUrl,
    name,
    inLanguage: localesLanguages(),
    publisher: { "@id": organizationId() },
  };
}

function localesLanguages() {
  return (["en", "ga"] as const).map((locale) => dateLocale[locale]);
}

type ProjectJsonLdInput = {
  lang: Locale;
  title: string;
  slug: string;
  description?: string | null | undefined;
  type?: string | null | undefined;
  year?: number | null | undefined;
  client?: string | null | undefined;
  imageUrl?: string | null | undefined;
  vimeoUrl?: string | null | undefined;
  credits: readonly { role: string; name: string; path?: string | null | undefined }[];
  crumbs: { home: string; work: string };
};

/**
 * A project's page: VideoObject when there is a Vimeo film to play, otherwise a CreativeWork. Breadcrumbs and a
 * publisher pointer tie it back to the organisation.
 */
export function projectGraph({
  lang,
  title,
  slug,
  description,
  type,
  year,
  client,
  imageUrl,
  vimeoUrl,
  credits,
  crumbs,
}: ProjectJsonLdInput) {
  const url = absoluteUrl(href(lang, routes.project(slug)));
  const vimeo = parseVimeo(vimeoUrl);
  const contributors = credits.map((credit) => ({
    "@type": "Person" as const,
    name: credit.name,
    jobTitle: credit.role,
    ...(credit.path ? { url: absoluteUrl(href(lang, credit.path)) } : {}),
  }));

  const shared = {
    name: title,
    url,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(type ? { genre: type } : {}),
    ...(year ? { dateCreated: String(year) } : {}),
    ...(client ? { sourceOrganization: { "@type": "Organization" as const, name: client } } : {}),
    ...(contributors.length > 0 ? { contributor: contributors } : {}),
    publisher: { "@id": organizationId() },
    mainEntityOfPage: url,
  };

  const work =
    vimeo && vimeoUrl
      ? {
          "@type": "VideoObject" as const,
          ...shared,
          embedUrl: vimeoEmbedUrl(vimeo),
          contentUrl: vimeoUrl,
          ...(imageUrl ? { thumbnailUrl: imageUrl } : {}),
          ...(year ? { uploadDate: `${year}-01-01` } : {}),
        }
      : { "@type": "CreativeWork" as const, ...shared };

  return {
    "@context": "https://schema.org",
    "@graph": [
      work,
      breadcrumbList(lang, [
        { name: crumbs.home, path: routes.home() },
        { name: crumbs.work, path: routes.work() },
        { name: title, path: routes.project(slug) },
      ]),
    ],
  };
}

type PersonJsonLdInput = {
  lang: Locale;
  name: string;
  slug: string;
  roles: readonly string[];
  description?: string | null | undefined;
  imageUrl?: string | null | undefined;
  crumbs: { home: string; talent: string };
};

/** A roster profile: Person, their roles, and breadcrumbs back through Talent. */
export function personGraph({ lang, name, slug, roles, description, imageUrl, crumbs }: PersonJsonLdInput) {
  const url = absoluteUrl(href(lang, routes.person(slug)));
  const person = {
    "@type": "Person" as const,
    name,
    url,
    ...(roles.length > 0 ? { jobTitle: roles.join(", ") } : {}),
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    worksFor: { "@id": organizationId() },
    mainEntityOfPage: url,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      breadcrumbList(lang, [
        { name: crumbs.home, path: routes.home() },
        { name: crumbs.talent, path: routes.talent() },
        { name, path: routes.person(slug) },
      ]),
    ],
  };
}

type SiteGraphInput = OrganizationInput & { name: string };

/** Home (and About): the organisation and the site that publishes it. */
export function siteGraph({ name, description, email, instagramUrl }: SiteGraphInput) {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode({ name, description, email, instagramUrl }), websiteNode(name)],
  };
}

type AboutGraphInput = SiteGraphInput & { lang: Locale; title: string };

/** About: the same organisation entity, plus a WebPage that says this page is about them. */
export function aboutGraph({ lang, title, name, description, email, instagramUrl }: AboutGraphInput) {
  const url = absoluteUrl(href(lang, routes.about()));
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode({ name, description, email, instagramUrl }),
      {
        "@type": "AboutPage" as const,
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: { "@id": websiteId() },
        about: { "@id": organizationId() },
        mainEntity: { "@id": organizationId() },
        inLanguage: dateLocale[lang],
      },
    ],
  };
}
