'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var logger$1 = require('./core/logger.cjs');

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
const logger = new logger$1.Logger({
    name: 'app',
    console: { enabled: true, colors: true, timestamp: true },
});

exports.Logger = logger$1.Logger;
exports.default = logger;
exports.logger = logger;
