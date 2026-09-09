import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "dist/**", ".vinext/**", ".wrangler/**"],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
