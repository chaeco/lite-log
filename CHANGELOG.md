# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2025-03-24

### Added

- **Comprehensive test coverage expansion**: Added 86 new test cases across all modules
  - Logger tests: +22 tests covering Error scenarios, configureErrorHandling method, nested child loggers
  - Formatter tests: +30 tests for Error serialization, all log levels, color modes, data type handling
  - Caller-info tests: +7 tests for stack filtering, deep call stacks, frame skipping
  - Color-utils tests: 27 new tests covering all style methods and CSS format validation
- **Code quality infrastructure**:
  - ESLint configuration with TypeScript support and strict rules
  - Prettier code formatter with consistent style rules
  - Husky + lint-staged for pre-commit code quality checks
  - GitHub Actions CI workflow with quality, test, and build checks

### Fixed

1. **Error serialization in safeStringify**: Fixed non-enumerable Error properties (name, message, stack)
   - Added `instanceof Error` check for direct Error data
   - Added Error handling in JSON replacer for nested Error objects
   - Now outputs `[ErrorName: message]` format instead of `{}`

2. **Error + parameter handling asymmetry**: Fixed inconsistent data wrapping
   - `logger.error(err)` → data = err
   - `logger.error(err, {x})` → data = {x} (not wrapped in array)
   - Single vs multiple parameter behavior is now consistent

3. **ESLint disable scope leak**: Fixed block-level comment affecting entire file
   - Changed from `/* eslint-disable */` to line-level `// eslint-disable-next-line`
   - Affects only `any` type properties in LogEntry and LoggerEvent

4. **Dead code in updateFormat**: Removed unreachable null coalescing operator
   - Removed `?? 'time'` fallback after undefined check in timestampFormat assignment

### Improved

- **Documentation**: Updated README.md, README.zh-CN.md, and ARCHITECTURE.md with fixes and removals
- **Type safety**: Maintained 100% TypeScript strict mode compliance
- **Performance**: Optimized callerInfo computation (only computed when includeStack is true)
- **Removed code**: Deleted unused `resetStyle` static getter from ColorUtils

### Test Coverage

- **Target vs Achieved**:
  - Statements: 80% → 95.1% ✓
  - Branches: 70% → 93.12% ✓
  - Functions: 80% → 100% ✓
  - Lines: 95.1% (from 552B ESM, 681B CJS outputs)

## [0.0.2] - Previous releases

See git history for details on earlier versions.
