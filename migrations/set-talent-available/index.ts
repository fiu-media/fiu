import { at, defineMigration, setIfMissing } from "sanity/migrate";

/**
 * `available` on talent became a required checkbox (ticked by default). Talent that predate it have no value;
 * this gives them the default, so they are valid in the Studio and offered on the contact form as before.
 * Drafts and published documents, in every language, are all patched. Run once per dataset:
 *
 *   npx sanity migration run set-talent-available --dataset dev                # dry run: shows what would change
 *   npx sanity migration run set-talent-available --dataset dev --no-dry-run   # applies it
 */
export default defineMigration({
  title: "Set `available` on talent that don't have it",
  documentTypes: ["talent"],
  migrate: {
    document: () => at("available", setIfMissing(true)),
  },
});
