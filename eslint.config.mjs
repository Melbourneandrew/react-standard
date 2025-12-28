import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";
import prettierPlugin from "eslint-plugin-prettier";
import requireExplicitGenerics from "eslint-plugin-require-explicit-generics";
import { defineConfig, globalIgnores } from "eslint/config";

// =============================================================================
// Base configuration (Next.js + TypeScript)
// Replaces Vite's baseConfig with Next.js equivalents:
// - Core Web Vitals rules for performance
// - TypeScript-aware linting
// - React Hooks rules (included in nextVitals)
// =============================================================================
const baseConfig = [...nextVitals, ...nextTs];

// =============================================================================
// Prettier integration
// Enforces consistent code formatting via ESLint
// =============================================================================
const prettierLayer = [
  prettierConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "warn",
    },
  },
];

// =============================================================================
// Explicit function return types
// Requires return types on function declarations (not arrow functions)
//   function getData(): string { ... }  ← required
//   const getData = () => { ... }       ← allowed
// =============================================================================
const explicitReturnTypesLayer = {
  files: ["**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        allowIIFEs: true,
      },
    ],
  },
};

// =============================================================================
// Require explicit generics
// Enforces explicit type parameters on common React hooks
//   useState<number>(0)      ← required
//   useRef<HTMLDivElement>() ← required
// =============================================================================
const requireExplicitGenericsLayer = {
  files: ["**/*.{ts,tsx}"],
  plugins: { "require-explicit-generics": requireExplicitGenerics },
  rules: {
    "require-explicit-generics/require-explicit-generics": [
      "warn",
      ["createContext", "useReducer", "useRef", "useState"],
    ],
  },
};

// =============================================================================
// No default exports (adapted for Next.js)
// Enforces named exports for better refactoring and auto-imports
//   export default App    ← disallowed
//   export { App }        ← preferred
//
// EXCEPTIONS:
// - src/app/** is excluded because Next.js App Router REQUIRES default exports
//   for routing conventions: page.tsx, layout.tsx, loading.tsx, error.tsx,
//   not-found.tsx, template.tsx, default.tsx, route.ts, and metadata files
//   (sitemap.ts, robots.ts, icon.tsx, opengraph-image.tsx, etc.)
//   See: https://nextjs.org/docs/app/api-reference/file-conventions
//
// - src/middleware.ts is excluded because Next.js middleware requires a
//   default export. See: https://nextjs.org/docs/app/building-your-application/routing/middleware
//
// - src/instrumentation.ts is excluded because Next.js instrumentation
//   (OpenTelemetry, etc.) may require default exports.
//   See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
// =============================================================================
const noDefaultExportsLayer = {
  files: ["src/**/*.{ts,tsx}"],
  ignores: ["src/app/**", "src/middleware.ts", "src/instrumentation.ts"],
  rules: {
    "no-restricted-syntax": [
      "warn",
      {
        selector: "ExportDefaultDeclaration",
        message: "Prefer named exports over default exports.",
      },
    ],
  },
};

// =============================================================================
// COMPOSE ALL LAYERS
// =============================================================================
export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/ui/**", // Third-party components (shadcn, etc.)
  ]),

  // Layers (comment out to disable)
  ...baseConfig,
  ...prettierLayer,
  // explicitReturnTypesLayer,
  // requireExplicitGenericsLayer,
  noDefaultExportsLayer,
]);
