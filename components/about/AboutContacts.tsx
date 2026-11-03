import { siInstagram } from "simple-icons";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { instagramHandle } from "@/lib/instagram";

/** Email and Instagram as two plain links; renders nothing when the editors haven't set either. */
export function AboutContacts({
  email,
  instagram,
  labels,
}: {
  email: string | null;
  instagram: string | null;
  labels: { email: string; instagram: string };
}) {
  if (!email && !instagram) return null;
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
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-lg link-inline"
          >
            <BrandIcon icon={siInstagram} />
            {instagramHandle(instagram)}
          </a>
        </li>
      )}
    </ul>
  );
}
