/**
 * 调用栈解析工具
 * @internal
 * 负责从 Error 堆栈中提取调用日志方法的文件路径和行号，并带 LRU 缓存。
 * 兼容浏览器与 Node.js 运行时。
 */
export class CallerInfoHelper {
  private readonly cache: Map<string, { file?: string; line?: number }> = new Map();
  private readonly maxCacheSize: number;

  constructor(maxCacheSize = 500) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * 获取当前调用者的文件路径和行号
   */
  getCallerInfo(): { file?: string; line?: number } {
    const error = new Error();
    const stack = error.stack;

    if (!stack) return {};

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
      const line = stackLines[i]?.trim();

      if (!line) continue;
      if (line.startsWith('Error')) continue;

      // 跳过所有 logger 内部帧
      if (
        line.includes('Logger.log') ||
        line.includes('Logger.info') ||
        line.includes('Logger.warn') ||
        line.includes('Logger.error') ||
        line.includes('Logger.debug') ||
        line.includes('Logger.createLogEntry') ||
        line.includes('getCallerInfo') ||
        line.includes('CallerInfoHelper')
      ) {
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
          } catch {
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
  clearCache(): void {
    this.cache.clear();
  }

  /** 获取缓存大小（调试用） */
  getCacheSize(): number {
    return this.cache.size;
  }

  // ─── 私有方法 ─────────────────────────────────────────────

  /**
   * 53 位非加密哈希（双 32 位混合）
   * 参考：https://stackoverflow.com/a/52171480
   */
  private simpleHash(str: string): string {
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
  private cacheResult(key: string, info: { file?: string; line?: number }): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, info);
  }
}
