'use client';

import { useTheme } from '@/lib/theme';

/** Returns theme-aware color tokens for use in inline styles */
export function useColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return {
    // Text
    text:        dark ? '#E6EDF3' : '#0F172A',
    textMuted:   dark ? '#8B949E' : '#4B5563',
    textSubtle:  dark ? '#6B7280' : '#9CA3AF',

    // Surfaces
    surface:     dark ? '#161B22' : '#FFFFFF',
    surfaceAlt:  dark ? '#21262D' : '#F8FAFC',
    surfaceDeep: dark ? '#0D1117' : '#F1F5F9',

    // Borders
    border:      dark ? '#30363D' : '#E5E7EB',

    // Brand (consistent across modes)
    primary:     '#0F4C3A',
    primaryMid:  '#1E7B45',
    accent:      '#80C242',

    // Status
    success:     '#16A34A',
    warning:     '#F59E0B',
    error:       '#DC2626',

    // Derived
    isDark:      dark,

    // Helper: card style
    card: {
      background: dark ? '#161B22' : '#FFFFFF',
      border:     `1px solid ${dark ? '#30363D' : '#E5E7EB'}`,
      boxShadow:  dark
        ? '0 4px 12px rgba(0,0,0,0.3)'
        : '0 4px 12px rgba(15,76,58,0.03)',
    },

    // Helper: inner card (slightly elevated)
    innerCard: {
      background: dark ? '#21262D' : '#F8FAFC',
      border:     `1px solid ${dark ? '#30363D' : '#E5E7EB'}`,
    },
  };
}
