# Publishing to GitHub Packages (@8090-inc)

This package publishes to **GitHub Packages** (`npm.pkg.github.com`) under the `@8090-inc` scope with `restricted` (private) access.

---

## Prerequisites

### 1. Organization Membership

You **must** be a member of the `8090-inc` GitHub organization with **Write** access.

```bash
# Verify your permissions
gh api repos/8090-inc/constructs/collaborators/$USER/permission --jq '.permission'
# Expected: "write" or "admin"
```

### 2. Personal Access Token (PAT)

Create a **Classic PAT** at https://github.com/settings/tokens with these scopes:

| Scope | Required For |
|-------|--------------|
| `repo` | Private repo packages |
| `write:packages` | Upload packages |
| `read:packages` | Download packages |

### 3. Configure ~/.npmrc

Add your token to your **user** `.npmrc` (NOT the project one):

```bash
# Add to ~/.npmrc (this file should NOT be committed)
echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE" >> ~/.npmrc
```

---

## Package Configuration

The `packages/core/package.json` is already configured correctly:

```json
{
  "name": "@8090-inc/playwright-visual",
  "private": false,
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/8090-inc/playwright-visual.git"
  }
}
```

**Key points:**
- `"private": false` — allows publishing (counterintuitive but required)
- `"access": "restricted"` — makes package private to org members
- `"registry"` — sends to GitHub Packages, not public npm

---

## Publishing Workflow

### Step 1: Build the Package

```bash
cd packages/core
pnpm install
pnpm build
```

### Step 2: Verify Authentication

```bash
npm whoami --registry=https://npm.pkg.github.com
# Expected: your GitHub username
```

### Step 3: Dry Run (Safe Preview)

```bash
npm publish --dry-run
```

This shows what **would** be published without actually doing it. Review the output carefully.

### Step 4: Publish

```bash
npm publish
```

---

## Versioning

For version bumps, update `package.json` manually or use changesets:

```bash
# Manual version bump
npm version patch  # 0.0.0 -> 0.0.1
npm version minor  # 0.0.1 -> 0.1.0
npm version major  # 0.1.0 -> 1.0.0

# Then publish
npm publish
```

---

## Installing the Package (Consumers)

Other `@8090-inc` projects can install with:

```bash
# They need this in their project .npmrc (committed)
@8090-inc:registry=https://npm.pkg.github.com

# Then install normally
pnpm add @8090-inc/playwright-visual
```

---

## Verify Package is Private

After publishing, confirm it's not public:

```bash
# This should FAIL (401 Unauthorized)
curl -I https://npm.pkg.github.com/@8090-inc/playwright-visual

# Check via GitHub API
gh api /orgs/8090-inc/packages/npm/playwright-visual --jq '.visibility'
# Expected: "private"
```

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Missing/invalid token | Check `~/.npmrc` has valid PAT |
| `403 Forbidden` | Not an org member | Get added to `8090-inc` org |
| `402 Payment Required` | Wrong registry | Ensure `publishConfig.registry` is set |
| `Package name does not match` | Scope mismatch | Must be lowercase `@8090-inc` |

---

## Security Checklist

- [ ] PAT is in `~/.npmrc`, NOT in project `.npmrc`
- [ ] Project `.npmrc` only has `@8090-inc:registry=https://npm.pkg.github.com`
- [ ] `.npmrc` with tokens is in `.gitignore`
- [ ] Ran `npm publish --dry-run` before actual publish
- [ ] Verified package visibility after publishing
