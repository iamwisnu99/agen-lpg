'use client'

import { useApp } from '@/components/providers/AppProvider'
import { useState, useEffect } from 'react'
import type { Armada } from '@/types'
import Link from 'next/link'
import {
  Plus, Search, Truck, AlertCircle, AlertTriangle, FileSpreadsheet, FileText,
  CheckCircle2, XCircle, Wrench, Edit, Trash2, Calendar, User, UserCheck
} from 'lucide-react'
import { formatDate, getDaysRemaining } from '@/lib/utils'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx-js-style'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { deleteArmada, logAktivitas } from '@/lib/db'
import { CustomSelect } from '@/components/CustomSelect'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import Image from 'next/image'

const ITEMS_PER_PAGE = 10

export default function ArmadaPage() {
  const [armada, setArmada] = useState<Armada[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [kopSurat, setKopSurat] = useState({
    kop_nama_perusahaan: '', kop_alamat: '', kop_kontak: '', kop_logo_base64: ''
  })
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; no_plat: string; data: Armada } | null>(null)
  const { armada: globalArmada, profile, refresh } = useApp()

  useEffect(() => {
    if (profile) setKopSurat(profile as any)
  }, [profile])

  useEffect(() => {
    let data = globalArmada

    if (filterStatus !== 'Semua') {
      data = data.filter(a => a.status === filterStatus.toLowerCase())
    }

    if (search) {
      const lower = search.toLowerCase()
      data = data.filter(a => 
        a.no_plat.toLowerCase().includes(lower) || 
        a.nama_sopir.toLowerCase().includes(lower)
      )
    }

    setArmada(data)
    setLoading(false)
  }, [globalArmada, filterStatus, search])

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()
    const rows: any[] = []
    
    // Kop Surat
    if (kopSurat.kop_nama_perusahaan) {
      rows.push([{ v: kopSurat.kop_nama_perusahaan, s: { font: { bold: true, sz: 14 } } }])
      rows.push([{ v: kopSurat.kop_alamat || '' }])
      rows.push([{ v: kopSurat.kop_kontak || '' }])
      rows.push([]) // Spacing
    }

    rows.push([{ v: 'Laporan Data Armada', s: { font: { bold: true, sz: 12 } } }])
    rows.push([{ v: `Dicetak pada: ${formatDate(new Date().toISOString())}` }])
    rows.push([]) // Spacing

    // Header
    const headers = ['No', 'No. Plat', 'Nama Sopir', 'Pajak 1 Tahun', 'Pajak 5 Tahun', 'Status']
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "16A34A" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    }
    rows.push(headers.map(h => ({ v: h, s: headerStyle })))

    // Body
    const bodyStyle = { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } }
    const centerStyle = { ...bodyStyle, alignment: { horizontal: "center" } }

    armada.forEach((a, i) => {
      rows.push([
        { v: i + 1, s: centerStyle },
        { v: a.no_plat, s: centerStyle },
        { v: a.nama_sopir, s: bodyStyle },
        { v: a.jatuh_tempo_pajak_1_tahun ? formatDate(a.jatuh_tempo_pajak_1_tahun) : '-', s: centerStyle },
        { v: a.jatuh_tempo_plat_5_tahun ? formatDate(a.jatuh_tempo_plat_5_tahun) : '-', s: centerStyle },
        { v: a.status.toUpperCase(), s: centerStyle }
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Merges
    const mergeCount = headers.length - 1
    if (kopSurat.kop_nama_perusahaan) {
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: mergeCount } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: mergeCount } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: mergeCount } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: mergeCount } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: mergeCount } }
      ]
    } else {
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: mergeCount } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: mergeCount } }
      ]
    }

    // Column widths
    ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]

    XLSX.utils.book_append_sheet(wb, ws, 'Data Armada')
    const fileNameAgen = kopSurat.kop_nama_perusahaan ? ` - ${kopSurat.kop_nama_perusahaan}` : ''
    XLSX.writeFile(wb, `Data Armada${fileNameAgen}.xlsx`)
    toast.success('Data berhasil diekspor ke Excel')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let startY = 15

    // KOP SURAT
    if (kopSurat.kop_nama_perusahaan || kopSurat.kop_logo_base64) {
      let textStartX = 14
      if (kopSurat.kop_logo_base64) {
        doc.addImage(kopSurat.kop_logo_base64, 'PNG', 14, 10, 22, 22)
        textStartX = 40 // 14 + 22 + 4 spacing
      }
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(kopSurat.kop_nama_perusahaan || 'NAMA PERUSAHAAN', textStartX, 16, { align: 'left' })
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(kopSurat.kop_alamat || '', textStartX, 22, { align: 'left' })
      doc.text(kopSurat.kop_kontak || '', textStartX, 28, { align: 'left' })

      // Double Line
      doc.setLineWidth(0.5)
      doc.line(14, 34, pageWidth - 14, 34)
      doc.setLineWidth(1.2)
      doc.line(14, 36, pageWidth - 14, 36)
      
      startY = 46
    }

    // TITLE
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Laporan Data Armada', 14, startY)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak pada: ${formatDate(new Date().toISOString())}`, 14, startY + 6)

    // TABLE
    autoTable(doc, {
      startY: startY + 12,
      head: [['No', 'No. Plat', 'Sopir', 'Pajak 1 Thn', 'Pajak 5 Thn', 'Status']],
      body: armada.map((a, i) => [
        i + 1,
        a.no_plat,
        a.nama_sopir,
        a.jatuh_tempo_pajak_1_tahun ? formatDate(a.jatuh_tempo_pajak_1_tahun) : '-',
        a.jatuh_tempo_plat_5_tahun ? formatDate(a.jatuh_tempo_plat_5_tahun) : '-',
        a.status.toUpperCase(),
      ]),
      styles: { fontSize: 9, cellPadding: 5, textColor: [40, 40, 40] },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [200, 200, 200] },
      bodyStyles: { lineWidth: 0.1, lineColor: [220, 220, 220] },
      alternateRowStyles: { fillColor: [252, 252, 252] },
    })

    // FOOTER (Page Numbers)
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' })
    }

    const fileNameAgen = kopSurat.kop_nama_perusahaan ? ` - ${kopSurat.kop_nama_perusahaan}` : ''
    doc.save(`Data Armada${fileNameAgen}.pdf`)
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
      await refresh()
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
