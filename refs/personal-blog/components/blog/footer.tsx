import Link from 'next/link'
import { Heart } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer>
      <Link href="/" className="brand">
        <span className="brand-mark">✦</span>
        <span>miu<span className="brand-dot">.</span>dev</span>
      </Link>
      <p>сделано с вниманием к деталям <Heart size={13} /></p>
      <span className="footer-code">© 2024 / system.online</span>
    </footer>
  )
}
