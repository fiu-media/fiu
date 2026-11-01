/** @type {import("prettier").Config} */
const config = {
  printWidth: 130,
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 reads its theme from the entry stylesheet, so custom tokens sort correctly.
  tailwindStylesheet: "./app/(site)/globals.css",
  tailwindFunctions: ["cn"],
};

export default config;
