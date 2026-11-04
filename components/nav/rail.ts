/** Width of the side rail in rem, before the notch inset. */
export const RAIL_REM = 4;

/** Room for the side rail: 4rem, plus the notch when a landscape phone has one on the left. */
export const railInset = "md:pl-[calc(4rem+env(safe-area-inset-left))]";

/** Side margin of every page's content: in line with the phone menu bar's logo, and the slides' captions. */
export const pageGutter = "px-5 md:px-10";

/** Where a page's first line starts from `md`, beside the rail. The adaptive layout sets it; pages that open on a photo set it on their header. */
export const pageTop = "md:pt-[max(2.5rem,env(safe-area-inset-top))]";
