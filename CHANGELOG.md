# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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