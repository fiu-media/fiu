import "react";

declare module "react" {
  /** CSS custom properties (`--name`) in a `style` object, which React passes through but its types don't list. */
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
