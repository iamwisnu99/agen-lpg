'use client'

import { useEffect, useState } from 'react'
import { getLogAktivitas } from '@/lib/db'
import type { LogAktivitas } from '@/types'
import { ClipboardList, User, Calendar, ChevronLeft, ChevronRight, Search,
  Plus, Pencil, Trash2, CheckCircle2, XCircle, Camera, LogIn, LogOut, FileText } from 'lucide-react'
import { formatDateTime, formatTimeAgo } from '@/lib/utils'
import Link from 'next/link'

type AksiInfo = { label: string; color: string; bg: string; Icon: React.ElementType }

const AKSI_LABELS: Record<string, AksiInfo> = {
  tambah:       { label: 'Tambah',       color: '#15803d', bg: 'rgba(22,163,74,0.1)',    Icon: Plus },
  edit:         { label: 'Edit',         color: '#2563eb', bg: 'rgba(59,130,246,0.1)',   Icon: Pencil },
  hapus:        { label: 'Hapus',        color: '#dc2626', bg: 'rgba(220,38,38,0.1)',    Icon: Trash2 },
  aktifkan:     { label: 'Aktifkan',     color: '#15803d', bg: 'rgba(22,163,74,0.1)',    Icon: CheckCircle2 },
  nonaktifkan:  { label: 'Nonaktifkan', color: '#dc2626', bg: 'rgba(220,38,38,0.1)',    Icon: XCircle },
  upload_foto:  { label: 'Upload Foto', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',   Icon: Camera },
  hapus_foto:   { label: 'Hapus Foto',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)',    Icon: Trash2 },
  login:        { label: 'Login',        color: '#d97706', bg: 'rgba(245,158,11,0.1)',   Icon: LogIn },
  logout:       { label: 'Logout',       color: '#64748b', bg: 'rgba(100,116,139,0.1)', Icon: LogOut },
}

const ITEMS_PER_PAGE = 20

export default function AktivitasPage() {
  const [logs, setLogs] = useState<LogAktivitas[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const { data, count } = await getLogAktivitas(ITEMS_PER_PAGE, (page - 1) * ITEMS_PER_PAGE)
        setLogs(data)
        setTotal(count)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [page])

  const filtered = search
    ? logs.filter(l =>
        l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        l.entitas_nama?.toLowerCase().includes(search.toLowerCase()) ||
        l.aksi.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="stagger-children">
      <div className="page-header">
        <div>
          <h1 className="page-title">Log Aktivitas</h1>
          <p className="page-subtitle">Riwayat seluruh perubahan dan aktivitas sistem</p>
        </div>
      </div>

      {/* Search */}
      <div className="filter-panel" style={{ marginBottom: 16 }}>
        <div className="search-wrapper" style={{ flex: 1 }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Cari berdasarkan user, nama pangkalan, atau aksi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Total: {total} log
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
            <ClipboardList size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, fontWeight: 500 }}>Belum ada log aktivitas</p>
          </div>
        ) : (
          <div>
            {filtered.map((log, i) => {
              const aksiInfo: AksiInfo = AKSI_LABELS[log.aksi] || { label: log.aksi, color: '#64748b', bg: 'rgba(100,116,139,0.1)', Icon: FileText }
              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: '16px 20px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border-muted)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  className="hover-row"
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: aksiInfo.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <aksiInfo.Icon size={18} color={aksiInfo.color} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '2px 8px', borderRadius: 99,
                          fontSize: 11, fontWeight: 700,
                          color: aksiInfo.color, background: aksiInfo.bg,
                        }}
                      >
                        {aksiInfo.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {log.entitas_nama || log.entitas}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex', gap: 12, marginTop: 5, flexWrap: 'wrap',
                        fontSize: 12, color: 'var(--text-muted)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={11} /> {log.user_name || 'System'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> {formatDateTime(log.created_at)}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {formatTimeAgo(log.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Link to entity */}
                  {log.entitas === 'pangkalan' && log.entitas_id && log.aksi !== 'hapus' && (
                    <Link
                      href={`/pangkalan/${log.entitas_id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, flexShrink: 0, alignSelf: 'center' }}
                    >
                      Detail →
                    </Link>
                  )}
                </div>
              )
            })}

            {/* Pagination */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)' }}>
              <div className="pagination">
                <span className="pagination-info">
                  Halaman {page} dari {totalPages || 1} ({total} total)
                </span>
                <div className="pagination-buttons">
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .hover-row:hover {
          background: var(--bg-hover);
        }
      `}</style>
    </div>
  )
}
