import { PortableText } from "next-sanity";

import { ContactLinks, fallbackStills, getSiteSettings, toTeam } from "@/content/siteSettings";
import { at } from "@/lib/at";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { editAttr } from "@/sanity/lib/editing";
import { toSizedImage } from "@/sanity/lib/image";

import type { AboutLayoutProps } from "./components/AboutLayout";

/** Everything the About layout shows, from Site settings: the editors' content, or the dictionary's and the bundled still. */
export async function getAbout(lang: Locale): Promise<AboutLayoutProps> {
  const [dict, settings] = await Promise.all([getDictionary(lang), getSiteSettings(lang)]);
  const { _id, aboutStill, slogan, sloganGloss, manifesto } = settings;
  const attr = (path: string) => (_id ? editAttr("siteSettings", _id, path) : undefined);

  return {
    still: (aboutStill ? toSizedImage(aboutStill, 2400) : null) ?? at(fallbackStills, 0),
    slogan: slogan ?? dict.about.title,
    gloss: sloganGloss ?? null,
    manifesto: manifesto?.length ? <PortableText value={manifesto} /> : null,
    contacts: <ContactLinks variant="list" contact={settings.contact} labels={dict.contactLinks} />,
    team: toTeam(settings, dict.about.teamHeading),
    attributes: _id
      ? { still: attr("aboutStill"), slogan: attr("slogan"), manifesto: attr("manifesto"), team: attr("teamStill") }
      : undefined,
  };
}
