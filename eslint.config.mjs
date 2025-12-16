// https://nextjs.org/docs/app/api-reference/config/eslint

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  // With TypeScript
  // https://nextjs.org/docs/app/api-reference/config/eslint#with-typescript
  ...nextTs,
  // With Prettier
  // https://nextjs.org/docs/app/api-reference/config/eslint#with-prettier
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
