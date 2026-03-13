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
    static get resetStyle() {
        return RESET_STYLE;
    }
}

export { ColorUtils };
