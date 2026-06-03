'use client'

import { useEffect, useState, useCallback } from 'react'
import { getArmadaList, deleteArmada, logAktivitas } from '@/lib/db'
import type { Armada } from '@/types'
import Link from 'next/link'
import {
  Plus, Search, Truck, AlertCircle, AlertTriangle, FileSpreadsheet, FileText,
  CheckCircle2, XCircle, Wrench, Edit, Trash2, Calendar, User, UserCheck
} from 'lucide-react'
import { formatDate, debounce, getDaysRemaining } from '@/lib/utils'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CustomSelect } from '@/components/CustomSelect'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import Image from 'next/image'

const ITEMS_PER_PAGE = 10

export default function ArmadaPage() {
  const [armada, setArmada] = useState<Armada[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; no_plat: string; data: Armada } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getArmadaList({
        status: filterStatus === 'semua' ? undefined : filterStatus,
        search: search || undefined,
      })
      setArmada(data)
    } catch (err) {
      toast.error('Gagal memuat data armada')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, search])

  const debouncedFetch = useCallback(debounce(fetchData, 400), [fetchData])

  useEffect(() => {
    debouncedFetch()
  }, [search, filterStatus])

  const handleExportExcel = () => {
    const dataToExport = armada.map((a, i) => ({
      No: i + 1,
      'No. Plat': a.no_plat,
      'Nama Sopir': a.nama_sopir,
      'Pajak 1 Tahun': a.jatuh_tempo_pajak_1_tahun ? formatDate(a.jatuh_tempo_pajak_1_tahun) : '-',
      'Pajak 5 Tahun': a.jatuh_tempo_plat_5_tahun ? formatDate(a.jatuh_tempo_plat_5_tahun) : '-',
      'Status': a.status.toUpperCase(),
      'Tgl Daftar': formatDate(a.created_at)
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Armada')
    XLSX.writeFile(wb, `Data_Armada_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Data berhasil diekspor ke Excel')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text('Data Armada', 14, 15)
    doc.setFontSize(10)
    doc.text(`Tanggal Ekspor: ${formatDate(new Date().toISOString())}`, 14, 22)

    autoTable(doc, {
      startY: 30,
      head: [['No', 'No. Plat', 'Sopir', 'Pajak 1 Thn', 'Pajak 5 Thn', 'Status']],
      body: armada.map((a, i) => [
        i + 1,
        a.no_plat,
        a.nama_sopir,
        a.jatuh_tempo_pajak_1_tahun ? formatDate(a.jatuh_tempo_pajak_1_tahun) : '-',
        a.jatuh_tempo_plat_5_tahun ? formatDate(a.jatuh_tempo_plat_5_tahun) : '-',
        a.status.toUpperCase(),
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    })

    doc.save(`Data_Armada_${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.success('Data berhasil diekspor ke PDF')
  }

  const almostExpiredPajak = armada.filter(a => {
    if (!a.jatuh_tempo_pajak_1_tahun) return false
    const days = getDaysRemaining(a.jatuh_tempo_pajak_1_tahun)
    return days >= 0 && days <= 30
  }).length

  const handleDelete = async (id: string, no_plat: string, data: Armada) => {
    setDeletingId(id)
    try {
      await logAktivitas({
        aksi: 'hapus',
        entitas: 'armada',
        entitas_id: id,
        entitas_nama: no_plat,
        data_lama: data,
      })
      await deleteArmada(id)
      toast.success('Data armada berhasil dihapus')
      fetchData()
    } catch (err) {
      toast.error('Gagal menghapus data')
    } finally {
      setDeletingId(null)
      setPendingDelete(null)
    }
  }

  // Pagination
  const totalPages = Math.ceil(armada.length / ITEMS_PER_PAGE)
  const paginatedData = armada.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <>
      <div className="stagger-children">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Armada</h1>
          <p className="page-subtitle">Kelola kendaraan truk dan informasi sopir</p>
        </div>
        <Link href="/armada/tambah" className="btn btn-primary">
          <Plus size={16} />
          Tambah Armada
        </Link>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="badge badge-blue" style={{ fontSize: 13, padding: '6px 14px' }}>
          <Truck size={13} /> Total: {armada.length}
        </div>
        <div className="badge badge-green" style={{ fontSize: 13, padding: '6px 14px' }}>
          <CheckCircle2 size={13} /> Aktif: {armada.filter(a => a.status === 'aktif').length}
        </div>
        <div className="badge badge-amber" style={{ fontSize: 13, padding: '6px 14px' }}>
          <Wrench size={13} /> Perbaikan: {armada.filter(a => a.status === 'perbaikan').length}
        </div>
        {almostExpiredPajak > 0 && (
          <div className="badge badge-red" style={{ fontSize: 13, padding: '6px 14px', animation: 'pulse 2s infinite' }}>
            <AlertTriangle size={13} /> {almostExpiredPajak} Pajak Hampir Habis
          </div>
        )}
      </div>

      {/* Filter & Search */}
      <div className="filter-panel" style={{ marginBottom: 16, flexDirection: 'column', alignItems: 'stretch', position: 'relative', zIndex: 40 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
          <div className="search-wrapper filter-item-search" style={{ flex: 1, minWidth: 200 }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Cari plat nomor atau sopir..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          
          <div className="filter-actions-desktop mobile-hidden" style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }} onClick={handleExportExcel}>
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button className="btn" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }} onClick={handleExportPDF}>
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%', position: 'relative', zIndex: 50, marginTop: 12 }}>
          <CustomSelect
            className="filter-item"
            style={{ minWidth: 160 }}
            value={filterStatus}
            onChange={(val) => { setFilterStatus(val); setPage(1) }}
            options={[
              { value: 'semua', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'perbaikan', label: 'Perbaikan' },
              { value: 'nonaktif', label: 'Nonaktif' }
            ]}
          />
        </div>
      </div>

      {/* Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          ))
        ) : armada.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 64, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-default)' }}>
            <Truck size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, fontWeight: 500 }}>Tidak ada data armada ditemukan</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Coba ubah filter atau tambah armada baru</p>
            <Link href="/armada/tambah" className="btn btn-primary btn-sm" style={{ marginTop: 16, display: 'inline-flex' }}>
              <Plus size={14} /> Tambah Armada
            </Link>
          </div>
        ) : (
          paginatedData.map((a) => {
            let warning = false
            let daysRemaining = -1
            if (a.jatuh_tempo_pajak_1_tahun) {
              daysRemaining = getDaysRemaining(a.jatuh_tempo_pajak_1_tahun)
              if (daysRemaining >= 0 && daysRemaining <= 30) warning = true
            }

            return (
              <div key={a.id} className="card hover-scale" style={{ padding: 16, border: warning ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-default)', background: warning ? 'rgba(239, 68, 68, 0.02)' : 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
                {/* 16:9 Image Thumbnail */}
                <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: 'var(--bg-muted)', position: 'relative' }}>
                  {a.foto_kendaraan ? (
                    <Image src={a.foto_kendaraan} alt={a.no_plat} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} unoptimized={true} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={32} color="var(--text-muted)" />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <Link href={`/armada/${a.id}`} style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {a.no_plat}
                    </Link>
                    <div style={{ marginTop: 4 }}>
                      <span className={`badge badge-${a.status === 'aktif' ? 'green' : a.status === 'perbaikan' ? 'amber' : 'red'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                        {a.status === 'aktif' ? 'Aktif' : a.status === 'perbaikan' ? 'Perbaikan' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Link href={`/armada/${a.id}/edit`} className="btn btn-ghost btn-icon" style={{ padding: 6, height: 'auto', width: 'auto' }} title="Edit">
                      <Edit size={16} color="var(--text-muted)" />
                    </Link>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      style={{ padding: 6, height: 'auto', width: 'auto' }} 
                      title="Hapus"
                      onClick={(e) => { e.preventDefault(); setPendingDelete({ id: a.id, no_plat: a.no_plat, data: a }) }}
                      disabled={deletingId === a.id}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <User size={14} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>{a.nama_sopir}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: warning ? '#ef4444' : 'var(--text-secondary)' }}>
                    <Calendar size={14} color={warning ? '#ef4444' : 'var(--text-muted)'} />
                    <span>
                      Pajak: {a.jatuh_tempo_pajak_1_tahun ? formatDate(a.jatuh_tempo_pajak_1_tahun) : '-'}
                      {warning && <span style={{ fontWeight: 600, marginLeft: 4 }}>(Sisa {daysRemaining} hr)</span>}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Hal {page} dari {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>

    <DeleteConfirmModal
      open={!!pendingDelete}
      title="Hapus Data Armada?"
      description="Anda akan menghapus data kendaraan berikut secara permanen:"
      itemName={pendingDelete?.no_plat}
      loading={!!deletingId}
      onConfirm={() => pendingDelete && handleDelete(pendingDelete.id, pendingDelete.no_plat, pendingDelete.data)}
      onCancel={() => setPendingDelete(null)}
    />
    </>
  )
}
