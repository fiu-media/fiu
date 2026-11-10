export const backdropVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Same cover-fit as the HTML <Image> stills (object-fit: cover) so refraction matches
// the full-bleed hero behind the logo.
export const backdropFragment = /* glsl */ `
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform float fromAspect;
uniform float toAspect;
uniform float planeAspect;
uniform float progress;
uniform float reveal;
uniform float whiteLevel;
varying vec2 vUv;
vec2 cover(vec2 uv, float imageAspect) {
  vec2 scale = planeAspect > imageAspect
    ? vec2(1.0, imageAspect / planeAspect)
    : vec2(planeAspect / imageAspect, 1.0);
  return (uv - 0.5) * scale + 0.5;
}
void main() {
  vec4 a = texture2D(tFrom, cover(vUv, fromAspect));
  vec4 b = texture2D(tTo, cover(vUv, toAspect));
  vec4 still = mix(a, b, smoothstep(0.0, 1.0, progress));
  gl_FragColor = vec4(mix(vec3(whiteLevel), still.rgb, reveal), still.a);
  #include <colorspace_fragment>
}`;
