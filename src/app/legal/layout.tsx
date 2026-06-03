import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}>
      <nav style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-default)', display: 'flex', alignItems: 'center', gap: 20, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
          <ChevronLeft size={20} /> Kembali
        </Link>
        <div style={{ width: 1, height: 24, background: 'var(--border-default)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/icons/favicon-96x96.png" alt="Logo" width={32} height={32} unoptimized />
          <span style={{ fontWeight: 800, fontSize: 16 }}>Agen LPG</span>
        </div>
      </nav>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div className="card" style={{ padding: '40px', borderRadius: 24, background: 'var(--bg-default)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid var(--border-default)' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
