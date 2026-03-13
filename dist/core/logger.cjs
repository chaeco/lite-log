'use strict';

var callerInfo = require('../utils/caller-info.cjs');
var formatter = require('../utils/formatter.cjs');

/**
 * 日志器主类
 * @remarks
 * 扁平结构，无继承。支持多级别日志、浏览器彩色控制台输出、事件钩子与子 Logger。
 */
class Logger {
    constructor(options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        this.callerInfoHelper = new callerInfo.CallerInfoHelper();
        this.errorHandling = {
            onError: undefined,
        };
        this.eventHandlers = new Map();
        this.levelPriority = {
            debug: 0, info: 1, warn: 2, error: 3, silent: 999,
        };
        this.level = (_a = options.level) !== null && _a !== void 0 ? _a : 'info';
        this.name = options.name;
        this.consoleEnabled = (_c = (_b = options.console) === null || _b === void 0 ? void 0 : _b.enabled) !== null && _c !== void 0 ? _c : true;
        this.formatter = new formatter.LogFormatter({
            consoleColors: (_e = (_d = options.console) === null || _d === void 0 ? void 0 : _d.colors) !== null && _e !== void 0 ? _e : true,
            consoleTimestamp: (_g = (_f = options.console) === null || _f === void 0 ? void 0 : _f.timestamp) !== null && _g !== void 0 ? _g : true,
            format: {
                enabled: (_j = (_h = options.format) === null || _h === void 0 ? void 0 : _h.enabled) !== null && _j !== void 0 ? _j : false,
                timestampFormat: (_l = (_k = options.format) === null || _k === void 0 ? void 0 : _k.timestampFormat) !== null && _l !== void 0 ? _l : 'time',
                formatter: (_m = options.format) === null || _m === void 0 ? void 0 : _m.formatter,
                includeStack: (_p = (_o = options.format) === null || _o === void 0 ? void 0 : _o.includeStack) !== null && _p !== void 0 ? _p : true,
                includeName: (_r = (_q = options.format) === null || _q === void 0 ? void 0 : _q.includeName) !== null && _r !== void 0 ? _r : true,
            },
        });
        if (options.errorHandling)
            this.configureErrorHandling(options.errorHandling);
    }
    // ─── 核心日志方法 ─────────────────────────────────────────
    debug(...args) { this.log('debug', ...args); }
    info(...args) { this.log('info', ...args); }
    warn(...args) { this.log('warn', ...args); }
    error(...args) { this.log('error', ...args); }
    // ─── 等级控制 ─────────────────────────────────────────────
    setLevel(level) {
        const old = this.level;
        this.level = level;
        this.emitEvent('levelChange', `日志等级已从 ${old} 更改为 ${level}`, { oldLevel: old, newLevel: level });
    }
    getLevel() { return this.level; }
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
            this.formatter.settings.consoleColors = (_b = options.console.colors) !== null && _b !== void 0 ? _b : this.formatter.settings.consoleColors;
            this.formatter.settings.consoleTimestamp = (_c = options.console.timestamp) !== null && _c !== void 0 ? _c : this.formatter.settings.consoleTimestamp;
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
                console.error('Error in logger event handler:', e);
            }
        }
    }
    createLogEntry(level, message, data) {
        const { file, line } = this.callerInfoHelper.getCallerInfo();
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
        const fn = entry.level === 'error' ? console.error :
            entry.level === 'warn' ? console.warn :
                console.log;
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
            data = args.length > 1 ? { error: args[0], additionalData: args.slice(1) } : args[0];
        }
        else {
            message = '';
            data = args.length === 1 ? args[0] : args;
        }
        const entry = this.createLogEntry(level, message, data);
        this.writeToConsole(entry);
    }
}

exports.Logger = Logger;
