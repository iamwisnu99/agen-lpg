'use client'

import { useApp } from '@/components/providers/AppProvider'
import type { DashboardStats } from '@/types'
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Map,
  RefreshCw,
  Plus,
  ChevronRight,
  Truck,
} from 'lucide-react'
import { formatTimeAgo, getDaysRemaining } from '@/lib/utils'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MonitoringMap = dynamic(() => import('@/components/maps/MonitoringMap'), {
  ssr: false,
  loading: () => (
    <div className="skeleton" style={{ height: 480, borderRadius: 16 }} />
  ),
})

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sublabel,
  loading,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: 'green' | 'red' | 'amber' | 'blue'
  sublabel?: string
  loading?: boolean
}) {
  const colors = {
    green: { bg: 'rgba(22,163,74,0.1)', icon: '#16a34a', text: '#16a34a' },
    red: { bg: 'rgba(220,38,38,0.1)', icon: '#dc2626', text: '#dc2626' },
    amber: { bg: 'rgba(245,158,11,0.1)', icon: '#d97706', text: '#d97706' },
    blue: { bg: 'rgba(59,130,246,0.1)', icon: '#2563eb', text: '#2563eb' },
  }
  const c = colors[color]

  if (loading) {
    return <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
  }

  return (
    <div className={`stat-card ${color}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-value">{value.toLocaleString('id-ID')}</div>
          <div className="stat-label" style={{ marginTop: 4 }}>{label}</div>
          {sublabel && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {sublabel}
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ background: c.bg }}>
          <Icon size={22} color={c.icon} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { stats, armada, loading, refreshing, refresh } = useApp()

  const handleRefresh = async () => {
    await refresh()
  }

  const completionRate = stats
    ? Math.round(((stats.total_pangkalan - stats.total_belum_lengkap) / Math.max(stats.total_pangkalan, 1)) * 100)
    : 0

  return (
    <div className="stagger-children">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Agen LPG - Monitoring Pangkalan LPG 3Kg
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link href="/pangkalan/tambah" className="btn btn-primary btn-sm">
            <Plus size={14} />
            Tambah Pangkalan
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Pangkalan"
          value={stats?.total_pangkalan || 0}
          icon={Building2}
          color="blue"
          sublabel="Seluruh wilayah"
          loading={loading}
        />
        <StatCard
          label="Pangkalan Aktif"
          value={stats?.total_aktif || 0}
          icon={CheckCircle2}
          color="green"
          sublabel="Beroperasi normal"
          loading={loading}
        />
        <StatCard
          label="Pangkalan Nonaktif"
          value={stats?.total_nonaktif || 0}
          icon={XCircle}
          color="red"
          sublabel="Sementara nonaktif"
          loading={loading}
        />
        <StatCard
          label="Dokumen Belum Lengkap"
          value={stats?.total_belum_lengkap || 0}
          icon={AlertTriangle}
          color="amber"
          sublabel="Perlu tindak lanjut"
          loading={loading}
        />
      </div>

      {/* Armada Tax Warnings Widget */}
      {!loading && armada.length > 0 && (() => {
        const expiring = armada.filter(a => {
          if (!a.jatuh_tempo_pajak_1_tahun) return false
          const days = getDaysRemaining(a.jatuh_tempo_pajak_1_tahun)
          return days >= 0 && days <= 30
        })

        if (expiring.length === 0) return null

        return (
          <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Peringatan Pajak Armada
                  <span className="badge badge-red" style={{ padding: '2px 8px', fontSize: 11, animation: 'pulse 2s infinite' }}>{expiring.length} Kendaraan</span>
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pajak kendaraan akan segera habis dalam kurang dari 30 hari.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {expiring.map(a => {
                const days = getDaysRemaining(a.jatuh_tempo_pajak_1_tahun!)
                return (
                  <Link key={a.id} href={`/armada/${a.id}`} style={{ flex: '0 0 auto', width: 240, border: '1px solid var(--border-default)', borderRadius: 8, padding: 12, background: 'var(--bg-surface)', textDecoration: 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{a.no_plat}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sopir: {a.nama_sopir}</div>
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} /> {days === 0 ? 'Habis hari ini!' : `Sisa ${days} hari`}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Completion Progress */}
      {!loading && stats && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Kelengkapan Dokumen
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {stats.total_pangkalan - stats.total_belum_lengkap} dari {stats.total_pangkalan} pangkalan sudah lengkap
              </div>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: completionRate >= 80 ? '#16a34a' : completionRate >= 50 ? '#d97706' : '#dc2626',
              }}
            >
              {completionRate}%
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${completionRate}%`,
                background: completionRate >= 80
                  ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                  : completionRate >= 50
                    ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                    : 'linear-gradient(90deg, #dc2626, #f87171)',
              }}
            />
          </div>
        </div>
      )}

      {/* Map + Kecamatan Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 20,
          marginBottom: 24,
        }}
        className="responsive-map-grid"
      >
        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Map size={16} color="#16a34a" />
              Peta Monitoring Pangkalan
            </div>
            <Link href="/peta" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              Lihat Penuh <ChevronRight size={12} />
            </Link>
          </div>
          <MonitoringMap height={400} miniMode />
        </div>

        {/* Kecamatan Stats */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="#16a34a" />
            Per Kecamatan
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats?.total_per_kecamatan.slice(0, 8).map((item) => {
                const pct = Math.round((item.count / Math.max(stats.total_pangkalan, 1)) * 100)
                return (
                  <div key={item.kecamatan}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.kecamatan}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                        {item.count}
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {(!stats?.total_per_kecamatan.length) && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  Belum ada data
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Pangkalan */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} color="#16a34a" />
            Pangkalan Terbaru
          </div>
          <Link href="/pangkalan" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
            Lihat Semua <ChevronRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />
            ))}
          </div>
        ) : stats?.pangkalan_terbaru.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <Building2 size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14 }}>Belum ada data pangkalan</p>
            <Link href="/pangkalan/tambah" className="btn btn-primary btn-sm" style={{ marginTop: 12, display: 'inline-flex' }}>
              <Plus size={14} /> Tambah Pangkalan Pertama
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats?.pangkalan_terbaru.map((p) => (
              <Link
                key={p.id}
                href={`/pangkalan/${p.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border-default)',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                className="hover-card"
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: p.status === 'aktif' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={18} color={p.status === 'aktif' ? '#16a34a' : '#dc2626'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.nama_pangkalan}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {p.kecamatan} • {formatTimeAgo(p.created_at)}
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${p.status === 'aktif' ? 'badge-green' : 'badge-red'}`}>
                    {p.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {!p.foto_lengkap && (
                    <span className="badge badge-amber" title="Dokumen belum lengkap" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <AlertTriangle size={11} /> Belum Lengkap
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
