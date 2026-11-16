/**
 * A JSON-LD script tag. Plain `<script>` (not `next/script`): this is data, not code to run. `<` is escaped so a value
 * from the CMS can't close the tag (see Next's JSON-LD guide).
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}
