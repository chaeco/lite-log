import { describe, expect, it, vi } from 'vitest'
import { LogFormatter, FormatterSettings } from '../src/utils/formatter'
import type { LogEntry } from '../src/core/types'

// ─── 测试工具 ─────────────────────────────────────────────────

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    level: 'info',
    message: 'test message',
    timestamp: '2024-01-01T12:00:00.000Z',
    name: 'app',
    file: '/app/main.ts',
    line: 42,
    ...overrides,
  }
}

function baseSettings(overrides: Partial<FormatterSettings> = {}): FormatterSettings {
  return {
    consoleColors: false,
    consoleTimestamp: true,
    format: {
      timestampFormat: 'time',
      includeStack: true,
      includeName: true,
    },
    ...overrides,
  }
}

// ─── formatMessage (纯文本) ───────────────────────────────────

describe('LogFormatter.formatMessage', () => {
  it('includes timestamp in time format', () => {
    const f = new LogFormatter(baseSettings())
    expect(f.formatMessage(makeEntry())).toContain('12:00:00.000')
  })

  it('includes logger name in brackets', () => {
    const f = new LogFormatter(baseSettings())
    expect(f.formatMessage(makeEntry())).toContain('[app]')
  })

  it('includes level', () => {
    const f = new LogFormatter(baseSettings())
    expect(f.formatMessage(makeEntry())).toContain('INFO')
  })

  it('includes file and line', () => {
    const f = new LogFormatter(baseSettings())
    expect(f.formatMessage(makeEntry())).toContain('/app/main.ts:42')
  })

  it('includes message', () => {
    const f = new LogFormatter(baseSettings())
    expect(f.formatMessage(makeEntry())).toContain('test message')
  })

  it('omits name when includeName is false', () => {
    const f = new LogFormatter(baseSettings({ format: { ...baseSettings().format, includeName: false } }))
    expect(f.formatMessage(makeEntry())).not.toContain('[app]')
  })

  it('omits location when includeStack is false', () => {
    const f = new LogFormatter(baseSettings({ format: { ...baseSettings().format, includeStack: false } }))
    expect(f.formatMessage(makeEntry())).not.toContain('/app/main.ts')
  })

  it('omits location when file/line are absent from entry', () => {
    const f = new LogFormatter(baseSettings())
    const out = f.formatMessage(makeEntry({ file: undefined, line: undefined }))
    expect(out).not.toMatch(/\(.+:\d+\)/)
  })

  it('serializes data object', () => {
    const f = new LogFormatter(baseSettings())
    const out = f.formatMessage(makeEntry({ data: { x: 1 } }))
    expect(out).toContain('"x":1')
  })

  it('handles null data', () => {
    const f = new LogFormatter(baseSettings())
    const out = f.formatMessage(makeEntry({ data: null }))
    expect(out).toContain('null')
  })

  it('handles circular reference in data without throwing', () => {
    const f = new LogFormatter(baseSettings())
    const obj: Record<string, unknown> = {}
    obj['self'] = obj
    expect(() => f.formatMessage(makeEntry({ data: obj }))).not.toThrow()
    expect(f.formatMessage(makeEntry({ data: obj }))).toContain('[Circular]')
  })

  it('handles data that is a primitive string', () => {
    const f = new LogFormatter(baseSettings())
    const out = f.formatMessage(makeEntry({ data: 'extra info' }))
    expect(out).toContain('extra info')
  })
})

// ─── 时间戳格式 ───────────────────────────────────────────────

describe('LogFormatter timestamp formats', () => {
  it('iso returns full ISO 8601 string', () => {
    const f = new LogFormatter(baseSettings({ format: { ...baseSettings().format, timestampFormat: 'iso' } }))
    expect(f.formatMessage(makeEntry())).toContain('2024-01-01T12:00:00.000Z')
  })

  it('datetime returns YYYY-MM-DD HH:mm:ss.mmm', () => {
    const f = new LogFormatter(baseSettings({ format: { ...baseSettings().format, timestampFormat: 'datetime' } }))
    expect(f.formatMessage(makeEntry())).toContain('2024-01-01 12:00:00.000')
  })

  it('time returns HH:mm:ss.mmm (default)', () => {
    const f = new LogFormatter(baseSettings())
    expect(f.formatMessage(makeEntry())).toContain('12:00:00.000')
  })
})

// ─── formatConsoleMessage 彩色模式 ────────────────────────────

