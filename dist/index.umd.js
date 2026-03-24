(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LiteLog = {}));
})(this, (function (exports) { 'use strict';

    /**
     * 调用栈解析工具
     * @internal
     * 负责从 Error 堆栈中提取调用日志方法的文件路径和行号，并带 LRU 缓存。
     * 兼容浏览器与 Node.js 运行时。
     */
    class CallerInfoHelper {
        constructor(maxCacheSize = 500) {
            this.cache = new Map();
            this.maxCacheSize = maxCacheSize;
        }
        /**
         * 获取当前调用者的文件路径和行号
         */
        getCallerInfo() {
            var _a;
            const error = new Error();
            const stack = error.stack;
            if (!stack)
                return {};
            const stackHash = this.simpleHash(stack);
            const cached = this.cache.get(stackHash);
            if (cached) {
                // refresh order for LRU
                this.cache.delete(stackHash);
                this.cache.set(stackHash, cached);
                return cached;
            }
            const stackLines = stack.split('\n');
            for (let i = 0; i < stackLines.length; i++) {
                const line = (_a = stackLines[i]) === null || _a === void 0 ? void 0 : _a.trim();
                if (!line)
                    continue;
                if (line.startsWith('Error'))
                    continue;
                // 跳过所有 logger 内部帧
                if (line.includes('Logger.log') ||
                    line.includes('Logger.info') ||
                    line.includes('Logger.warn') ||
                    line.includes('Logger.error') ||
                    line.includes('Logger.debug') ||
                    line.includes('Logger.createLogEntry') ||
                    line.includes('getCallerInfo') ||
                    line.includes('CallerInfoHelper')) {
                    continue;
                }
                // 匹配文件路径和行号（支持 V8 和 SpiderMonkey 格式）
                const match = line.match(/\((.+?):(\d+):\d+\)$/) || line.match(/at (.+?):(\d+):\d+$/);
                if (match && match[1] && match[2]) {
                    const filePath = match[1];
                    const lineNumber = parseInt(match[2], 10);
                    if (filePath && !filePath.includes('node:internal') && !filePath.includes('node_modules')) {
                        // 浏览器：保留 URL 中 origin 之后的路径部分，使其简洁
                        let simplifiedPath = filePath;
                        try {
                            const url = new URL(filePath);
                            simplifiedPath = url.pathname + (url.search || '');
                        }
                        catch (_b) {
                            // 非 URL（如 Node.js 绝对路径），保持原样
                        }
                        const result = { file: simplifiedPath, line: lineNumber };
                        this.cacheResult(stackHash, result);
                        return result;
                    }
                }
            }
            return {};
        }
        /** 清除缓存 */
        clearCache() {
            this.cache.clear();
        }
        /** 获取缓存大小（调试用） */
        getCacheSize() {
            return this.cache.size;
        }
        // ─── 私有方法 ─────────────────────────────────────────────
        /**
         * 53 位非加密哈希（双 32 位混合）
         * 参考：https://stackoverflow.com/a/52171480
         */
        simpleHash(str) {
            let h1 = 0xdeadbeef;
            let h2 = 0x41c6ce57;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                h1 = Math.imul(h1 ^ char, 2654435761);
                h2 = Math.imul(h2 ^ char, 1597334677);
            }
            h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
            h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
            const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);
            return hash.toString(36);
        }
        /** LRU 缓存写入：满时淘汰最旧项 */
        cacheResult(key, info) {
            if (this.cache.size >= this.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                if (firstKey !== undefined) {
                    this.cache.delete(firstKey);
                }
            }
            this.cache.set(key, info);
        }
    }

    /**
     * 浏览器控制台颜色工具
     * @internal
     * @remarks
     * 使用 %c CSS 语法为不同日志级别提供颜色样式。
     */
    const LEVEL_STYLES = {
        debug: 'color:#8b5cf6;font-weight:bold',
        info: 'color:#3b82f6;font-weight:bold',
        warn: 'color:#f59e0b;font-weight:bold',
        error: 'color:#ef4444;font-weight:bold',
    };
    const MESSAGE_STYLES = {
        debug: 'color:#8b5cf6',
        info: 'color:#3b82f6',
        warn: 'color:#f59e0b',
        error: 'color:#ef4444',
    };
    const RESET_STYLE = 'color:inherit';
    class ColorUtils {
        static getLevelStyle(level) {
            var _a;
            return (_a = LEVEL_STYLES[level.toLowerCase()]) !== null && _a !== void 0 ? _a : 'color:inherit;font-weight:bold';
        }
        static getMessageStyle(level) {
            var _a;
            return (_a = MESSAGE_STYLES[level.toLowerCase()]) !== null && _a !== void 0 ? _a : RESET_STYLE;
        }
        static get timestampStyle() {
            return 'color:#6b7280';
        }
        static get nameStyle() {
            return 'color:#06b6d4';
        }
        static get locationStyle() {
            return 'color:#6b7280';
        }
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    /**
     * 将时间戳字符串按格式简化输出
     */
    function formatTimestamp(ts, fmt) {
        switch (fmt) {
            case 'time':
                return ts.slice(11, 23); // HH:mm:ss.mmm
            case 'datetime':
                return ts.slice(0, 23).replace('T', ' '); // YYYY-MM-DD HH:mm:ss.mmm
            case 'iso':
            default:
                return ts;
        }
    }
    /**
     * 日志格式化器
     * @internal
     * 负责将 LogEntry 转换为可输出的字符串。
     * - `formatConsoleMessage`: 返回 `string[]`，第 0 项为
     *   带 %c 占位符的格式串，后续项为对应 CSS 样式字符串（浏览器彩色模式）；
     *   无色模式下返回单元素数组 `[plainText]`。
     * - `formatMessage`: 返回纯文本字符串，用于 MemoryTransport 等场景。
     */
    class LogFormatter {
        constructor(settings) {
            this.settings = settings;
        }
        /** 更新格式化选项（支持部分更新） */
        updateFormat(options) {
            const f = this.settings.format;
            // options.enabled 已废弃，忽略
            if (options.timestampFormat !== undefined)
                f.timestampFormat = options.timestampFormat;
            if (options.formatter !== undefined)
                f.formatter = options.formatter;
            if (options.includeStack !== undefined)
                f.includeStack = options.includeStack;
            if (options.includeName !== undefined)
                f.includeName = options.includeName;
        }
        // ─── 公开格式化方法 ───────────────────────────────────────
        /**
         * 格式化为纯文本字符串（适合 MemoryTransport 等记录场景）
         */
        formatMessage(entry) {
            var _a, _b;
            const { format } = this.settings;
            if (format.formatter) {
                try {
                    return format.formatter(entry);
                }
                catch (e) {
                    (_b = (_a = this.settings).onError) === null || _b === void 0 ? void 0 : _b.call(_a, e instanceof Error ? e : new Error(String(e)), 'formatter');
                    // fallthrough to default format
                }
            }
            return this.buildPlainText(entry);
        }
        /**
         * 格式化为控制台输出参数数组。
         * 彩色模式：`[formatStr, ...cssStyles]`，用于 `console.log(...parts)`。
         * 无色模式：`[plainText]`。
         */
        formatConsoleMessage(entry) {
            var _a, _b;
            const { consoleColors, consoleTimestamp, format } = this.settings;
            if (format.formatter) {
                try {
                    return [format.formatter(entry)];
                }
                catch (e) {
                    (_b = (_a = this.settings).onError) === null || _b === void 0 ? void 0 : _b.call(_a, e instanceof Error ? e : new Error(String(e)), 'formatter');
                    // fallthrough to default format
                }
            }
            if (!consoleColors) {
                return [this.buildPlainText(entry, consoleTimestamp)];
            }
            // ── 彩色模式：构建 %c 格式串 ──
            const fmtParts = [];
            const styles = [];
            // 时间戳
            if (consoleTimestamp) {
                fmtParts.push(`%c[${formatTimestamp(entry.timestamp, format.timestampFormat)}]`);
                styles.push(ColorUtils.timestampStyle);
            }
            // logger 名称
            if (format.includeName && entry.name) {
                fmtParts.push(`%c[${entry.name}]`);
                styles.push(ColorUtils.nameStyle);
            }
            // 日志级别
            fmtParts.push(`%c${entry.level.toUpperCase().padEnd(5)}`);
            styles.push(ColorUtils.getLevelStyle(entry.level));
            // 调用位置
            if (format.includeStack && entry.file && entry.line) {
                fmtParts.push(`%c(${entry.file}:${entry.line})`);
                styles.push(ColorUtils.locationStyle);
            }
            // 消息本体
            fmtParts.push(`%c${entry.message}`);
            styles.push(ColorUtils.getMessageStyle(entry.level));
            // 附加数据（不加 %c，直接追加到 console 参数）
            const fmtStr = fmtParts.join(' ');
            if (entry.data !== undefined) {
                return [fmtStr, ...styles, entry.data];
            }
            return [fmtStr, ...styles];
        }
        // ─── 私有辅助 ────────────────────────────────────────────
        buildPlainText(entry, includeTimestamp = true) {
            const { format } = this.settings;
            const parts = [];
            if (includeTimestamp) {
                parts.push(`[${formatTimestamp(entry.timestamp, format.timestampFormat)}]`);
            }
            if (format.includeName && entry.name)
                parts.push(`[${entry.name}]`);
            parts.push(entry.level.toUpperCase().padEnd(5));
            if (format.includeStack && entry.file && entry.line) {
                parts.push(`(${entry.file}:${entry.line})`);
            }
            parts.push(entry.message);
            if (entry.data !== undefined)
                parts.push(this.safeStringify(entry.data));
            return parts.join(' ');
        }
        /** 安全 JSON 序列化，处理循环引用及 Error 对象的不可枚举属性 */
        safeStringify(obj, indent) {
            if (obj === null || typeof obj !== 'object')
                return String(obj);
            // Error 的 message/name/stack 均为不可枚举属性，JSON.stringify 会返回 {}
            if (obj instanceof Error)
                return `[${obj.name}: ${obj.message}]`;
            try {
                const seen = new WeakSet();
                return JSON.stringify(obj, (_key, value) => {
                    if (value instanceof Error)
                        return `[${value.name}: ${value.message}]`;
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value))
                            return '[Circular]';
                        seen.add(value);
                    }
                    return value;
                }, indent);
            }
            catch (_a) {
                try {
                    return String(obj);
                }
                catch (_b) {
                    return '[Unable to serialize]';
                }
            }
        }
    }

    /**
     * 日志器主类
     * @remarks
     * 扁平结构，无继承。支持多级别日志、浏览器彩色控制台输出、事件钩子与子 Logger。
     */
    class Logger {
        constructor(options = {}) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            this.callerInfoHelper = new CallerInfoHelper();
            this.errorHandling = {};
            this.eventHandlers = new Map();
            this.levelPriority = {
                debug: 0,
                info: 1,
                warn: 2,
                error: 3,
                silent: 999,
            };
            this.level = (_a = options.level) !== null && _a !== void 0 ? _a : 'info';
            this.name = options.name;
            this.consoleEnabled = (_c = (_b = options.console) === null || _b === void 0 ? void 0 : _b.enabled) !== null && _c !== void 0 ? _c : true;
            this.formatter = new LogFormatter({
                consoleColors: (_e = (_d = options.console) === null || _d === void 0 ? void 0 : _d.colors) !== null && _e !== void 0 ? _e : true,
                consoleTimestamp: (_g = (_f = options.console) === null || _f === void 0 ? void 0 : _f.timestamp) !== null && _g !== void 0 ? _g : true,
                onError: (e, ctx) => this.callOnError(e, ctx),
                format: {
                    timestampFormat: (_j = (_h = options.format) === null || _h === void 0 ? void 0 : _h.timestampFormat) !== null && _j !== void 0 ? _j : 'time',
                    formatter: (_k = options.format) === null || _k === void 0 ? void 0 : _k.formatter,
                    includeStack: (_m = (_l = options.format) === null || _l === void 0 ? void 0 : _l.includeStack) !== null && _m !== void 0 ? _m : true,
                    includeName: (_p = (_o = options.format) === null || _o === void 0 ? void 0 : _o.includeName) !== null && _p !== void 0 ? _p : true,
                },
            });
            if (options.errorHandling)
                this.configureErrorHandling(options.errorHandling);
        }
        // ─── 核心日志方法 ─────────────────────────────────────────
        debug(...args) {
            this.log('debug', ...args);
        }
        info(...args) {
            this.log('info', ...args);
        }
        warn(...args) {
            this.log('warn', ...args);
        }
        error(...args) {
            this.log('error', ...args);
        }
        // ─── 等级控制 ─────────────────────────────────────────────
        setLevel(level) {
            const old = this.level;
            this.level = level;
            this.emitEvent('levelChange', `日志等级已从 ${old} 更改为 ${level}`, {
                oldLevel: old,
                newLevel: level,
            });
        }
        getLevel() {
            return this.level;
        }
        // ─── 配置 ─────────────────────────────────────────────────
        configureFormat(options) {
            this.formatter.updateFormat(options);
        }
        configureErrorHandling(options) {
            if (options.onError !== undefined)
                this.errorHandling.onError = options.onError;
        }
        updateConfig(options) {
            var _a, _b, _c;
            if (options.level !== undefined)
                this.setLevel(options.level);
            if (options.console !== undefined) {
                this.consoleEnabled = (_a = options.console.enabled) !== null && _a !== void 0 ? _a : this.consoleEnabled;
                this.formatter.settings.consoleColors =
                    (_b = options.console.colors) !== null && _b !== void 0 ? _b : this.formatter.settings.consoleColors;
                this.formatter.settings.consoleTimestamp =
                    (_c = options.console.timestamp) !== null && _c !== void 0 ? _c : this.formatter.settings.consoleTimestamp;
            }
            if (options.format)
                this.configureFormat(options.format);
            if (options.errorHandling)
                this.configureErrorHandling(options.errorHandling);
        }
        // ─── 事件 ────────────────────────────────────────────────
        on(type, handler) {
            if (!this.eventHandlers.has(type))
                this.eventHandlers.set(type, []);
            this.eventHandlers.get(type).push(handler);
        }
        off(type, handler) {
            const handlers = this.eventHandlers.get(type);
            if (!handlers)
                return;
            const i = handlers.indexOf(handler);
            if (i > -1)
                handlers.splice(i, 1);
        }
        // ─── 子 Logger ───────────────────────────────────────────
        child(name, options) {
            var _a, _b, _c;
            const { consoleColors, consoleTimestamp, format } = this.formatter.settings;
            return new Logger({
                level: (_a = options === null || options === void 0 ? void 0 : options.level) !== null && _a !== void 0 ? _a : this.level,
                name: this.name ? `${this.name}:${name}` : name,
                console: { enabled: this.consoleEnabled, colors: consoleColors, timestamp: consoleTimestamp },
                format: (_b = options === null || options === void 0 ? void 0 : options.format) !== null && _b !== void 0 ? _b : { ...format },
                errorHandling: (_c = options === null || options === void 0 ? void 0 : options.errorHandling) !== null && _c !== void 0 ? _c : { ...this.errorHandling },
            });
        }
        // ─── 内部实现 ────────────────────────────────────────────
        callOnError(error, context) {
            if (this.errorHandling.onError) {
                try {
                    this.errorHandling.onError(error, context);
                }
                catch (_a) {
                    /* 防止递归 */
                }
            }
        }
        shouldLog(level) {
            return this.levelPriority[level] >= this.levelPriority[this.level];
        }
        emitEvent(type, message, data) {
            const handlers = this.eventHandlers.get(type);
            if (!(handlers === null || handlers === void 0 ? void 0 : handlers.length))
                return;
            const event = {
                type,
                message,
                data,
                timestamp: new Date().toISOString(),
            };
            for (const h of handlers) {
                try {
                    h(event);
                }
                catch (e) {
                    this.callOnError(e instanceof Error ? e : new Error(String(e)), 'eventHandler');
                }
            }
        }
        createLogEntry(level, message, data, callerInfo) {
            const { file, line } = callerInfo !== null && callerInfo !== void 0 ? callerInfo : {};
            const entry = {
                level,
                message,
                timestamp: new Date().toISOString(),
                data,
            };
            if (this.name)
                entry.name = this.name;
            if (file)
                entry.file = file;
            if (line)
                entry.line = line;
            return entry;
        }
        writeToConsole(entry) {
            if (!this.consoleEnabled)
                return;
            const parts = this.formatter.formatConsoleMessage(entry);
            const fn = entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log;
            fn(...parts);
        }
        log(level, ...args) {
            if (!this.shouldLog(level))
                return;
            let message;
            let data;
            if (args.length === 0) {
                message = '';
                data = undefined;
            }
            else if (typeof args[0] === 'string') {
                message = args[0];
                data = args.length === 2 ? args[1] : args.length > 2 ? args.slice(1) : undefined;
            }
            else if (args[0] instanceof Error) {
                message = args[0].message || String(args[0]);
                data =
                    args.length > 1
                        ? { error: args[0], additionalData: args.length === 2 ? args[1] : args.slice(1) }
                        : args[0];
            }
            else {
                message = '';
                data = args.length === 1 ? args[0] : args;
            }
            const includeStack = this.formatter.settings.format.includeStack;
            const callerInfo = includeStack ? this.callerInfoHelper.getCallerInfo() : undefined;
            const entry = this.createLogEntry(level, message, data, callerInfo);
            this.writeToConsole(entry);
        }
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
    const logger = new Logger({
        name: 'app',
        console: { enabled: true, colors: true, timestamp: true },
    });

    exports.Logger = Logger;
    exports.default = logger;
    exports.logger = logger;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
