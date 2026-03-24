import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../src/core/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── 构造函数默认值 ───────────────────────────────────────

  it('defaults level to info', () => {
    expect(new Logger().getLevel()).toBe('info');
  });

  it('accepts level option', () => {
    expect(new Logger({ level: 'debug' }).getLevel()).toBe('debug');
  });

  it('accepts silent level', () => {
    expect(new Logger({ level: 'silent' }).getLevel()).toBe('silent');
  });

  // ─── 等级过滤 ─────────────────────────────────────────────

  describe('level filtering', () => {
    it('suppresses logs below configured level', () => {
      const log = new Logger({ level: 'warn' });
      log.info('no');
      log.debug('no');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('outputs at configured level', () => {
      const log = new Logger({ level: 'warn' });
      log.warn('yes');
      expect(console.warn).toHaveBeenCalledOnce();
    });

    it('outputs above configured level', () => {
      const log = new Logger({ level: 'warn' });
      log.error('yes');
      expect(console.error).toHaveBeenCalledOnce();
    });

    it('silent level suppresses all output', () => {
      const log = new Logger({ level: 'silent' });
      log.debug('x');
      log.info('x');
      log.warn('x');
      log.error('x');
      expect(console.log).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('debug level allows all output', () => {
      const log = new Logger({ level: 'debug' });
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledOnce();
      expect(console.error).toHaveBeenCalledOnce();
    });
  });

  // ─── setLevel / getLevel ──────────────────────────────────

  describe('setLevel / getLevel', () => {
    it('updates level at runtime', () => {
      const log = new Logger();
      log.setLevel('error');
      expect(log.getLevel()).toBe('error');
      log.info('suppressed');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('allows upgrading back to a lower level', () => {
      const log = new Logger({ level: 'error' });
      log.setLevel('debug');
      log.debug('visible');
      expect(console.log).toHaveBeenCalledOnce();
    });
  });

  // ─── console 路由 ─────────────────────────────────────────

  describe('console routing', () => {
    it('routes error() to console.error', () => {
      const log = new Logger({ level: 'debug' });
      log.error('x');
      expect(console.error).toHaveBeenCalledOnce();
    });

    it('routes warn() to console.warn', () => {
      const log = new Logger({ level: 'debug' });
      log.warn('x');
      expect(console.warn).toHaveBeenCalledOnce();
    });

    it('routes debug() and info() to console.log', () => {
      const log = new Logger({ level: 'debug' });
      log.debug('x');
      log.info('x');
      expect(console.log).toHaveBeenCalledTimes(2);
    });
  });

  // ─── console 开关 ─────────────────────────────────────────

  it('suppresses all console output when console.enabled is false', () => {
    const log = new Logger({ level: 'debug', console: { enabled: false } });
    log.debug('x');
    log.info('x');
    log.warn('x');
    log.error('x');
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  // ─── 参数处理 ─────────────────────────────────────────────

  describe('argument handling', () => {
    it('handles no arguments', () => {
      expect(() => new Logger({ level: 'debug' }).info()).not.toThrow();
    });

    it('handles string only', () => {
      const log = new Logger({ level: 'debug' });
      log.info('hello');
      expect(console.log).toHaveBeenCalledOnce();
    });

    it('handles string + data object', () => {
      const log = new Logger({ level: 'debug' });
      log.info('msg', { foo: 'bar' });
      expect(console.log).toHaveBeenCalledOnce();
    });

    it('handles string + multiple extra args', () => {
      const log = new Logger({ level: 'debug' });
      log.info('msg', 1, 2, 3);
      expect(console.log).toHaveBeenCalledOnce();
    });

    it('handles Error as first argument', () => {
      const log = new Logger({ level: 'debug' });
      log.error(new Error('boom'));
      expect(console.error).toHaveBeenCalledOnce();
    });

    it('handles plain object as first argument', () => {
      const log = new Logger({ level: 'debug' });
      log.info({ key: 'val' });
      expect(console.log).toHaveBeenCalledOnce();
    });

    it('handles Error with single data argument', () => {
      const log = new Logger({ level: 'debug' });
      const err = new Error('test error');
      log.error(err, { context: 'info' });
      expect(console.error).toHaveBeenCalledOnce();
    });

    it('handles Error with multiple arguments', () => {
      const log = new Logger({ level: 'debug' });
      const err = new Error('test error');
      log.error(err, 'extra1', 'extra2');
      expect(console.error).toHaveBeenCalledOnce();
    });
  });

  // ─── 事件钩子 ─────────────────────────────────────────────

  describe('event hooks', () => {
    it('emits levelChange when setLevel is called', () => {
      const log = new Logger();
      const handler = vi.fn();
      log.on('levelChange', handler);
      log.setLevel('warn');
      expect(handler).toHaveBeenCalledOnce();
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('levelChange');
      expect(event.data).toEqual({ oldLevel: 'info', newLevel: 'warn' });
    });

    it('off() removes registered handler', () => {
      const log = new Logger();
      const handler = vi.fn();
      log.on('levelChange', handler);
      log.off('levelChange', handler);
      log.setLevel('error');
      expect(handler).not.toHaveBeenCalled();
    });

    it('off() is a no-op for unregistered handler', () => {
      const log = new Logger();
      expect(() => log.off('levelChange', vi.fn())).not.toThrow();
    });

    it('calls onError when event handler throws', () => {
      const onError = vi.fn();
      const log = new Logger({ errorHandling: { onError } });
      log.on('levelChange', () => {
        throw new Error('handler error');
      });
      log.setLevel('warn');
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0].message).toBe('handler error');
      expect(onError.mock.calls[0][1]).toBe('eventHandler');
    });

    it('continues calling remaining handlers after one throws', () => {
      const log = new Logger({ errorHandling: { onError: () => {} } });
      const handler2 = vi.fn();
      log.on('levelChange', () => {
        throw new Error('x');
      });
      log.on('levelChange', handler2);
      log.setLevel('warn');
      expect(handler2).toHaveBeenCalledOnce();
    });
  });

  // ─── 子 Logger ───────────────────────────────────────────

  describe('child()', () => {
    it('prefixes child name with parent name', () => {
      const parent = new Logger({ name: 'app', level: 'debug', console: { colors: false } });
      const child = parent.child('http');
      child.info('test');
      const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(output).toContain('app:http');
    });

    it('uses child name alone when parent has no name', () => {
      const parent = new Logger({ level: 'debug', console: { colors: false } });
      const child = parent.child('svc');
      child.info('test');
      const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(output).toContain('svc');
    });

    it('inherits parent level by default', () => {
      const parent = new Logger({ level: 'debug' });
      expect(parent.child('c').getLevel()).toBe('debug');
    });

    it('allows overriding level in child', () => {
      const parent = new Logger({ level: 'info' });
      expect(parent.child('c', { level: 'debug' }).getLevel()).toBe('debug');
    });

    it('child does not alter parent level', () => {
      const parent = new Logger({ level: 'info' });
      parent.child('c', { level: 'debug' });
      expect(parent.getLevel()).toBe('info');
    });

    it('child inherits error handling from parent', () => {
      const onError = vi.fn();
      const parent = new Logger({ level: 'debug', errorHandling: { onError } });
      const child = parent.child('sub', { level: 'debug' });
      child.on('levelChange', () => {
        throw new Error('test');
      });
      child.setLevel('info');
      expect(onError).toHaveBeenCalled();
    });

    it('child can override error handling', () => {
      const onError1 = vi.fn();
      const onError2 = vi.fn();
      const parent = new Logger({ level: 'debug', errorHandling: { onError: onError1 } });
      const child = parent.child('sub', { level: 'debug', errorHandling: { onError: onError2 } });
      child.on('levelChange', () => {
        throw new Error('test');
      });
      child.setLevel('info');
      expect(onError1).not.toHaveBeenCalled();
      expect(onError2).toHaveBeenCalled();
    });

    // ─── updateConfig ─────────────────────────────────────────

    describe('updateConfig()', () => {
      it('updates level', () => {
        const log = new Logger();
        log.updateConfig({ level: 'error' });
        expect(log.getLevel()).toBe('error');
      });

      it('disables console', () => {
        const log = new Logger({ level: 'debug' });
        log.updateConfig({ console: { enabled: false } });
        log.info('x');
        expect(console.log).not.toHaveBeenCalled();
      });

      it('switching to no-color mode returns plain text', () => {
        const log = new Logger({ level: 'debug', console: { colors: true } });
        log.updateConfig({ console: { colors: false } });
        log.info('plain');
        const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(output).not.toContain('%c');
      });
    });

    // ─── configureFormat ──────────────────────────────────────

    describe('configureFormat()', () => {
      it('disables stack info at runtime', () => {
        const log = new Logger({ level: 'debug', console: { colors: false } });
        log.configureFormat({ includeStack: false });
        log.info('x');
        const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(output).not.toMatch(/\(.+:\d+\)/);
      });

      it('enables inclusion of logger name', () => {
        const log = new Logger({ level: 'debug', name: 'test', console: { colors: false } });
        log.configureFormat({ includeName: true });
        log.info('msg');
        const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(output).toContain('[test]');
      });

      it('disables inclusion of logger name', () => {
        const log = new Logger({ level: 'debug', name: 'test', console: { colors: false } });
        log.configureFormat({ includeName: false });
        log.info('msg');
        const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(output).not.toContain('[test]');
      });

      it('changes timestamp format', () => {
        const log = new Logger({ level: 'debug', console: { colors: false } });
        log.configureFormat({ timestampFormat: 'iso' });
        log.info('msg');
        const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(output).toMatch(/\d{4}-\d{2}-\d{2}T/);
      });
    });

    // ─── configureErrorHandling ───────────────────────────────

    describe('configureErrorHandling()', () => {
      it('sets onError callback', () => {
        const onError = vi.fn();
        const log = new Logger({});
        log.configureErrorHandling({ onError });
        log.on('levelChange', () => {
          throw new Error('test');
        });
        log.setLevel('warn');
        expect(onError).toHaveBeenCalled();
      });

      it('replaces existing onError callback', () => {
        const onError1 = vi.fn();
        const onError2 = vi.fn();
        const log = new Logger({ errorHandling: { onError: onError1 } });
        log.configureErrorHandling({ onError: onError2 });
        log.on('levelChange', () => {
          throw new Error('test');
        });
        log.setLevel('warn');
        expect(onError1).not.toHaveBeenCalled();
        expect(onError2).toHaveBeenCalled();
      });
    });

    // ─── 自定义 formatter ─────────────────────────────────────

    describe('custom formatter', () => {
      it('uses custom formatter output', () => {
        const log = new Logger({
          level: 'debug',
          format: { formatter: (entry) => `>>>${entry.level}:${entry.message}<<<` },
        });
        log.info('hi');
        expect(console.log).toHaveBeenCalledWith('>>>info:hi<<<');
      });

      it('falls through to default format and calls onError when formatter throws', () => {
        const onError = vi.fn();
        const log = new Logger({
          level: 'debug',
          console: { colors: false },
          format: {
            formatter: () => {
              throw new Error('boom');
            },
          },
          errorHandling: { onError },
        });
        expect(() => log.info('fallback')).not.toThrow();
        expect(onError).toHaveBeenCalledOnce();
        expect(onError.mock.calls[0][0].message).toBe('boom');
        expect(onError.mock.calls[0][1]).toBe('formatter');
        // still produces output via fallback
        expect(console.log).toHaveBeenCalledOnce();
        const out = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(out).toContain('fallback');
      });
    });

    // ─── Logger with all options ───────────────────────────────────

    describe('Logger with comprehensive options', () => {
      it('handles logger with all options configured', () => {
        const onError = vi.fn();
        const formatter = vi.fn((entry) => `CUSTOM[${entry.level}]: ${entry.message}`);
        const log = new Logger({
          name: 'comprehensive',
          level: 'debug',
          console: { enabled: true, colors: true, timestamp: true },
          format: {
            timestampFormat: 'datetime',
            formatter,
            includeStack: true,
            includeName: true,
          },
          errorHandling: { onError },
        });
        log.debug('test');
        expect(formatter).toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledOnce();
      });

      it('handles nested child loggers with inherited settings', () => {
        const parent = new Logger({
          name: 'root',
          level: 'debug',
          console: { colors: false },
        });
        const child = parent.child('level1');
        const grandchild = child.child('level2');
        grandchild.info('nested');
        const output = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(output).toContain('root:level1:level2');
      });

      it('sibling child loggers are independent', () => {
        const parent = new Logger({
          level: 'info',
          console: { colors: false },
        });
        const child1 = parent.child('a', { level: 'debug' });
        const child2 = parent.child('b', { level: 'error' });

        child1.debug('visible');
        expect(console.log).toHaveBeenCalledTimes(1);

        child2.debug('invisible');
        expect(console.log).toHaveBeenCalledTimes(1); // still 1, not called again
      });
    });
  });
});