describe('LogFormatter.formatConsoleMessage (color mode)', () => {
  it('returns array with %c format string and CSS style args', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const result = f.formatConsoleMessage(makeEntry())
    expect(result[0]).toContain('%c')
    expect(result.length).toBeGreaterThan(1)
  })

  it('format string contains level text', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    expect(f.formatConsoleMessage(makeEntry())[0]).toContain('INFO')
  })

  it('format string contains timestamp', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    expect(f.formatConsoleMessage(makeEntry())[0]).toContain('12:00:00.000')
  })

  it('format string contains logger name', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    expect(f.formatConsoleMessage(makeEntry())[0]).toContain('[app]')
  })

  it('appends data object as the last element', () => {
    const data = { key: 'value' }
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const result = f.formatConsoleMessage(makeEntry({ data }))
    expect(result[result.length - 1]).toBe(data)
  })

  it('does not append extra element when data is undefined', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const result = f.formatConsoleMessage(makeEntry({ data: undefined }))
    // All elements after index 0 should be CSS strings, none should be objects
    for (let i = 1; i < result.length; i++) {
      expect(typeof result[i]).toBe('string')
    }
  })
})

// ─── formatConsoleMessage 无色模式 ────────────────────────────

describe('LogFormatter.formatConsoleMessage (no color mode)', () => {
  it('returns single-element array with plain text', () => {
    const f = new LogFormatter(baseSettings())
    const result = f.formatConsoleMessage(makeEntry())
    expect(result).toHaveLength(1)
    expect(result[0]).not.toContain('%c')
  })

  it('omits timestamp when consoleTimestamp is false', () => {
    const f = new LogFormatter(baseSettings({ consoleTimestamp: false }))
    expect(f.formatConsoleMessage(makeEntry())[0]).not.toContain('12:00:00')
  })
})

// ─── 自定义 formatter ─────────────────────────────────────────

describe('LogFormatter custom formatter', () => {
  it('uses custom formatter in formatMessage', () => {
    const f = new LogFormatter(baseSettings({
      format: { ...baseSettings().format, formatter: (e) => `CUSTOM:${e.level}` },
    }))
    expect(f.formatMessage(makeEntry())).toBe('CUSTOM:info')
  })

  it('uses custom formatter in formatConsoleMessage', () => {
    const f = new LogFormatter(baseSettings({
      format: { ...baseSettings().format, formatter: (e) => `CUSTOM:${e.level}` },
    }))
    expect(f.formatConsoleMessage(makeEntry())).toEqual(['CUSTOM:info'])
  })

  it('falls through to default and calls onError when formatter throws (formatMessage)', () => {
    const onError = vi.fn()
    const f = new LogFormatter(baseSettings({
      onError,
      format: { ...baseSettings().format, formatter: () => { throw new Error('boom') } },
    }))
    const result = f.formatMessage(makeEntry())
    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].message).toBe('boom')
    expect(result).toContain('test message') // fell through to default
  })

  it('falls through to default and calls onError when formatter throws (formatConsoleMessage)', () => {
    const onError = vi.fn()
    const f = new LogFormatter(baseSettings({
      onError,
      format: { ...baseSettings().format, formatter: () => { throw new Error('boom') } },
    }))
    const result = f.formatConsoleMessage(makeEntry())
    expect(onError).toHaveBeenCalledOnce()
    expect(result[0]).toContain('test message') // fell through to default
  })

  it('wraps non-Error throws in Error before calling onError', () => {
    const onError = vi.fn()
    const f = new LogFormatter(baseSettings({
      onError,
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      format: { ...baseSettings().format, formatter: () => { throw 'raw string' } },
    }))
    f.formatMessage(makeEntry())
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
  })
})

// ─── updateFormat ─────────────────────────────────────────────

describe('LogFormatter.updateFormat', () => {
  it('updates timestampFormat', () => {
    const f = new LogFormatter(baseSettings())
    f.updateFormat({ timestampFormat: 'iso' })
    expect(f.formatMessage(makeEntry())).toContain('2024-01-01T')
  })

  it('updates formatter function', () => {
    const f = new LogFormatter(baseSettings())
    f.updateFormat({ formatter: () => 'UPDATED' })
    expect(f.formatMessage(makeEntry())).toBe('UPDATED')
  })

  it('updates includeStack to false', () => {
    const f = new LogFormatter(baseSettings())
    f.updateFormat({ includeStack: false })
    expect(f.formatMessage(makeEntry())).not.toContain('/app/main.ts')
  })

  it('updates includeName to false', () => {
    const f = new LogFormatter(baseSettings())
    f.updateFormat({ includeName: false })
    expect(f.formatMessage(makeEntry())).not.toContain('[app]')
  })

  it('ignores deprecated enabled field', () => {
    const f = new LogFormatter(baseSettings())
    // Should not throw and should not change behavior
    expect(() => f.updateFormat({ enabled: true })).not.toThrow()
  })
})

// ─── Error object serialization ────────────────────────────

