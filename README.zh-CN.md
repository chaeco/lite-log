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
- **浏览器彩色输出**：使用原生 `%c` CSS 语法为不同级别着色，无 ANSI 依赖，无 chalk
- **调用位置追踪**：解析 Error 调用栈（附 LRU 缓存），输出触发日志的文件路径与行号
- **子 Logger**：`logger.child('name')` 创建命名空间子实例，继承父级全部配置
- **事件钩子**：`on` / `off` 监听 `levelChange` 等内部事件
- **自定义 Formatter**：`format.formatter` 接收完整 `LogEntry`，自由控制输出格式
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
logger.debug('获取用户', { userId: 123 })
logger.warn('响应较慢')
logger.error('请求失败', new Error('timeout'))

// 直接传 Error 对象 — 自动提取 message
logger.error(new Error('unexpected state'))
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
// 继承父级的 level、console、format 配置
const httpLog = log.child('http')
httpLog.debug('GET /api/user 200')
// 输出前缀：payment:http

// 为子 Logger 单独覆盖 level 或 format
const verboseLog = log.child('debug', { level: 'debug' })
```

## 自定义 Formatter

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

提供 `format.formatter` 后，**将完全替换默认输出**。函数接收一个 `LogEntry`（见 [LogEntry 接口](#logentry-接口)），返回纯文本字符串。

## 事件监听

```ts
const handler = (event) => {
  console.log('级别变更', event.data)
}

log.on('levelChange', handler)
log.setLevel('warn')

// 不再需要时移除监听
log.off('levelChange', handler)
```

## 运行时配置更新

```ts
// 更新任意配置项
log.updateConfig({
  level: 'error',
  console: { colors: false },
})

// 仅更新格式化选项
log.configureFormat({
  timestampFormat: 'datetime',
  includeStack: false,
})
```

## LogEntry 接口

`format.formatter` 接收的 `LogEntry` 对象结构如下：

```ts
interface LogEntry {
  level:     LogLevel          // 'debug' | 'info' | 'warn' | 'error' | 'silent'
  message:   string            // 日志消息
  timestamp: string            // ISO 8601 时间戳
  name?:     string            // Logger 名称
  file?:     string            // 调用者文件路径（浏览器中为 URL pathname）
  line?:     number            // 调用者行号
  data?:     any               // 第二参数传入的附加数据
}
```

## LoggerOptions 完整参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `name` | `string` | — | Logger 名称，显示在输出中 |
| `level` | `LogLevel` | `'info'` | 最低输出等级 |
| `console.enabled` | `boolean` | `true` | 是否写入浏览器控制台 |
| `console.colors` | `boolean` | `true` | 是否启用 `%c` 彩色输出 |
| `console.timestamp` | `boolean` | `true` | 是否显示时间戳前缀 |
| `format.timestampFormat` | `'iso' \| 'time' \| 'datetime'` | `'time'` | 时间戳格式（`'time'` → `HH:mm:ss.mmm`） |
| `format.formatter` | `(entry: LogEntry) => string` | — | 自定义格式化函数，替换默认输出 |
| `format.includeStack` | `boolean` | `true` | 是否追加调用文件和行号 |
| `format.includeName` | `boolean` | `true` | 是否追加 logger 名称 |
| `format.enabled` | `boolean` | — | **已废弃** — 提供 `formatter` 即自动生效 |
| `errorHandling.onError` | `(error: Error, context: string) => void` | — | logger 内部发生错误时的回调 |

## Logger API

| 方法 | 签名 | 说明 |
|---|---|---|
| `debug` | `(...args: any[]) => void` | 输出 debug 级别日志 |
| `info` | `(...args: any[]) => void` | 输出 info 级别日志 |
| `warn` | `(...args: any[]) => void` | 输出 warn 级别日志 |
| `error` | `(...args: any[]) => void` | 输出 error 级别日志 |
| `setLevel` | `(level: LogLevel) => void` | 修改当前日志等级 |
| `getLevel` | `() => LogLevel` | 获取当前日志等级 |
| `child` | `(name: string, options?) => Logger` | 创建命名空间子 logger |
| `on` | `(type, handler) => void` | 注册事件监听 |
| `off` | `(type, handler) => void` | 移除事件监听 |
| `updateConfig` | `(options: LoggerOptions) => void` | 部分更新任意配置项 |
| `configureFormat` | `(options: Partial<FormatOptions>) => void` | 仅更新格式化选项 |
| `configureErrorHandling` | `(options: ErrorHandlingOptions) => void` | 仅更新错误处理配置 |

## 构建

```bash
npm run build        # 生成 dist/
npm run build:watch  # 监听模式
npm run typecheck    # 仅类型检查
```

## 目录结构

```
src/
├── index.ts              # 公共入口 & 默认 logger（name: 'app'，level: 'info'）
├── core/
│   ├── logger.ts         # Logger 类
│   └── types.ts          # 全部导出类型定义
└── utils/
    ├── caller-info.ts    # Error 调用栈解析（附 LRU 缓存）
    ├── color-utils.ts    # 浏览器 %c CSS 颜色常量
    └── formatter.ts      # LogFormatter — 构建控制台参数或纯文本
```