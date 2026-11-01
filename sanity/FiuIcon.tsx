import Image from "next/image";

/**
 * Studio workspace icon: the dark Fíu avatar (design/avatar), served from public/brand.
 * The Studio wraps it in a fixed 25px/41px rounded box and does not set a font-size,
 * so size to the box (100%) rather than 1em.
 */
export function FiuIcon() {
  return (
    <span style={{ display: "block", position: "relative", width: "100%", height: "100%", borderRadius: "inherit" }}>
      <Image src="/brand/fiu-avatar.png" alt="" fill sizes="41px" style={{ borderRadius: "inherit" }} />
    </span>
  );
}
