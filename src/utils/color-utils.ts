/**
 * 浏览器控制台颜色工具
 * @internal
 * @remarks
 * 使用 %c CSS 语法为不同日志级别提供颜色样式。
 */

const LEVEL_STYLES: Record<string, string> = {
  debug: 'color:#8b5cf6;font-weight:bold',
  info: 'color:#3b82f6;font-weight:bold',
  warn: 'color:#f59e0b;font-weight:bold',
  error: 'color:#ef4444;font-weight:bold',
}

const MESSAGE_STYLES: Record<string, string> = {
  debug: 'color:#8b5cf6',
  info: 'color:#3b82f6',
  warn: 'color:#f59e0b',
  error: 'color:#ef4444',
}

const RESET_STYLE = 'color:inherit'

export class ColorUtils {
  static getLevelStyle(level: string): string {
    return LEVEL_STYLES[level.toLowerCase()] ?? 'color:inherit;font-weight:bold'
  }

  static getMessageStyle(level: string): string {
    return MESSAGE_STYLES[level.toLowerCase()] ?? RESET_STYLE
  }

  static get timestampStyle(): string {
    return 'color:#6b7280'
  }

  static get nameStyle(): string {
    return 'color:#06b6d4'
  }

  static get locationStyle(): string {
    return 'color:#6b7280'
  }

  static get resetStyle(): string {
    return RESET_STYLE
  }
}
