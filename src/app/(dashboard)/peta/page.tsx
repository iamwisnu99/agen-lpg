'use client'

import dynamic from 'next/dynamic'

const MonitoringMap = dynamic(() => import('@/components/maps/MonitoringMap'), {
  ssr: false,
  loading: () => (
    <div className="skeleton" style={{ height: 'calc(100vh - 200px)', borderRadius: 16 }} />
  ),
})

export default function PetaPage() {
  return (
    <div className="stagger-children">
      <div className="page-header">
        <div>
          <h1 className="page-title">Peta Monitoring</h1>
          <p className="page-subtitle">
            Monitoring seluruh pangkalan LPG 3Kg wilayah Jakarta Barat
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MonitoringMap height={600} miniMode={false} />
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          padding: '14px 20px',
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border-default)',
          marginTop: 16,
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginRight: 8 }}>Legenda:</div>
        {[
          { color: '#16a34a', label: 'Pangkalan Aktif & Dokumen Lengkap' },
          { color: '#ef4444', label: 'Pangkalan Nonaktif' },
          { color: '#f59e0b', label: 'Dokumen Belum Lengkap' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 14, height: 14,
              background: item.color,
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              border: `2px solid ${item.color}`,
              flexShrink: 0,
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
