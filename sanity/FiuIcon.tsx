import { previewOrigin } from "./studio-env";

/**
 * Studio workspace icon: the dark Fíu avatar (design/avatar), served from the site's public/brand.
 * The Studio wraps it in a fixed 25px/41px rounded box and does not set a font-size,
 * so size to the box (100%) rather than 1em.
 */
export function FiuIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the Studio is built outside Next, so next/image isn't available
    <img
      src={`${previewOrigin}/brand/fiu-avatar.png`}
      alt=""
      style={{ display: "block", width: "100%", height: "100%", borderRadius: "inherit", objectFit: "cover" }}
    />
  );
}
