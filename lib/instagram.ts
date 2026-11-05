/** `https://www.instagram.com/fiumedia/` as `@fiumedia`; anything that isn't an Instagram profile URL is returned as is. */
export function instagramHandle(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, "");
}
