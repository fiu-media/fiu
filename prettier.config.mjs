/** @type {import("prettier").Config} */
const config = {
  printWidth: 130,
  // Break binary expressions before the operator, not after.
  experimentalOperatorPosition: "start",
  // The Tailwind plugin has to come last.
  plugins: ["prettier-plugin-packagejson", "prettier-plugin-tailwindcss"],
  // Tailwind v4 reads its theme from the entry stylesheet, so custom tokens sort correctly.
  tailwindStylesheet: "./app/(site)/globals.css",
  tailwindFunctions: ["cn"],
};

export default config;