describe('LogFormatter Error object handling', () => {
  it('serializes Error object in data field correctly', () => {
    const f = new LogFormatter(baseSettings())
    const err = new Error('test error message')
    const out = f.formatMessage(makeEntry({ data: err }))
    expect(out).toContain('Error: test error message')
  })

  it('handles Error with undefined message', () => {
    const f = new LogFormatter(baseSettings())
    const err = new Error()
    const out = f.formatMessage(makeEntry({ data: err }))
    expect(out).toContain('Error')
  })

  it('handles nested Error in data object', () => {
    const f = new LogFormatter(baseSettings())
    const err = new Error('nested')
    const out = f.formatMessage(makeEntry({ data: { error: err } }))
    expect(out).toContain('Error')
    expect(out).toContain('nested')
  })

  it('serializes Error in console color mode', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const err = new Error('console error')
    const result = f.formatConsoleMessage(makeEntry({ data: err }))
    expect(result[result.length - 1]).toBe(err)
  })
})

// ─── Console color mode - all levels ───────────────────────

describe('LogFormatter color mode - all log levels', () => {
  it('debug level in color mode', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const result = f.formatConsoleMessage(makeEntry({ level: 'debug' }))
    expect(result[0]).toContain('DEBUG')
    expect(result[0]).toContain('%c')
  })

  it('info level in color mode', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const result = f.formatConsoleMessage(makeEntry({ level: 'info' }))
    expect(result[0]).toContain('INFO')
    expect(result[0]).toContain('%c')
  })

  it('warn level in color mode', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const result = f.formatConsoleMessage(makeEntry({ level: 'warn' }))
    expect(result[0]).toContain('WARN')
    expect(result[0]).toContain('%c')
  })

  it('error level in color mode', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const result = f.formatConsoleMessage(makeEntry({ level: 'error' }))
    expect(result[0]).toContain('ERROR')
    expect(result[0]).toContain('%c')
  })
})

// ─── Console timestamp behavior ────────────────────────────

describe('LogFormatter console timestamp behavior', () => {
  it('includes timestamp when consoleTimestamp is true', () => {
    const f = new LogFormatter(baseSettings({ consoleTimestamp: true }))
    const result = f.formatConsoleMessage(makeEntry())
    expect(result[0]).toContain('12:00:00')
  })

  it('excludes timestamp when consoleTimestamp is false', () => {
    const f = new LogFormatter(baseSettings({ consoleTimestamp: false }))
    const result = f.formatConsoleMessage(makeEntry())
    expect(result[0]).not.toContain('12:00:00')
  })

  it('color mode respects consoleTimestamp setting', () => {
    const f = new LogFormatter(baseSettings({
      consoleColors: true,
      consoleTimestamp: false,
    }))
    const result = f.formatConsoleMessage(makeEntry())
    expect(result[0]).not.toContain('12:00:00')
  })
})

// ─── Data in color mode ────────────────────────────────────

describe('LogFormatter color mode data handling', () => {
  it('appends undefined data as single final element', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const result = f.formatConsoleMessage(makeEntry({ data: undefined }))
    // Format string + CSS styles only, no data
    expect(typeof result[result.length - 1]).toBe('string')
    expect(result.length).toBeGreaterThan(1)
  })

  it('appends non-string data directly', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const data = { key: 'value', num: 42 }
    const result = f.formatConsoleMessage(makeEntry({ data }))
    expect(result[result.length - 1]).toBe(data)
  })

  it('appends array data directly', () => {
    const f = new LogFormatter(baseSettings({ consoleColors: true }))
    const data = [1, 2, 3]
    const result = f.formatConsoleMessage(makeEntry({ data }))
    expect(result[result.length - 1]).toBe(data)
  })
})

// ─── Plain text mode with various data types ───────────────

describe('LogFormatter plain text mode data handling', () => {
  it('serializes boolean data', () => {
    const f = new LogFormatter(baseSettings())
    const out = f.formatMessage(makeEntry({ data: true }))
    expect(out).toContain('true')
  })

  it('serializes number data', () => {
    const f = new LogFormatter(baseSettings())
    const out = f.formatMessage(makeEntry({ data: 42 }))
    expect(out).toContain('42')
  })

  it('serializes array data', () => {
    const f = new LogFormatter(baseSettings())
    const out = f.formatMessage(makeEntry({ data: [1, 2, 3] }))
    expect(out).toContain('[1,2,3]')
  })

  it('handles undefined data gracefully (not included in output)', () => {
    const f = new LogFormatter(baseSettings())
    const out = f.formatMessage(makeEntry({ data: undefined }))
    // undefined data should not append anything
    expect(out).toContain('test message')
    expect(out).not.toContain('undefined')
  })
})
