import type { ReactNode } from 'react'
import { SiteHeader } from './header'
import { SiteFooter } from './footer'

export function BlogLayout({ children }: { children: ReactNode }) {
  return <><SiteHeader /><div className="site-shell">{children}</div><SiteFooter /></>
}
