import { PORTRAIT } from "../media";
import { useMediaQuery } from "./useMediaQuery";

/** Whether the screen is portrait. The server and the hydration render assume landscape. */
export function usePortrait() {
  return useMediaQuery(PORTRAIT, false);
}
