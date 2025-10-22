# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0-alpha.0] - 2025-10-22

**⚠️ ALPHA RELEASE - For internal testing only**

This is the first alpha release focused on n8n verification compliance and establishing proper release processes.

### Added
- ESLint configuration (`.eslintrc.json`) with TypeScript parser and strict linting rules
- `lint:fix` script in package.json for automated code fixes
- Development section in README.md with linting and contribution guidelines
- Shared HTTP utility (`src/utils/messageMediaHttp.ts`) for centralized networking
- Release channel documentation (alpha/beta/GA) in README
- Comprehensive `docs/RELEASE_CHECKLIST.md` for all release types
- Version strategy section explaining semantic versioning with pre-release tags

### Changed
- **[BREAKING - Internal]** All HTTP requests now use `this.helpers.httpRequest` for n8n platform compliance
- Migrated trigger node webhook methods to use shared HTTP utility
- Refactored MessageMedia provider to use platform networking helpers
- Updated main node (account numbers, blacklist API) to use shared utility
- All tests now mock at helper level instead of network level

### Fixed
- All ESLint errors and warnings (unused imports, escape characters, require statements)
- Removed native `https` module usage and custom `makeDirectHttpsRequest` function
- Tests no longer depend on external services (httpbin.org)

### Documentation
- Added comprehensive Networking Policy to `docs/DEVELOPER_GUIDE.md`
- Updated `docs/VERIFICATION_PLAN.md` with Workstream 1, 2, & 4 completion status
- Documented approved HTTP patterns and verification checklist
- Created step-by-step release process for alpha/beta/GA releases

### Technical
- All 19 tests passing with offline execution
- Build completes successfully with zero errors
- Lint passes with zero errors and zero warnings
- Full compliance with n8n verification standards for HTTP networking

### Installation (Alpha)
```bash
npm install n8n-nodes-sms-sender@alpha
```

---

## 1.0.36 - Comprehensive Tooltips Enhancement (2025-10-20)
### Added
- Comprehensive tooltips (hints) on all 9 fields (4 core fields + 5 additional fields)
- Inline examples and usage guidance for each field
- Direct links to MessageMedia API documentation (SMS API, Delivery Reports)
- Character encoding explanations (GSM7 vs UCS-2, segment limits)
- Webhook setup instructions for delivery status callbacks
- Best practices recommendations (auto-detect encoding, rate limiting)

### Improved
- User onboarding experience with inline help
- Reduced need for external documentation searches
- Clearer understanding of encoding implications and character limits
- Better guidance on optional features (webhooks, rate limiting, error handling)
- Phone number format examples (E.164 vs local format)

### Documentation
- Created TOOLTIPS_IMPLEMENTATION.md with complete implementation details

## 1.0.35 - Enhanced Sender Dropdown & Country Support (2025-10-15)
### Added
- Expanded country list from 9 to 250 countries using i18n-iso-countries
- Country field moved to core properties (position #2, highly visible)
- Destination countries displayed in sender dropdown
- Sinch logo as node icon
- Official google-libphonenumber library for strict phone validation

### Fixed
- Phone parsing bug: NZ numbers no longer incorrectly parsed as AU
- Handles 00-prefix conversion to + prefix

### Improved
- Sender dropdown reorganization: identifier in name, metadata in description
- Shows capabilities (SMS, MMS), type, and destination countries for each sender
- Better separation of concerns in dropdown display

## 1.0.32 - Sender Dropdown
- Add a sender dropdown list for quick number selection

## 1.0.8 - Initial Release
- Add SMS Sender node with MessageMedia as a provider
- Add credentials for provider
- Add phone normalization and encoding detection
- Add tests and example workflow