import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import requireExplicitGenerics from "eslint-plugin-require-explicit-generics";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  // Core Web Vitals rules from Next.js ESLint config:
  // See: https://nextjs.org/docs/app/api-reference/config/eslint
  ...nextVitals,

  // TypeScript-specific rules from Next.js ESLint config:
  // See: https://nextjs.org/docs/app/api-reference/config/eslint#with-typescript
  ...nextTs,

  // Prettier integration for code formatting and conflict prevention:
  // See: https://nextjs.org/docs/app/api-reference/config/eslint#with-prettier
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // Custom rules
  {
    plugins: {
      "require-explicit-generics": requireExplicitGenerics,
    },
    rules: {
      "require-explicit-generics/require-explicit-generics": [
        // TODO: This should be an error!
        "warn",
        [
          // E.g. createContext<ContextType>
          "createContext",
          // E.g. useReducer<StateType, ActionType>
          "useReducer",
          // E.g. useRef<RefType>
          "useRef",
          // E.g. useState<StateType>
          "useState",
        ],
      ],
    },
  },
]);

export default eslintConfig;
