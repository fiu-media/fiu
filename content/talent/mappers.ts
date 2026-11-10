import type { ProjectSlideData } from "@/content/project";
import { toProjectSlideData } from "@/content/project";
import type { Locale } from "@/lib/i18n/config";
import { href, routes } from "@/lib/routes";
import type { TALENT_PROFILE_QUERY_RESULT, TALENT_PROJECTS_QUERY_RESULT, TALENT_QUERY_RESULT } from "@/sanity.types";
import { editAttr } from "@/sanity/lib/editing";
import { type SizedImage, toSizedImage } from "@/sanity/lib/image";

/** Image widths (px) the talent views ask for. */
export const PORTRAIT_INDEX_WIDTH = 640;
export const PORTRAIT_WIDTH = 1200;

const joinRoles = (roles: string[] | null | undefined) => (roles ?? []).join(", ");

/** One row of the roster index. Has the shape of the `NameIndex` row, which lives in the talent feature. */
export type RosterItem = { title: string; meta: string; href: string; image: SizedImage | null };

/** The roster as index rows: name, roles on the right, a link to the person's page. */
export function toRosterItems(people: TALENT_QUERY_RESULT, lang: Locale): RosterItem[] {
  return people.map((person) => ({
    title: person.name,
    meta: joinRoles(person.roles),
    href: href(lang, routes.person(person.slug)),
    image: person.portrait ? toSizedImage(person.portrait, PORTRAIT_INDEX_WIDTH) : null,
  }));
}

/** A project on a person's page: the shared slide data, plus what they did on it. */
export type TalentProject = ProjectSlideData & { id: string; role?: string };

export type TalentProfile = {
  name: string;
  /** Joined for display; empty when none are set. */
  roles: string;
  portrait: SizedImage | null;
  bio: NonNullable<TALENT_PROFILE_QUERY_RESULT>["bio"];
  /** `data-sanity` values that make each field clickable in the Presentation tool. */
  attrs: { portrait: string; name: string; bio: string };
  projects: TalentProject[];
};

/** A person's page content from the profile query and the projects they are credited on. */
export function toTalentProfile(
  profile: NonNullable<TALENT_PROFILE_QUERY_RESULT>,
  projects: TALENT_PROJECTS_QUERY_RESULT,
): TalentProfile {
  return {
    name: profile.name,
    roles: joinRoles(profile.roles),
    portrait: profile.portrait ? toSizedImage(profile.portrait, PORTRAIT_WIDTH) : null,
    bio: profile.bio,
    attrs: {
      portrait: editAttr("talent", profile._id, "portrait"),
      name: editAttr("talent", profile._id, "name"),
      bio: editAttr("talent", profile._id, "bio"),
    },
    projects: projects.map((project) => ({
      id: project._id,
      ...toProjectSlideData(project),
      role: joinRoles(project.roles) || undefined,
    })),
  };
}

/** The page title and description of a person's page, from the profile query. */
export function toProfileMeta({ name, roles }: Pick<NonNullable<TALENT_PROFILE_QUERY_RESULT>, "name" | "roles">) {
  return { title: name, description: joinRoles(roles) || undefined };
}
