import { createClient } from "@sanity/client";
import { at, defineMigration, set } from "sanity/migrate";

/**
 * Copies rental item images from production into a dev dataset, so dev shows real kit photos
 * without cloning production's content. Matches items by id (the seed gives dev the same ids
 * production has) and only fills items that have no images yet, so it never overwrites.
 *
 *   npx sanity migrations run pull-kit-images --project <id> --dataset dev               # dry run
 *   npx sanity migrations run pull-kit-images --project <id> --dataset dev --no-dry-run  # apply
 *
 * Production is only ever read. Image files are downloaded and re-uploaded into the target
 * dataset; Sanity names an asset after its content hash, so the copied `images` array (alt text,
 * hotspot and crop included) points at the same asset ids on both sides.
 */

const SOURCE = "production";

type Image = { _key: string; asset?: { _ref: string }; [key: string]: unknown };
type AssetDoc = { _id: string; url: string; originalFilename?: string; mimeType?: string };

export default defineMigration({
  title: "Pull rental item images from production",
  documentTypes: ["rentalItem"],

  migrate: {
    async document(doc, context) {
      // The migration's own client is read-only and can't be re-pointed, so build ones from its login.
      const { projectId, dataset, token } = context.client.config();
      const clientFor = (name: string) => createClient({ projectId, dataset: name, token, apiVersion: "2026-10-01", useCdn: false });
      if (dataset === SOURCE) throw new Error(`Run this against a dev dataset, not "${SOURCE}".`);
      if ((doc.images as Image[] | undefined)?.some((image) => image.asset)) return [];

      const source = clientFor(SOURCE);
      const original = await source.getDocument(doc._id.replace(/^drafts\./, ""));
      const images = ((original?.images as Image[] | undefined) ?? []).filter((image) => image.asset);
      if (!images.length) return [];

      if (context.dryRun) return [at("images", set(images))];

      const target = clientFor(dataset!);
      const copied: Image[] = [];
      for (const image of images) {
        const assetId = image.asset!._ref;
        const asset = await source.getDocument<AssetDoc>(assetId);
        if (!asset) throw new Error(`${doc._id}: asset ${assetId} is missing in ${SOURCE}`);
        const response = await fetch(asset.url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!response.ok) throw new Error(`${doc._id}: couldn't download ${asset.url} (${response.status})`);
        const uploaded = await target.assets.upload("image", Buffer.from(await response.arrayBuffer()), {
          filename: asset.originalFilename,
          contentType: asset.mimeType,
        });
        copied.push({ ...image, asset: { ...image.asset, _ref: uploaded._id } });
      }
      return [at("images", set(copied))];
    },
  },
});
