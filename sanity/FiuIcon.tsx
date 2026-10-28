/**
 * Studio workspace icon: the maroon Fíu avatar (design/avatar), served from public/brand.
 * The Studio wraps it in a fixed 25px/41px rounded box and does not set a font-size,
 * so size to the box (100%) rather than 1em.
 */
export function FiuIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/fiu-avatar-maroon.png"
      alt=""
      style={{ display: "block", width: "100%", height: "100%", borderRadius: "inherit" }}
    />
  );
}
