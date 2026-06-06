'use client'

import { AlertOctagon, RefreshCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: 24,
          textAlign: 'center'
        }}>
          <div style={{
            background: '#ffffff',
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
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Sistem Mengalami Kendala
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
              Maaf, telah terjadi kesalahan sistem yang fatal. Kami telah mencatat masalah ini dan sedang berusaha menanganinya.
            </p>
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#16a34a', color: 'white', border: 'none',
                padding: '12px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.2s', width: '100%'
              }}
            >
              <RefreshCcw size={16} />
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
