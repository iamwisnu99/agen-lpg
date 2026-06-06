'use client'

import { useEffect } from 'react'
import { AlertOctagon, RefreshCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Terjadi kesalahan:', error)
  }, [error])

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
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          color: '#ef4444'
        }}>
          <AlertOctagon size={40} strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginBottom: 12 }}>
          Terjadi Kesalahan Teknis
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary, #64748b)', marginBottom: 32, lineHeight: 1.6 }}>
          Kami mendapati masalah saat memuat halaman ini. Silakan coba muat ulang halaman.
        </p>
        <button
          onClick={() => reset()}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--brand-primary, #16a34a)', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
            cursor: 'pointer', transition: 'all 0.2s', width: '100%'
          }}
        >
          <RefreshCcw size={16} />
          Coba Muat Ulang
        </button>
      </div>
    </div>
  )
}
