# lite-log

[![install via GitHub](https://img.shields.io/badge/install-github-4f46e5?logo=github)](https://github.com/chaeco/lite-log)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@chaeco/lite-log?color=06b6d4&label=minzipped)](https://bundlephobia.com/package/@chaeco/lite-log)
[![license](https://img.shields.io/github/license/chaeco/lite-log?color=10b981)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![zero deps](https://img.shields.io/badge/dependencies-zero-f59e0b)](./package.json)

A lightweight frontend logging library written in TypeScript with zero runtime dependencies.  
Derived from [@chaeco/logger](https://github.com/chaeco/logger) with the filesystem layer stripped out for pure browser use.

[中文](./README.zh-CN.md) | [Architecture](./ARCHITECTURE.md)

## Features

- **Log levels**: `debug` / `info` / `warn` / `error` / `silent` — adjustable at runtime
- **Browser colour output**: Uses `%c` CSS syntax to colourise each level — no ANSI codes, no chalk
- **Caller location tracking**: Automatically parses the call stack to display the source file and line number
- **Child loggers**: `logger.child('name')` creates a namespaced child instance that inherits parent config
- **Event hooks**: Listen to internal events such as `levelChange`
- **Custom formatter**: Receives a full `LogEntry` object for complete control over output format
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
logger.debug('Debug info', { userId: 123 })
logger.warn('Something to watch')
logger.error('An error occurred', new Error('oops'))
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
const httpLog = log.child('http')
httpLog.debug('GET /api/user 200')
// Output name: payment:http
```

## Custom Formatter

```ts
import { Logger } from '@chaeco/lite-log'

const log = new Logger({
  name: 'app',
  format: {
    enabled: true,
    formatter: (entry) =>
      `[${entry.level.toUpperCase()}] ${entry.name} — ${entry.message}`,
  },
})
```

## Event Listeners

```ts
log.on('levelChange', (event) => {
  console.log('Level changed', event.data)
})

log.setLevel('warn')
```

## Dynamic Config Update

```ts
log.updateConfig({
  level: 'error',
  console: { colors: false },
})
```

## LoggerOptions Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Logger name shown in output |
| `level` | `LogLevel` | `'info'` | Minimum log level |
| `console.enabled` | `boolean` | `true` | Whether to output to console |
| `console.colors` | `boolean` | `true` | Enable %c CSS colour output |
| `console.timestamp` | `boolean` | `true` | Show timestamp |
| `format.enabled` | `boolean` | `false` | Enable custom formatter function |
| `format.timestampFormat` | `'iso'\|'time'\|'datetime'` | `'time'` | Timestamp format |
| `format.formatter` | `(entry) => string` | — | Custom format function |
| `format.includeStack` | `boolean` | `true` | Show caller location |
| `format.includeName` | `boolean` | `true` | Show logger name |
| `errorHandling.onError` | `(err, ctx) => void` | — | Internal error callback |

## Build

```bash
npm run build        # generate dist/
npm run build:watch  # watch mode
npm run typecheck    # type check only
```

## Project Structure

```
src/
├── index.ts              # Public entry & default root logger
├── core/
│   ├── logger.ts         # Logger core class
│   └── types.ts          # All type definitions
└── utils/
    ├── caller-info.ts    # Call stack parser (LRU cache)
    ├── color-utils.ts    # Browser %c colour style constants
    └── formatter.ts      # Log formatter
```
