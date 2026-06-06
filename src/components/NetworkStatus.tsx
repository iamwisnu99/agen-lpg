'use client'

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)

      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  if (isOnline) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(248, 250, 252, 0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div style={{
        background: '#ffffff',
        padding: '48px 40px',
        borderRadius: 24,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        maxWidth: 440,
        width: '100%'
      }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          color: '#f59e0b'
        }}>
          <WifiOff size={40} strokeWidth={1.5} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Koneksi Internet Terputus
        </h2>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 0, lineHeight: 1.6 }}>
          Aplikasi ini memerlukan koneksi internet aktif. Layar akan tertutup otomatis saat jaringan Anda kembali terhubung.
        </p>
      </div>
    </div>
  )
}
