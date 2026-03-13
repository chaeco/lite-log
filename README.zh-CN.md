# lite-log

[![install via GitHub](https://img.shields.io/badge/install-github-4f46e5?logo=github)](https://github.com/chaeco/lite-log)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@chaeco/lite-log?color=06b6d4&label=minzipped)](https://bundlephobia.com/package/@chaeco/lite-log)
[![license](https://img.shields.io/github/license/chaeco/lite-log?color=10b981)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![zero deps](https://img.shields.io/badge/依赖-零-f59e0b)](./package.json)

轻量的前端日志库，基于 TypeScript 开发，零运行时依赖。  
从 [@chaeco/logger](https://github.com/chaeco/logger) 剥离文件系统模块后的纯浏览器版本。

[English](./README.md) | [架构图](./ARCHITECTURE.md)

## 特性

- **分级日志**：`debug` / `info` / `warn` / `error` / `silent`，支持运行时动态调整
- **浏览器彩色输出**：使用 `%c` CSS 语法为不同级别着色，无 ANSI 依赖
- **调用位置追踪**：自动解析调用栈，输出触发日志的文件路径与行号
- **子 Logger**：`logger.child('name')` 创建命名空间子实例，继承父级配置
- **事件钩子**：监听 `levelChange` 等内部事件
- **自定义 Formatter**：提供完整 `LogEntry` 对象，自由控制输出格式
- **多格式产物**：ESM / CJS / UMD，随附 `.d.ts` 类型声明，零运行时依赖

## 安装

> **注意**：当前尚未发布到 npm，请直接通过 GitHub 安装。

```bash
npm install github:chaeco/lite-log
```

## 快速上手

```ts
import logger from '@chaeco/lite-log'

logger.info('应用启动')
logger.debug('调试信息', { userId: 123 })
logger.warn('注意事项')
logger.error('发生错误', new Error('oops'))
```

## 创建独立 Logger

```ts
import { Logger } from '@chaeco/lite-log'

const log = new Logger({
  name: 'payment',
  level: 'debug',
  console: { colors: true, timestamp: true },
})

log.info('支付请求', { amount: 100 })
```

## 子 Logger

```ts
const httpLog = log.child('http')
httpLog.debug('GET /api/user 200')
// 输出名称: payment:http
```

## 自定义 Formatter

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

## 事件监听

```ts
log.on('levelChange', (event) => {
  console.log('级别变更', event.data)
})

log.setLevel('warn')
```

## 动态更新配置

```ts
log.updateConfig({
  level: 'error',
  console: { colors: false },
})
```

## LoggerOptions 完整参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `name` | `string` | — | Logger 名称，显示在输出中 |
| `level` | `LogLevel` | `'info'` | 最低输出等级 |
| `console.enabled` | `boolean` | `true` | 是否输出到控制台 |
| `console.colors` | `boolean` | `true` | 是否启用 %c 彩色输出 |
| `console.timestamp` | `boolean` | `true` | 是否显示时间戳 |
| `format.enabled` | `boolean` | `false` | 是否启用自定义 formatter |
| `format.timestampFormat` | `'iso'\|'time'\|'datetime'` | `'time'` | 时间戳格式 |
| `format.formatter` | `(entry) => string` | — | 自定义格式化函数 |
| `format.includeStack` | `boolean` | `true` | 是否显示调用位置 |
| `format.includeName` | `boolean` | `true` | 是否显示 logger 名称 |
| `errorHandling.onError` | `(err, ctx) => void` | — | 内部错误回调 |

## 构建

```bash
npm run build        # 生成 dist/
npm run build:watch  # 监听模式
npm run typecheck    # 仅类型检查
```

## 目录结构

```
src/
├── index.ts              # 公共入口 & 默认根 logger
├── core/
│   ├── logger.ts         # Logger 核心类
│   └── types.ts          # 全部类型定义
└── utils/
    ├── caller-info.ts    # 调用栈解析（LRU 缓存）
    ├── color-utils.ts    # 浏览器 %c 颜色样式常量
    └── formatter.ts      # 日志格式化器
```