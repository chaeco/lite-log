/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LogLevel, LoggerOptions, LogEntry,
  LoggerEventType, LoggerEventHandler, LoggerEvent,
  FormatOptions, ErrorHandlingOptions,
} from './types'
import { CallerInfoHelper } from '../utils/caller-info'
import { LogFormatter } from '../utils/formatter'

/**
 * 日志器主类
 * @remarks
 * 扁平结构，无继承。支持多级别日志、浏览器彩色控制台输出、事件钩子与子 Logger。
 */
export class Logger {
  private level: LogLevel
  private readonly name: string | undefined
  private consoleEnabled: boolean
  private readonly formatter: LogFormatter
  private readonly callerInfoHelper = new CallerInfoHelper()
  private readonly errorHandling: Required<ErrorHandlingOptions> = {
    onError: undefined as any,
  }
  private readonly eventHandlers: Map<LoggerEventType, LoggerEventHandler[]> = new Map()
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0, info: 1, warn: 2, error: 3, silent: 999,
  }

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info'
    this.name = options.name

    this.consoleEnabled = options.console?.enabled ?? true

    this.formatter = new LogFormatter({
      consoleColors: options.console?.colors ?? true,
      consoleTimestamp: options.console?.timestamp ?? true,
      format: {
        enabled: options.format?.enabled ?? false,
        timestampFormat: options.format?.timestampFormat ?? 'time',
        formatter: options.format?.formatter,
        includeStack: options.format?.includeStack ?? true,
        includeName: options.format?.includeName ?? true,
      },
    })

    if (options.errorHandling) this.configureErrorHandling(options.errorHandling)
  }

  // ─── 核心日志方法 ─────────────────────────────────────────

  debug(...args: any[]): void { this.log('debug', ...args) }
  info(...args: any[]): void { this.log('info', ...args) }
  warn(...args: any[]): void { this.log('warn', ...args) }
  error(...args: any[]): void { this.log('error', ...args) }

  // ─── 等级控制 ─────────────────────────────────────────────

  setLevel(level: LogLevel): void {
    const old = this.level
    this.level = level
    this.emitEvent('levelChange', `日志等级已从 ${old} 更改为 ${level}`, { oldLevel: old, newLevel: level })
  }

  getLevel(): LogLevel { return this.level }

  // ─── 配置 ─────────────────────────────────────────────────

  configureFormat(options: Partial<FormatOptions>): void {
    this.formatter.updateFormat(options)
  }

  configureErrorHandling(options: ErrorHandlingOptions): void {
    if (options.onError !== undefined) this.errorHandling.onError = options.onError
  }

  updateConfig(options: LoggerOptions): void {
    if (options.level !== undefined) this.setLevel(options.level)
    if (options.console !== undefined) {
      this.consoleEnabled = options.console.enabled ?? this.consoleEnabled
      this.formatter.settings.consoleColors = options.console.colors ?? this.formatter.settings.consoleColors
      this.formatter.settings.consoleTimestamp = options.console.timestamp ?? this.formatter.settings.consoleTimestamp
    }
    if (options.format) this.configureFormat(options.format)
    if (options.errorHandling) this.configureErrorHandling(options.errorHandling)
  }

  // ─── 事件 ────────────────────────────────────────────────

  on(type: LoggerEventType, handler: LoggerEventHandler): void {
    if (!this.eventHandlers.has(type)) this.eventHandlers.set(type, [])
    this.eventHandlers.get(type)!.push(handler)
  }

  off(type: LoggerEventType, handler: LoggerEventHandler): void {
    const handlers = this.eventHandlers.get(type)
    if (!handlers) return
    const i = handlers.indexOf(handler)
    if (i > -1) handlers.splice(i, 1)
  }

  // ─── 子 Logger ───────────────────────────────────────────

  child(name: string, options?: Pick<LoggerOptions, 'level' | 'format' | 'errorHandling'>): Logger {
    const { consoleColors, consoleTimestamp, format } = this.formatter.settings
    return new Logger({
      level: options?.level ?? this.level,
      name: this.name ? `${this.name}:${name}` : name,
      console: { enabled: this.consoleEnabled, colors: consoleColors, timestamp: consoleTimestamp },
      format: options?.format ?? { ...format },
      errorHandling: options?.errorHandling ?? { ...this.errorHandling },
    })
  }

  // ─── 内部实现 ────────────────────────────────────────────

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.level]
  }

  private emitEvent(type: LoggerEventType, message: string, data?: any): void {
    const handlers = this.eventHandlers.get(type)
    if (!handlers?.length) return
    const event: LoggerEvent = {
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
    for (const h of handlers) {
      try { h(event) } catch (e) { console.error('Error in logger event handler:', e) }
    }
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    const { file, line } = this.callerInfoHelper.getCallerInfo()
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    if (this.name) entry.name = this.name
    if (file) entry.file = file
    if (line) entry.line = line
    return entry
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.consoleEnabled) return
    const parts = this.formatter.formatConsoleMessage(entry)
    const fn: (...a: any[]) => void =
      entry.level === 'error' ? console.error :
        entry.level === 'warn' ? console.warn :
          console.log
    fn(...parts)
  }

  private log(level: LogLevel, ...args: any[]): void {
    if (!this.shouldLog(level)) return

    let message: string
    let data: any

    if (args.length === 0) {
      message = ''
      data = undefined
    } else if (typeof args[0] === 'string') {
      message = args[0]
      data = args.length === 2 ? args[1] : args.length > 2 ? args.slice(1) : undefined
    } else if (args[0] instanceof Error) {
      message = args[0].message || String(args[0])
      data = args.length > 1 ? { error: args[0], additionalData: args.slice(1) } : args[0]
    } else {
      message = ''
      data = args.length === 1 ? args[0] : args
    }

    const entry = this.createLogEntry(level, message, data)
    this.writeToConsole(entry)
  }
}
