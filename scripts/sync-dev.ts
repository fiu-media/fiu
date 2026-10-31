/**
 * Mirrors production's content into the `dev` dataset, so dev is a realistic copy to test against.
 * Safe to re-run. It only ever writes to dev; production is read (exported) and never changed.
 *
 *   npm run sync:dev
 *
 * What it does:
 *  1. exports production, then keeps only content documents (no system documents, no preview
 *     secrets, no inbox messages with visitors' details) plus all image files
 *  2. imports that into dev, replacing documents with the same id
 *  3. deletes documents that exist only in dev (import never deletes), and checks the two match
 *
 * Needs NEXT_PUBLIC_SANITY_PROJECT_ID and an Editor-role SANITY_API_WRITE_TOKEN in .env.local,
 * and a `sanity login` with access to the project (the export and import use your login).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@sanity/client";

const SOURCE = "production";
const TARGET = "dev";
/** Everything editors author. Inbox types and Sanity's own documents are deliberately absent. */
const CONTENT_TYPES = ["siteSettings", "project", "talent", "projectType", "role", "rentalCategory", "rentalItem"];

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} (set it in .env.local)`);
  return value;
}

const projectId = env("NEXT_PUBLIC_SANITY_PROJECT_ID");
const token = env("SANITY_API_WRITE_TOKEN");
const sanity = (...args: string[]) => execFileSync("npx", ["sanity", ...args, "--project-id", projectId], { stdio: "inherit" });
const clientFor = (dataset: string) =>
  createClient({ projectId, dataset, token, apiVersion: "2026-10-01", useCdn: false, perspective: "raw" });

type Doc = { _id: string; [key: string]: unknown };
const META = new Set(["_rev", "_createdAt", "_updatedAt"]);
const withoutMeta = (doc: Doc) => Object.fromEntries(Object.entries(doc).filter(([key]) => !META.has(key))) as Doc;
const same = (a: Doc, b: Doc) => JSON.stringify(withoutMeta(a)) === JSON.stringify(withoutMeta(b));

async function main() {
  const work = mkdtempSync(join(tmpdir(), "sync-dev-"));
  try {
    const full = join(work, "full.tar.gz");
    sanity("dataset", "export", SOURCE, full);

    const extracted = join(work, "x");
    mkdirSync(extracted);
    execFileSync("tar", ["-xzf", full, "-C", extracted]);
    const [folder] = readdirSync(extracted);
    const data = join(extracted, folder, "data.ndjson");
    const kept = readFileSync(data, "utf8")
      .split("\n")
      .filter((line) => line.trim() && CONTENT_TYPES.includes(JSON.parse(line)._type));
    writeFileSync(data, kept.join("\n") + "\n");

    const filtered = join(work, "filtered.tar.gz");
    execFileSync("tar", ["-czf", filtered, "-C", extracted, folder]);
    sanity("dataset", "import", filtered, TARGET, "--replace");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  // Import replaces but never deletes, and production may have changed during the export.
  const query = `*[_type in $types] | order(_id asc)`;
  const [prod, dev] = [clientFor(SOURCE), clientFor(TARGET)];
  const source = await prod.fetch<Doc[]>(query, { types: CONTENT_TYPES });
  const target = await dev.fetch<Doc[]>(query, { types: CONTENT_TYPES });
  const sourceIds = new Set(source.map((doc) => doc._id));
  const targetById = new Map(target.map((doc) => [doc._id, doc]));
  const extra = target.filter((doc) => !sourceIds.has(doc._id));
  const stale = source.filter((doc) => !targetById.has(doc._id) || !same(doc, targetById.get(doc._id)!));
  if (extra.length || stale.length) {
    const tx = dev.transaction();
    for (const doc of extra) tx.delete(doc._id);
    for (const doc of stale) tx.createOrReplace(withoutMeta(doc) as Doc & { _type: string });
    await tx.commit();
  }
  console.log(`Synced ${source.length} documents to ${TARGET}; removed ${extra.length} dev-only, re-synced ${stale.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
