/**
 * The page is dark, so an iframe would inherit a dark color-scheme. Vimeo's player page is light, and when the
 * two differ Chrome and Safari paint an opaque white backdrop behind it: a white flash while it loads, and white
 * bars wherever the video doesn't fill the frame. Matching Vimeo's scheme keeps the frame transparent over black.
 */
export const VIMEO_FRAME_STYLE = { colorScheme: "light" } as const;
