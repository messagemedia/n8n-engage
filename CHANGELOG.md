# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.0.0-alpha.16] - 2026-04-08

### Fixed

- Use `httpRequestWithAuthentication` instead of manual credential retrieval for secure, consistent auth handling (n8n reviewer requirement)
- Remove undocumented `subcategories` field from codex `.node.json` files (only `node`, `nodeVersion`, `codexVersion`, `categories`, `resources`, `alias` are supported)
- Sort resource dropdown options alphabetically — "Blacklist" now appears before "SMS" (n8n UX guideline)

## [1.0.0-alpha.15] - 2026-04-07

### Fixed

- Use `NodeConnectionTypes.Main` constant for inputs/outputs instead of string literals (n8n reviewer requirement)
- Add `prebuild` script to clean `dist/` before each build, preventing stale/duplicate artifacts
- Copy codex `.node.json` metadata files to `dist/` during build (were missing from published package)
- Add exclusion pattern for old `MessageMediaApi.credential.*` files in `files` field to prevent duplicate credentials in npm tarball

### Changed

- Upgrade GitHub Actions publish workflow to match n8n-build: auto-detect version bumps on push to main, auto-create GitHub Release and git tag with provenance
- Promote `@typescript-eslint/no-explicit-any` from warn to error

## [1.0.0-alpha.14] - 2026-03-23

### Added

- Codex metadata files (`*.node.json`) for n8n catalog integration
- GitHub Actions publish workflow with provenance support
- `prepublishOnly` script to enforce build + lint before publish
- `continueOnFail()` error handling in execute loop

### Changed

- Re-thrown errors in execute() now wrapped in `NodeApiError` for proper n8n UI rendering
- Set `no-console` ESLint rule to `error` to prevent accidental logging
- Updated README to reference correct package name `@sinch-engage/n8n-nodes-sinch-engage`

### Fixed

- Removed deprecated `request` fallback and debug logging
- Masked API key credential field as password
- Cleaned up package.json for n8n verification (removed unused fields, added `n8n.strict: true`)
- Remediated high Snyk transitive vulnerabilities
- Updated Node.js engine requirement to support v24


## [1.0.0-alpha.8] - 2025-12-01

**⚠️ ALPHA RELEASE**

### Changed

- Restructured project to remove `src/` directory for n8n compliance
- Moved all source files to root-level directories (`nodes/`, `credentials/`, `utils/`)
- Updated build configuration in `package.json` and `tsconfig.json` to reflect new structure


## [1.0.0-alpha.7] - 2025-12-01

**⚠️ ALPHA RELEASE**

### Fixed

- Renamed credential file to use singular `.credential.ts` extension for n8n verification compliance


## [1.0.0-alpha.4] - 2025-12-01

**⚠️ ALPHA RELEASE**

### Fixed

- Added author email to package.json for n8n creators hub compatibility


## [1.0.0-alpha-3] - 2025-12-01

**⚠️ ALPHA RELEASE**

### Changed

- Replaced `i18n-iso-countries` dependency with custom country code utilities
- Replaced `google-libphonenumber` dependency with custom phone validation utilities
- All dependencies removed from package.json to comply with n8n community node requirements

### Removed

- Removed `i18n-iso-countries` external dependency
- Removed `google-libphonenumber` external dependency
- Removed unused `mustache` dependency


## [1.1.0-alpha-2] - 2025-10-24

**⚠️ ALPHA RELEASE**

### Fixed

- Readme details


## [1.1.0-alpha-1] - 2025-10-23

**⚠️ ALPHA RELEASE - For internal testing only**

This is the first alpha release focused on n8n verification compliance and establishing proper release processes.

- Add node with Sinch Engage as a provider
- Add credentials for provider
- Add phone normalization and encoding detection
- Add tests and example workflow