# Quickstart

## Directory Structure

```
playwright-library-bootstrap/
│
├── 01_START_HERE.md           # Entry point for new project
├── 02_QUICKSTART.md           # ← You are here
├── 03_ARCHITECTURE.md         # Package design decisions
├── 04_RESPONSIBILITIES.md     # What's in package vs. user code
├── 05_PUBLISHING.md           # GitHub Packages publishing guide (@8090-inc)
│
├── reference/                 # The "before" (copy-paste approach, for context)
│   └── ... (copied from playwright-bootstrap/)
│
└── packages/
    │
    ├── core/                  # @8090-inc/playwright-visual
    │   ├── package.json       # Configured for GitHub Packages
    │   ├── .npmrc             # Registry: npm.pkg.github.com
    │   ├── tsconfig.json
    │   ├── tsup.config.ts
    │   └── src/
    │       ├── index.ts       # Public exports
    │       ├── fixtures.ts    # createVisualFixtures
    │       ├── cursor.ts      # cursor.click/fill/hover
    │       ├── story.ts       # story.setup/step/hide
    │       ├── styles.ts      # CSS injection
    │       ├── scripts.ts     # JS injection
    │       ├── helpers.ts     # Animation utilities
    │       ├── config.ts      # visualConfig() helper
    │       ├── env.ts         # Environment detection
    │       └── types.ts       # TypeScript interfaces
    │
    └── example-consumer/      # Test consumer
        ├── package.json
        ├── .npmrc
        ├── playwright.config.ts
        └── e2e/
            ├── fixtures.ts
            ├── context.md
            └── tests/example.spec.ts
```

---

## What's Configured for @8090-inc

| File | Setting |
|------|---------|
| `packages/core/package.json` | `"name": "@8090-inc/playwright-visual"` |
| `packages/core/package.json` | `"publishConfig.registry": "npm.pkg.github.com"` |
| `packages/core/package.json` | `"publishConfig.access": "restricted"` |
| `packages/core/.npmrc` | `@8090-inc:registry=https://npm.pkg.github.com` |
| All imports | `@8090-inc/playwright-visual` |

---

## What You'll Do in a New Project

1. **Copy `playwright-library-bootstrap/` to a new repo** (or use it as the repo itself)
2. **Point the LLM at `01_START_HERE.md`**
3. **LLM reads `03_ARCHITECTURE.md`, `05_PUBLISHING.md`**
4. **Build, test, publish**

---

## Commands

```bash
# Build the package
cd packages/core
pnpm install
pnpm build

# Test consumption locally
cd ../example-consumer
pnpm install
pnpm test:demo

# Verify npm auth
npm whoami --registry=https://npm.pkg.github.com

# Dry run (safe preview)
cd ../core
npm publish --dry-run

# Publish for real
npm version 0.1.0
npm publish
```

The dry-run command shows exactly what would be published without actually doing it—so you can verify before committing.
