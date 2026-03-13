/**
 * 日志等级类型
 * @remarks
 * - debug: 调试信息，最详细的日志级别
 * - info: 一般信息，用于记录正常的系统操作
 * - warn: 警告信息，表示潜在的问题
 * - error: 错误信息，表示系统出现错误
 * - silent: 静默模式，不输出任何日志
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
/**
 * Logger 配置选项
 */
interface LoggerOptions {
    /** 日志等级，默认为 'info' */
    level?: LogLevel;
    /** 控制台输出配置 */
    console?: ConsoleOptions;
    /** Logger 名称，用于区分不同的 logger 实例 */
    name?: string;
    /** 日志格式化配置 */
    format?: FormatOptions;
    /** 错误处理配置 */
    errorHandling?: ErrorHandlingOptions;
}
/**
 * 控制台输出配置选项
 */
interface ConsoleOptions {
    /** 是否启用控制台输出，默认为 true */
    enabled?: boolean;
    /** 是否启用彩色输出，默认为 true */
    colors?: boolean;
    /** 是否显示时间戳，默认为 true */
    timestamp?: boolean;
}
/**
 * 日志条目接口
 * @internal
 */
interface LogEntry {
    /** 日志等级 */
    level: LogLevel;
    /** 日志消息内容 */
    message: string;
    /** 时间戳 */
    timestamp: string;
    /** Logger 名称 */
    name?: string;
    /** 调用者文件路径 */
    file?: string;
    /** 调用者行号 */
    line?: number;
    /** 附加数据 */
    data?: any;
}
/**
 * Logger 事件类型
 */
type LoggerEventType = 'levelChange';
/**
 * Logger 事件处理程序
 */
type LoggerEventHandler = (event: LoggerEvent) => void;
/**
 * Logger 事件接口
 */
interface LoggerEvent {
    /** 事件类型 */
    type: LoggerEventType;
    /** 事件消息 */
    message: string;
    /** 事件发生的时间戳 */
    timestamp: string;
    /** 事件的附加数据 */
    data?: any;
}
/**
 * 日志格式化配置选项
 */
interface FormatOptions {
    /** @deprecated 提供 `formatter` 函数即自动生效，无需单独设置此项 */
    enabled?: boolean;
    /** 日期时间格式字符串（使用 Intl.DateTimeFormat 格式），默认输出 ISO 毫秒时间 */
    timestampFormat?: 'iso' | 'time' | 'datetime';
    /** 自定义格式化函数 */
    formatter?: (entry: LogEntry) => string;
    /** 是否包含调用栈信息，默认为 true */
    includeStack?: boolean;
    /** 是否包含 logger 名称，默认为 true */
    includeName?: boolean;
}
/**
 * 错误处理配置选项
 */
interface ErrorHandlingOptions {
    /** 错误回调函数 */
    onError?: (error: Error, context: string) => void;
}

/**
 * 日志器主类
 * @remarks
 * 扁平结构，无继承。支持多级别日志、浏览器彩色控制台输出、事件钩子与子 Logger。
 */
declare class Logger {
    private level;
    private readonly name;
    private consoleEnabled;
    private readonly formatter;
    private readonly callerInfoHelper;
    private readonly errorHandling;
    private readonly eventHandlers;
    private readonly levelPriority;
    constructor(options?: LoggerOptions);
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
    configureFormat(options: Partial<FormatOptions>): void;
    configureErrorHandling(options: ErrorHandlingOptions): void;
    updateConfig(options: LoggerOptions): void;
    on(type: LoggerEventType, handler: LoggerEventHandler): void;
    off(type: LoggerEventType, handler: LoggerEventHandler): void;
    child(name: string, options?: Pick<LoggerOptions, 'level' | 'format' | 'errorHandling'>): Logger;
    private shouldLog;
    private emitEvent;
    private createLogEntry;
    private writeToConsole;
    private log;
}

/**
 * @chaeco/lite-log - 轻量前端日志库
 *
 * @remarks
 * 基于 chaeco/logger 剥离文件系统后的纯前端版本。
 * 支持多级别日志、浏览器彩色控制台输出（%c CSS）、事件钩子与子 Logger，零运行时依赖。
 *
 * @packageDocumentation
 */

/**
 * 默认 Logger 实例（name: 'app'，level: 'info'）
 */
declare const logger: Logger;

export { Logger, logger as default, logger };
export type { ConsoleOptions, ErrorHandlingOptions, FormatOptions, LogEntry, LogLevel, LoggerEvent, LoggerEventHandler, LoggerEventType, LoggerOptions };
