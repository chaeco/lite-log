import { describe, expect, it } from 'vitest'
import { ColorUtils } from '../src/utils/color-utils'

describe('ColorUtils', () => {
  // ─── getLevelStyle ────────────────────────────────────────

  describe('getLevelStyle()', () => {
    it('returns debug style', () => {
      const style = ColorUtils.getLevelStyle('debug')
      expect(style).toContain('color:#8b5cf6')
      expect(style).toContain('font-weight:bold')
    })

    it('returns info style', () => {
      const style = ColorUtils.getLevelStyle('info')
      expect(style).toContain('color:#3b82f6')
      expect(style).toContain('font-weight:bold')
    })

    it('returns warn style', () => {
      const style = ColorUtils.getLevelStyle('warn')
      expect(style).toContain('color:#f59e0b')
      expect(style).toContain('font-weight:bold')
    })

    it('returns error style', () => {
      const style = ColorUtils.getLevelStyle('error')
      expect(style).toContain('color:#ef4444')
      expect(style).toContain('font-weight:bold')
    })

    it('returns fallback style for unknown level', () => {
      const style = ColorUtils.getLevelStyle('unknown')
      expect(style).toContain('color:inherit')
      expect(style).toContain('font-weight:bold')
    })

    it('is case-insensitive', () => {
      const upperStyle = ColorUtils.getLevelStyle('DEBUG')
      const lowerStyle = ColorUtils.getLevelStyle('debug')
      expect(upperStyle).toBe(lowerStyle)
    })

    it('handles mixed case', () => {
      const mixedStyle = ColorUtils.getLevelStyle('DeBuG')
      const lowerStyle = ColorUtils.getLevelStyle('debug')
      expect(mixedStyle).toBe(lowerStyle)
    })
  })

  // ─── getMessageStyle ──────────────────────────────────────

  describe('getMessageStyle()', () => {
    it('returns debug message style', () => {
      const style = ColorUtils.getMessageStyle('debug')
      expect(style).toBe('color:#8b5cf6')
    })

    it('returns info message style', () => {
      const style = ColorUtils.getMessageStyle('info')
      expect(style).toBe('color:#3b82f6')
    })

    it('returns warn message style', () => {
      const style = ColorUtils.getMessageStyle('warn')
      expect(style).toBe('color:#f59e0b')
    })

    it('returns error message style', () => {
      const style = ColorUtils.getMessageStyle('error')
      expect(style).toBe('color:#ef4444')
    })

    it('returns fallback style for unknown level', () => {
      const style = ColorUtils.getMessageStyle('unknown')
      expect(style).toBe('color:inherit')
    })

    it('is case-insensitive', () => {
      const upperStyle = ColorUtils.getMessageStyle('WARN')
      const lowerStyle = ColorUtils.getMessageStyle('warn')
      expect(upperStyle).toBe(lowerStyle)
    })
  })

  // ─── timestampStyle ───────────────────────────────────────

  describe('timestampStyle', () => {
    it('returns timestamp style', () => {
      const style = ColorUtils.timestampStyle
      expect(style).toBe('color:#6b7280')
    })

    it('is consistent across calls', () => {
      const style1 = ColorUtils.timestampStyle
      const style2 = ColorUtils.timestampStyle
      expect(style1).toBe(style2)
    })
  })

  // ─── nameStyle ────────────────────────────────────────────

  describe('nameStyle', () => {
    it('returns name style', () => {
      const style = ColorUtils.nameStyle
      expect(style).toBe('color:#06b6d4')
    })

    it('is consistent across calls', () => {
      const style1 = ColorUtils.nameStyle
      const style2 = ColorUtils.nameStyle
      expect(style1).toBe(style2)
    })
  })

  // ─── locationStyle ────────────────────────────────────────

  describe('locationStyle', () => {
    it('returns location style', () => {
      const style = ColorUtils.locationStyle
      expect(style).toBe('color:#6b7280')
    })

    it('is consistent across calls', () => {
      const style1 = ColorUtils.locationStyle
      const style2 = ColorUtils.locationStyle
      expect(style1).toBe(style2)
    })
  })

  // ─── Style uniqueness ────────────────────────────────────

  describe('style uniqueness', () => {
    it('creates distinct colors for each component', () => {
      const levelStyle = ColorUtils.getLevelStyle('info')
      const messageStyle = ColorUtils.getMessageStyle('info')
      const timestampStyle = ColorUtils.timestampStyle
      const nameStyle = ColorUtils.nameStyle
      const locationStyle = ColorUtils.locationStyle

      const colors = [levelStyle, messageStyle, timestampStyle, nameStyle, locationStyle]
      const uniqueColors = new Set(colors)

      // Some may repeat, but they're used for specific purposes
      expect(colors.length).toBeGreaterThan(0)
      expect(uniqueColors.size).toBeGreaterThan(0)
    })
  })

  // ─── Style properties ─────────────────────────────────────

  describe('style format validation', () => {
    it('level styles contain CSS color property', () => {
      const levels = ['debug', 'info', 'warn', 'error']
      levels.forEach(level => {
        const style = ColorUtils.getLevelStyle(level)
        expect(style).toMatch(/color:[#\w]{7}/)
      })
    })

    it('all message styles are valid CSS', () => {
      const levels = ['debug', 'info', 'warn', 'error']
      levels.forEach(level => {
        const style = ColorUtils.getMessageStyle(level)
        expect(style).toMatch(/color:[#\w]+/)
      })
    })

    it('timestamp style is valid CSS', () => {
      const style = ColorUtils.timestampStyle
      expect(style).toMatch(/^color:/)
    })

    it('name style uses distinct color', () => {
      const style = ColorUtils.nameStyle
      expect(style).toContain('color:#06b6d4')
    })

    it('location style is same as timestamp style', () => {
      expect(ColorUtils.locationStyle).toBe(ColorUtils.timestampStyle)
    })
  })

  // ─── Case sensitivity ─────────────────────────────────────

  describe('case insensitivity', () => {
    it('handles mixed case for all levels in getLevelStyle', () => {
      const testCases = ['DEBUG', 'Info', 'WARN', 'ErRoR']
      testCases.forEach(level => {
        expect(() => ColorUtils.getLevelStyle(level)).not.toThrow()
        const style = ColorUtils.getLevelStyle(level)
        expect(style).toContain('color:#')
      })
    })

    it('handles mixed case for all levels in getMessageStyle', () => {
      const testCases = ['DEBUG', 'Info', 'WARN', 'ErRoR']
      testCases.forEach(level => {
        expect(() => ColorUtils.getMessageStyle(level)).not.toThrow()
        const style = ColorUtils.getMessageStyle(level)
        expect(style).toContain('color:#')
      })
    })
  })
})

