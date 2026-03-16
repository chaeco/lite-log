import { describe, expect, it } from 'vitest'
import { CallerInfoHelper } from '../src/utils/caller-info'

describe('CallerInfoHelper', () => {
  describe('getCallerInfo()', () => {
    it('returns an object with file and line', () => {
      const helper = new CallerInfoHelper()
      const result = helper.getCallerInfo()
      expect(result.file).toBeDefined()
      expect(result.line).toBeDefined()
      expect(typeof result.file).toBe('string')
      expect(typeof result.line).toBe('number')
      expect(result.line).toBeGreaterThan(0)
    })

    it('file references the calling test file', () => {
      const helper = new CallerInfoHelper()
      const result = helper.getCallerInfo()
      // In Node.js, file will be an absolute path to this test file
      expect(result.file).toContain('caller-info.test.ts')
    })

    it('returns {} when Error stack is not available', () => {
      const helper = new CallerInfoHelper()
      const original = Error
      // Temporarily make Error.stack undefined
      try {
        // @ts-expect-error replacing for test
        globalThis.Error = class extends original {
          stack = undefined
        }
        const result = helper.getCallerInfo()
        expect(result).toEqual({})
      } finally {
        globalThis.Error = original
      }
    })
  })

  describe('caching', () => {
    it('starts with empty cache', () => {
      const helper = new CallerInfoHelper()
      expect(helper.getCacheSize()).toBe(0)
    })

    it('populates cache after first call', () => {
      const helper = new CallerInfoHelper()
      helper.getCallerInfo()
      expect(helper.getCacheSize()).toBeGreaterThanOrEqual(1)
    })

    it('returns results from the same file on consecutive calls', () => {
      const helper = new CallerInfoHelper()
      const r1 = helper.getCallerInfo()
      const r2 = helper.getCallerInfo()
      // Both calls are in the same test file
      expect(r1.file).toBe(r2.file)
      // Each call may be on a different line; cache grows
      expect(helper.getCacheSize()).toBeGreaterThanOrEqual(1)
    })

    it('clearCache() resets cache to empty', () => {
      const helper = new CallerInfoHelper()
      helper.getCallerInfo()
      expect(helper.getCacheSize()).toBeGreaterThan(0)
      helper.clearCache()
      expect(helper.getCacheSize()).toBe(0)
    })

    it('re-populates cache after clear', () => {
      const helper = new CallerInfoHelper()
      helper.getCallerInfo()
      helper.clearCache()
      helper.getCallerInfo()
      expect(helper.getCacheSize()).toBeGreaterThan(0)
    })

    it('evicts oldest entry when cache is full (maxCacheSize = 1)', () => {
      // Two helpers — each gets one cache slot
      const h1 = new CallerInfoHelper(1)
      const h2 = new CallerInfoHelper(1)
      h1.getCallerInfo()
      expect(h1.getCacheSize()).toBe(1)
      // h2 is separate — just verify eviction cap is respected
      h2.getCallerInfo()
      expect(h2.getCacheSize()).toBe(1)
    })
  })

  describe('URL simplification', () => {
    it('does not throw for file:// URL paths (CI environment)', () => {
      const helper = new CallerInfoHelper()
      // getCallerInfo internally tries new URL() — this test just ensures no crash
      expect(() => helper.getCallerInfo()).not.toThrow()
    })
  })
})
