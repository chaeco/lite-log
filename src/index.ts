/**
 * @chaeco/lite-log - 轻量前端日志库
 *
 * @remarks
 * 基于 chaeco/logger 剥离文件系统后的纯前端版本。
 * 支持多级别日志、浏览器彩色控制台输出（%c CSS）、事件钩子与子 Logger，零运行时依赖。
 *
 * @packageDocumentation
 */

import { Logger } from './core/logger';
export { Logger };

export type {
  LogLevel,
  LoggerOptions,
  ConsoleOptions,
  LogEntry,
  LoggerEventType,
  LoggerEventHandler,
  LoggerEvent,
  FormatOptions,
  ErrorHandlingOptions,
} from './core/types';

/**
 * 默认 Logger 实例（name: 'app'，level: 'info'）
 */
export const logger = new Logger({
  name: 'app',
  console: { enabled: true, colors: true, timestamp: true },
});

export default logger;
