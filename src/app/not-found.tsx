import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-default, #f8fafc)',
      padding: 24,
      textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--bg-surface, #ffffff)',
        padding: '48px 40px',
        borderRadius: 24,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        maxWidth: 440,
        width: '100%'
      }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          color: '#3b82f6'
        }}>
          <FileQuestion size={40} strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: 12 }}>
          Halaman Tidak Ditemukan
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary, #64748b)', marginBottom: 32, lineHeight: 1.6 }}>
          Maaf, halaman yang Anda cari mungkin telah dihapus, diubah namanya, atau tidak pernah ada.
        </p>
        <Link 
          href="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--brand-primary, #16a34a)', color: 'white',
            padding: '12px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
            textDecoration: 'none', transition: 'all 0.2s', width: '100%'
          }}
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
