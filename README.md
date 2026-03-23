# lite-log

[![install via GitHub](https://img.shields.io/badge/install-github-4f46e5?logo=github)](https://github.com/chaeco/lite-log)
[![CI](https://github.com/chaeco/lite-log/actions/workflows/ci.yml/badge.svg)](https://github.com/chaeco/lite-log/actions/workflows/ci.yml)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@chaeco/lite-log?color=06b6d4&label=minzipped)](https://bundlephobia.com/package/@chaeco/lite-log)
[![license](https://img.shields.io/github/license/chaeco/lite-log?color=10b981)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![zero deps](https://img.shields.io/badge/dependencies-zero-f59e0b)](./package.json)

A lightweight frontend logging library written in TypeScript with zero runtime dependencies.  
Derived from [@chaeco/logger](https://github.com/chaeco/logger) with the filesystem layer stripped out for pure browser use.

[中文](./README.zh-CN.md) | [Architecture](./ARCHITECTURE.md)

## Features

- **Log levels**: `debug` / `info` / `warn` / `error` / `silent` — adjustable at runtime
- **Browser colour output**: Uses native `%c` CSS syntax to colourise each level — no ANSI codes, no chalk
- **Caller location tracking**: Parses the Error call stack (LRU-cached) to display the source file and line number
- **Child loggers**: `logger.child('name')` creates a namespaced child that inherits parent config
- **Event hooks**: `on` / `off` listeners for internal events such as `levelChange`
- **Custom formatter**: `format.formatter` receives a full `LogEntry` for complete control over output
- **Multiple build outputs**: ESM / CJS / UMD with bundled `.d.ts` declarations — zero runtime dependencies

## Installation

> **Note**: This package is not yet published to npm. Install directly from GitHub.

```bash
npm install github:chaeco/lite-log
```

## Quick Start

```ts
import logger from '@chaeco/lite-log'

logger.info('App started')
logger.debug('Fetched user', { userId: 123 })
logger.warn('Slow response detected')
logger.error('Request failed', new Error('timeout'))

// Pass an Error directly — message is extracted automatically
logger.error(new Error('unexpected state'))
```

## Create a Standalone Logger

```ts
import { Logger } from '@chaeco/lite-log'

const log = new Logger({
  name: 'payment',
  level: 'debug',
  console: { colors: true, timestamp: true },
})

log.info('Payment request', { amount: 100 })
```

## Child Logger

```ts
// Inherits level, console, and format from parent
const httpLog = log.child('http')
httpLog.debug('GET /api/user 200')
// Output prefix: payment:http

// Override level or format for the child only
const verboseLog = log.child('debug', { level: 'debug' })
```

## Custom Formatter

```ts
import { Logger, LogEntry } from '@chaeco/lite-log'

const log = new Logger({
  name: 'app',
  format: {
    formatter: (entry: LogEntry) =>
      `[${entry.level.toUpperCase()}] ${entry.name} — ${entry.message}`,
  },
})
```

When `format.formatter` is provided, it **replaces the entire default output**. The function receives a `LogEntry` (see [LogEntry interface](#logentry-interface)) and must return a plain string.

## Event Listeners

```ts
const handler = (event) => {
  console.log('Level changed', event.data)
}

log.on('levelChange', handler)
log.setLevel('warn')

// Remove the listener when no longer needed
log.off('levelChange', handler)
```

## Runtime Config Updates

```ts
// Update any combination of options at runtime
log.updateConfig({
  level: 'error',
  console: { colors: false },
})

// Update format options only
log.configureFormat({
  timestampFormat: 'datetime',
  includeStack: false,
})
```

## LogEntry Interface

The `LogEntry` object is passed to `format.formatter` and emitted in log events:

```ts
interface LogEntry {
  level:     LogLevel          // 'debug' | 'info' | 'warn' | 'error' | 'silent'
  message:   string            // Log message string
  timestamp: string            // ISO 8601 timestamp
  name?:     string            // Logger name
  file?:     string            // Caller file path (URL pathname in browser)
  line?:     number            // Caller line number
  data?:     any               // Extra data: second argument when first is a string;
                               // the Error object itself when only an Error is passed;
                               // { error, additionalData } when an Error is followed by extra args
}
```

## LoggerOptions Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Logger name shown in output |
| `level` | `LogLevel` | `'info'` | Minimum log level |
| `console.enabled` | `boolean` | `true` | Whether to write to the browser console |
| `console.colors` | `boolean` | `true` | Enable `%c` CSS colour output |
| `console.timestamp` | `boolean` | `true` | Show timestamp prefix |
| `format.timestampFormat` | `'iso' \| 'time' \| 'datetime'` | `'time'` | Timestamp format (`'time'` → `HH:mm:ss.mmm`) |
| `format.formatter` | `(entry: LogEntry) => string` | — | Custom format function; replaces default output |
| `format.includeStack` | `boolean` | `true` | Append caller file and line number (caller info is only computed when true) |
| `format.includeName` | `boolean` | `true` | Append logger name |
| `format.enabled` | `boolean` | — | **Deprecated** — providing `formatter` is sufficient |
| `errorHandling.onError` | `(error: Error, context: string) => void` | — | Called when an internal error occurs: `format.formatter` throws, or an event listener throws. `context` is either `'formatter'` or `'eventHandler'`. |

## Logger API

| Method | Signature | Description |
|---|---|---|
| `debug` | `(...args: any[]) => void` | Log at debug level |
| `info` | `(...args: any[]) => void` | Log at info level |
| `warn` | `(...args: any[]) => void` | Log at warn level |
| `error` | `(...args: any[]) => void` | Log at error level |
| `setLevel` | `(level: LogLevel) => void` | Change the active log level |
| `getLevel` | `() => LogLevel` | Return the current log level |
| `child` | `(name: string, options?) => Logger` | Create a namespaced child logger |
| `on` | `(type, handler) => void` | Register an event listener |
| `off` | `(type, handler) => void` | Remove an event listener |
| `updateConfig` | `(options: LoggerOptions) => void` | Partial update of any config option |
| `configureFormat` | `(options: Partial<FormatOptions>) => void` | Update format options only |
| `configureErrorHandling` | `(options: ErrorHandlingOptions) => void` | Update error handling only |

## Build

```bash
npm run build          # generate dist/
npm run build:watch    # watch mode
npm run typecheck      # type check only
npm run test           # run tests
npm run test:coverage  # run tests with coverage report
```

## Project Structure

```
src/
├── index.ts              # Public entry & default logger (name: 'app', level: 'info')
├── core/
│   ├── logger.ts         # Logger class
│   └── types.ts          # All exported type definitions
└── utils/
    ├── caller-info.ts    # Error stack parser with LRU cache
    ├── color-utils.ts    # Browser %c CSS colour constants
    └── formatter.ts      # LogFormatter — builds console args or plain text
```
