import { at, createIfNotExists, defineMigration, patch, set, unset, type Mutation, type NodePatch } from "sanity/migrate";
import { defaultLocale } from "../../lib/i18n/config";

/**
 * Free-text project types and roles become `projectType` / `role` documents, and the numeric
 * `order` field goes away in favour of the Studio's drag-and-drop ranks.
 *
 *   npx sanity migrations run taxonomies --project <id> --dataset <name>               # dry run
 *   npx sanity migrations run taxonomies --project <id> --dataset <name> --no-dry-run  # apply
 *
 * For every language and for drafts too, it creates a default-language document for each distinct
 * string in use (createIfNotExists, so re-running is safe) and swaps the strings for references.
 * Afterwards open each orderable list in the Studio and choose "Reset Order" to give documents
 * their new ranks.
 */

const kebab = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isString = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";
const ref = (id: string) => ({ _type: "reference", _ref: id });

/** The default-language document a string stands for. Same ids as the seed script's. */
function taxonomyDoc(kind: "projectType" | "role", title: string) {
  const id = `${kind === "projectType" ? "type" : "role"}-${kebab(title)}`;
  return { _id: id, _type: kind, language: defaultLocale, title, slug: { _type: "slug", current: kebab(title) } };
}

type Keyed = { _key: string; [key: string]: unknown };

export default defineMigration({
  title: "Project types and roles as documents; order to orderRank",
  documentTypes: ["project", "talent", "rentalItem", "rentalCategory"],

  migrate: {
    document(doc) {
      const creates: Mutation[] = [];
      const ops: NodePatch[] = [];

      if (doc.order !== undefined) ops.push(at("order", unset()));

      if (doc._type === "project") {
        if (isString(doc.type)) {
          const type = taxonomyDoc("projectType", doc.type);
          creates.push(createIfNotExists(type));
          ops.push(at("type", set(ref(type._id))));
        }
        for (const credit of (doc.credits as Keyed[] | undefined) ?? []) {
          if (!isString(credit.role)) continue;
          const role = taxonomyDoc("role", credit.role);
          creates.push(createIfNotExists(role));
          ops.push(at(["credits", { _key: credit._key }, "role"], set(ref(role._id))));
        }
      }

      if (doc._type === "talent" && Array.isArray(doc.roles) && doc.roles.some(isString)) {
        const roles = doc.roles.map((item: unknown) => {
          if (!isString(item)) return item;
          const role = taxonomyDoc("role", item);
          creates.push(createIfNotExists(role));
          return { ...ref(role._id), _key: role._id };
        });
        ops.push(at("roles", set(roles)));
      }

      return ops.length ? [...creates, patch(doc._id, ops)] : [];
    },
  },
});
