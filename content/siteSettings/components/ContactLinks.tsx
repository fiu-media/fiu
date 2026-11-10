import { siInstagram } from "simple-icons";

import { BrandIcon } from "@/components/ui/BrandIcon";

import type { SiteContact } from "../loaders";

type Props = {
  contact: SiteContact;
  labels: { email: string; instagram: string };
  /**
   * `inline`: bare links in a row, for the footer. `list`: a wrapping list with the Instagram mark, for About.
   * `definitions`: a term and its link per line, for the Contact page.
   */
  variant: "inline" | "list" | "definitions";
  /** Classes for the `inline` links, where the footer adds its tap-target padding. */
  linkClassName?: string;
};

/** Email and Instagram as plain links; renders nothing when the editors haven't set either. */
export function ContactLinks({ contact: { email, instagram }, labels, variant, linkClassName = "link-inline" }: Props) {
  if (!email && !instagram) return null;

  if (variant === "inline") {
    return (
      <>
        {email && (
          <a href={`mailto:${email}`} className={linkClassName}>
            <span className="sr-only">{labels.email}: </span>
            {email}
          </a>
        )}
        {instagram && (
          <a href={instagram.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
            <span className="sr-only">{labels.instagram}: </span>
            {instagram.handle}
          </a>
        )}
      </>
    );
  }

  if (variant === "list") {
    return (
      <ul className="flex flex-wrap gap-x-8 gap-y-3">
        {email && (
          <li>
            <span className="sr-only">{labels.email}: </span>
            <a href={`mailto:${email}`} className="text-lg link-inline">
              {email}
            </a>
          </li>
        )}
        {instagram && (
          <li>
            <span className="sr-only">{labels.instagram}: </span>
            <a
              href={instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg link-inline"
            >
              <BrandIcon icon={siInstagram} />
              {instagram.handle}
            </a>
          </li>
        )}
      </ul>
    );
  }

  return (
    <dl className="mt-4 space-y-4">
      {email && (
        <div>
          <dt className="text-sm text-fg-muted">{labels.email}</dt>
          <dd>
            <a href={`mailto:${email}`} className="link-inline">
              {email}
            </a>
          </dd>
        </div>
      )}
      {instagram && (
        <div>
          <dt className="text-sm text-fg-muted">{labels.instagram}</dt>
          <dd>
            <a
              href={instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 link-inline"
            >
              <BrandIcon icon={siInstagram} />
              {instagram.handle}
            </a>
          </dd>
        </div>
      )}
    </dl>
  );
}
