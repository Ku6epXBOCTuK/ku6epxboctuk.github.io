'use client'

import { useState } from 'react'
import { Menu, Moon, Sun, X, Code2, ArrowUpRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <nav className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark">✦</span>
        <span>miu<span className="brand-dot">.</span>dev</span>
      </Link>

      <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
        <Link href="/posts" className={isActive('/posts') ? 'active' : ''}>Лента</Link>
        <Link href="/articles" className={isActive('/articles') ? 'active' : ''}>Статьи</Link>
        <Link href="/projects" className={isActive('/projects') ? 'active' : ''}>Проекты</Link>
        <Link href="/reports" className={isActive('/reports') ? 'active' : ''}>Отчёты</Link>
      </div>

      <div className="nav-actions">
        <button
          className="theme-toggle"
          aria-label="Переключить тему"
          onClick={() => {
            setDark(!dark)
            document.documentElement.classList.toggle('dark', !dark)
          }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <a className="github-link" href="https://github.com" target="_blank" rel="noopener noreferrer">
          <Code2 size={17} /> GitHub <ArrowUpRight size={14} />
        </a>
        <button
          className="menu-button"
          aria-label="Открыть меню"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
    </nav>
  )
}
