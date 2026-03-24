'use strict';

var colorUtils = require('./color-utils.cjs');

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
            styles.push(colorUtils.ColorUtils.timestampStyle);
        }
        // logger 名称
        if (format.includeName && entry.name) {
            fmtParts.push(`%c[${entry.name}]`);
            styles.push(colorUtils.ColorUtils.nameStyle);
        }
        // 日志级别
        fmtParts.push(`%c${entry.level.toUpperCase().padEnd(5)}`);
        styles.push(colorUtils.ColorUtils.getLevelStyle(entry.level));
        // 调用位置
        if (format.includeStack && entry.file && entry.line) {
            fmtParts.push(`%c(${entry.file}:${entry.line})`);
            styles.push(colorUtils.ColorUtils.locationStyle);
        }
        // 消息本体
        fmtParts.push(`%c${entry.message}`);
        styles.push(colorUtils.ColorUtils.getMessageStyle(entry.level));
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

exports.LogFormatter = LogFormatter;
