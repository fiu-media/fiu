/** Width of the side rail in rem, before the notch inset. */
export const RAIL_REM = 4;

/** Room for the side rail: 4rem, plus the notch when a landscape phone has one on the left. */
export const railInset = "md:pl-[calc(4rem+env(safe-area-inset-left))]";
