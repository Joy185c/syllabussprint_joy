'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import {
  LayoutDashboard, Upload, Kanban, Calendar, BarChart3,
  Clock, Settings, Sun, Moon
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload',    label: 'Upload',    icon: Upload },
  { href: '/kanban',    label: 'Kanban',    icon: Kanban },
  { href: '/timeline',  label: 'Timeline',  icon: Clock },
  { href: '/calendar',  label: 'Calendar',  icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: isDark ? 'rgba(22, 27, 34, 0.92)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? '#30363D' : '#E5E7EB'}`,
        boxShadow: isDark
          ? '0 4px 12px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(15, 76, 58, 0.03)',
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="SyllabusSprint Logo"
            style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {/* Nav links */}
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#FFFFFF' : isDark ? '#8B949E' : '#4B5563',
                  background: active ? '#80C242' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <Icon size={15} />
                <span className="hidden-mobile">{label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    style={{
                      position: 'absolute', inset: 0,
                      borderRadius: '8px',
                      background: '#80C242',
                      border: '1px solid #1E7B45',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? '#30363D' : '#E5E7EB'}`,
              background: isDark ? '#21262D' : '#F8FAFC',
              color: isDark ? '#80C242' : '#0F4C3A',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginLeft: '0.25rem',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDark ? '#2D333B' : '#F1F5F9';
              e.currentTarget.style.borderColor = isDark ? '#80C242' : '#0F4C3A';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isDark ? '#21262D' : '#F8FAFC';
              e.currentTarget.style.borderColor = isDark ? '#30363D' : '#E5E7EB';
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none; } }
      `}</style>
    </nav>
  );
}
