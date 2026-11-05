/** Width of the side rail in rem, before the notch inset. */
export const RAIL_REM = 4;

/** Room for the side rail: 4rem, plus the notch when a landscape phone has one on the left. */
export const railInset = "md:pl-[calc(4rem+env(safe-area-inset-left))]";

/** Side margin of every page's content: in line with the phone menu bar's logo, and the slides' captions. */
export const pageGutter = "px-5 md:px-10";

/** Where a page's first line starts from `md`, beside the rail. The adaptive layout sets it; full-bleed cinematic pages set it on their header. */
export const pageTop = "md:pt-[max(2.5rem,env(safe-area-inset-top))]";

/**
 * Room under the phone menu bar where it floats over the page (cinematic), so the first line lands where it does on
 * adaptive pages, whose bar takes its own row: the bar's top padding, the 2.5rem Menu button and its 1rem bottom padding.
 */
export const floatingBarInset = "max-md:pt-[calc(max(1.25rem,env(safe-area-inset-top))+3.5rem)]";
