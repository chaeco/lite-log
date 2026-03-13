# Architecture / 架构图

[English](#architecture-overview) | [中文](#架构说明)

---

## 架构说明

### 整体分层

```
┌─────────────────────────────────────────────────────────────┐
│                        Public API                           │
│              import logger from '@chaeco/lite-log'          │
│              import { Logger } from '@chaeco/lite-log'      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      src/index.ts                           │
│          默认 logger 实例 + 公共类型 & 类的再导出             │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼────────┐             ┌──────────▼──────────┐
│  core/logger.ts  │             │   core/types.ts      │
│                  │             │                      │
│  class Logger    │◄────────────│  LogLevel            │
│  ─────────────   │  uses       │  LoggerOptions       │
│  debug()         │             │  ConsoleOptions      │
│  info()          │             │  FormatOptions       │
│  warn()          │             │  ErrorHandlingOptions│
│  error()         │             │  LogEntry            │
│  setLevel()      │             │  LoggerEvent         │
│  getLevel()      │             └──────────────────────┘
│  child()         │
│  on() / off()    │
│  updateConfig()  │
│  configureFormat()│
└────────┬─────────┘
         │ uses
    ┌────┴──────────────────────────┐
    │                               │
┌───▼──────────────────┐  ┌────────▼───────────────┐
│ utils/caller-info.ts │  │  utils/formatter.ts     │
│                      │  │                         │
│ class CallerInfoHelper│  │  class LogFormatter     │
│ ──────────────────── │  │  ──────────────────     │
│ getCallerInfo()      │  │  formatMessage()        │
│                      │  │  formatConsoleMessage() │
│ • Error 堆栈解析      │  │  updateFormat()         │
│ • 53-bit LRU 缓存    │  │                         │
│ • 浏览器 URL 路径简化 │  │  • 纯文本格式           │
└──────────────────────┘  │  • %c 彩色格式串        │
                          │  • 自定义 formatter 优先 │
                          └────────────┬────────────┘
                                       │ uses
                          ┌────────────▼────────────┐
                          │  utils/color-utils.ts   │
                          │                         │
                          │  class ColorUtils       │
                          │  ─────────────────      │
                          │  getLevelStyle()        │
                          │  getMessageStyle()      │
                          │  timestampStyle         │
                          │  nameStyle              │
                          │  locationStyle          │
                          │                         │
                          │  • CSS 颜色常量表        │
                          └─────────────────────────┘
```

### 日志调用流程

```
调用方代码
    │
    │ log.info('message', data)
    ▼
Logger.log(level, ...args)
    │
    ├─► shouldLog(level)  ──► 不满足等级 ──► 丢弃
    │
    ▼ 满足等级
CallerInfoHelper.getCallerInfo()
    │  解析 Error 堆栈，提取 file + line
    │  命中缓存则直接返回
    ▼
Logger.createLogEntry()
    │  构造 LogEntry { level, message, timestamp, name, file, line, data }
    ▼
LogFormatter.formatConsoleMessage(entry)
    │
    ├── 启用自定义 formatter → formatter(entry) → string[]
    │
    ├── 无色模式 → buildPlainText() → string[]
    │
    └── 彩色模式 → 构建 %c 格式串 → [ fmtStr, ...cssStyles, ?data ]
                        │
                        └── ColorUtils 提供 CSS 常量
    ▼
console.log / console.warn / console.error (...parts)
    │
    ▼
浏览器 DevTools 彩色输出
```

### 子 Logger 继承关系

```
new Logger({ name: 'app', level: 'info' })
          │
          │ .child('payment')
          ▼
Logger { name: 'app:payment', level: 'info' }   ← 继承父级 console/format 配置
          │
          │ .child('stripe')
          ▼
Logger { name: 'app:payment:stripe', level: 'info' }
```

### 构建产物

```
dist/
├── index.js          ESM (import)
├── index.cjs         CommonJS (require)
├── index.umd.js      UMD (script 标签 / CDN)  window.LiteLog
└── index.d.ts        TypeScript 类型声明（rollup-plugin-dts 合并）
```

---

## Architecture Overview

### Layered Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Public API                           │
│              import logger from '@chaeco/lite-log'          │
│              import { Logger } from '@chaeco/lite-log'      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      src/index.ts                           │
│          default logger instance + re-exports               │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼────────┐             ┌──────────▼──────────┐
│  core/logger.ts  │             │   core/types.ts      │
│                  │◄────────────│  All type definitions│
│  class Logger    │  uses       └──────────────────────┘
│  (flat, no inh.) │
└────────┬─────────┘
         │ uses
    ┌────┴──────────────────────────┐
    │                               │
┌───▼──────────────────┐  ┌────────▼───────────────┐
│ utils/caller-info.ts │  │  utils/formatter.ts     │
│                      │  │                         │
│ Error stack parser   │  │  Plain text & %c colour │
│ LRU cache (53-bit)   │  │  format builder         │
│ Browser URL trimming │  └────────────┬────────────┘
└──────────────────────┘               │ uses
                          ┌────────────▼────────────┐
                          │  utils/color-utils.ts   │
                          │  CSS colour constants   │
                          └─────────────────────────┘
```

### Log Call Flow

```
User code
    │
    │ log.info('message', data)
    ▼
Logger.log(level, ...args)
    │
    ├─► shouldLog(level) ──► below threshold ──► discard
    │
    ▼ passes threshold
CallerInfoHelper.getCallerInfo()
    │  parse Error stack → file + line  (LRU cached)
    ▼
Logger.createLogEntry()
    │  build LogEntry { level, message, timestamp, name, file, line, data }
    ▼
LogFormatter.formatConsoleMessage(entry)
    │
    ├── custom formatter enabled → formatter(entry) → string[]
    ├── no-colour mode → buildPlainText() → string[]
    └── colour mode → %c format string → [ fmtStr, ...cssStyles, ?data ]
                           └── ColorUtils provides CSS constants
    ▼
console.log / console.warn / console.error (...parts)
    ▼
Browser DevTools colourised output
```

### Child Logger Inheritance

```
new Logger({ name: 'app', level: 'info' })
          │
          │ .child('payment')
          ▼
Logger { name: 'app:payment' }   ← inherits console/format config
          │
          │ .child('stripe')
          ▼
Logger { name: 'app:payment:stripe' }
```

### Build Outputs

```
dist/
├── index.js          ESM  (import)
├── index.cjs         CommonJS  (require)
├── index.umd.js      UMD  (script tag / CDN)  window.LiteLog
└── index.d.ts        TypeScript declarations  (merged by rollup-plugin-dts)
```
