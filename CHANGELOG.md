# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-10

### Added
- **Market Data Dashboard**: A new view for visualizing stock market indicators using XuanguBao API.
- **Manual Data Sync**: Added a "Sync Today's Data" button to manually trigger market indicators fetch.
- **SQLite Persistence**: Migrated heavy data (messages, market data) from IndexedDB/Store to Better-SQLite3 for improved performance.
- **Scheduled Tasks**: Added a robust Cron service for background tasks (e.g., daily market data sync).
- **Comprehensive IPC Logging**: Added unified logging across all IPC handlers for better debugging and visibility.

### Changed
- Refactored Electron main process architecture to use separate infrastructure and service layers.
- Rewrote Model handlers to support ESM dynamic imports, solving `require` issues in production-like builds.
- Standardized project directory structure.

### Fixed
- Fixed multiple relative import issues in deep directory structures.
- Fixed Naive UI provider errors by wrapping the app with necessary providers (Message, Dialog, etc.).
- Fixed storage directory initialization logic.

## [0.0.1] - 2026-04-08

### Added
- Initial project setup with Vue 3, Vite, and Electron.
- Basic LLM chat functionality using `node-llama-cpp`.
- Simple model management (download/delete).
- Basic settings page for theme and model configuration.
