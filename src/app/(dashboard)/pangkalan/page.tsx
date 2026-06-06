'use client'

import { useApp } from '@/components/providers/AppProvider'
import { useEffect, useState, useCallback } from 'react'
import type { Pangkalan } from '@/types'
import Link from 'next/link'
import {
  Plus, Search, Filter, Download, Building2, FileSpreadsheet, FileText,
  CheckCircle2, XCircle, AlertTriangle, Eye, Edit, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Loader2, MapPin,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { logAktivitas } from '@/lib/db'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx-js-style'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CustomSelect } from '@/components/CustomSelect'

const ITEMS_PER_PAGE = 10

export default function PangkalanPage() {
  const [pangkalan, setPangkalan] = useState<Pangkalan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [filterKecamatan, setFilterKecamatan] = useState('semua')
  const [filterFoto, setFilterFoto] = useState('semua')
  const [page, setPage] = useState(1)
  const [kecamatanList, setKecamatanList] = useState<string[]>([])
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [wilayah, setWilayah] = useState('Jakarta Barat') // Default
  const [kopSurat, setKopSurat] = useState({
    kop_nama_perusahaan: '', kop_alamat: '', kop_kontak: '', kop_logo_base64: ''
  })
  const supabase = createClient()

  const { stats, profile, agenData, refresh } = useApp()

  useEffect(() => {
    if (profile) setKopSurat(profile as any)
    if (agenData?.wilayah) setWilayah(agenData.wilayah)
  }, [profile, agenData])

  useEffect(() => {
    if (stats?.total_per_kecamatan) {
      setKecamatanList(stats.total_per_kecamatan.map(k => k.kecamatan))
    }
  }, [stats])

  useEffect(() => {
    if (!stats?.pangkalan_list) {
      setLoading(false)
      return
    }
    let data = stats.pangkalan_list

    if (filterStatus !== 'semua') data = data.filter(p => p.status === filterStatus)
    if (filterKecamatan !== 'semua') data = data.filter(p => p.kecamatan === filterKecamatan)
    if (filterFoto !== 'semua') {
      data = data.filter(p => filterFoto === 'lengkap' ? p.foto_lengkap : !p.foto_lengkap)
    }
    if (search) {
      const lower = search.toLowerCase()
      data = data.filter(p => 
        p.nama_pangkalan.toLowerCase().includes(lower) || 
        p.nama_pemilik.toLowerCase().includes(lower) || 
        (p.nomor_hp && p.nomor_hp.includes(lower)) ||
        (p.id_registrasi && p.id_registrasi.toLowerCase().includes(lower))
      )
    }

    setPangkalan(data)
    setLoading(false)
  }, [stats, filterStatus, filterKecamatan, filterFoto, search])

  const handleToggleStatus = async (p: Pangkalan) => {
    const newStatus = p.status === 'aktif' ? 'nonaktif' : 'aktif'
    setTogglingId(p.id)
    try {
      await supabase
        .from('pangkalan')
        .update({ status: newStatus, updated_by: (await supabase.auth.getUser()).data.user?.id })
        .eq('id', p.id)

      await logAktivitas({
        aksi: newStatus === 'aktif' ? 'aktifkan' : 'nonaktifkan',
        entitas: 'pangkalan',
        entitas_id: p.id,
        entitas_nama: p.nama_pangkalan,
        data_lama: { status: p.status },
        data_baru: { status: newStatus },
      })

      toast.success(`Pangkalan berhasil di${newStatus === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`)
      await refresh()
    } catch {
      toast.error('Gagal mengubah status')
    } finally {
      setTogglingId(null)
    }
  }

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

    rows.push([{ v: `Laporan Data Pangkalan LPG 3Kg - ${wilayah}`, s: { font: { bold: true, sz: 12 } } }])
    rows.push([{ v: `Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` }])
    rows.push([]) // Spacing

    // Header
    const headers = ['No', 'Nama Pangkalan', 'Nama Pemilik', 'ID Registrasi', 'No. HP', 'Kecamatan', 'Kelurahan', 'Status', 'Kelengkapan']
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

    pangkalan.forEach((p, i) => {
      rows.push([
        { v: i + 1, s: centerStyle },
        { v: p.nama_pangkalan, s: bodyStyle },
        { v: p.nama_pemilik, s: bodyStyle },
        { v: p.id_registrasi, s: centerStyle },
        { v: p.nomor_hp, s: centerStyle },
        { v: p.kecamatan, s: centerStyle },
        { v: p.kelurahan, s: centerStyle },
        { v: p.status.toUpperCase(), s: centerStyle },
        { v: p.foto_lengkap ? 'Lengkap' : 'Belum Lengkap', s: centerStyle }
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
    ws['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Data Pangkalan')
    const fileNameAgen = kopSurat.kop_nama_perusahaan ? ` - ${kopSurat.kop_nama_perusahaan}` : ''
    XLSX.writeFile(wb, `Data Pangkalan${fileNameAgen}.xlsx`)
    toast.success('Data berhasil diekspor ke Excel')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
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

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Data Pangkalan LPG 3Kg - ${wilayah}`, 14, startY)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, startY + 6)

    autoTable(doc, {
      startY: startY + 12,
      head: [['No', 'Nama Pangkalan', 'Pemilik', 'ID Registrasi', 'Kecamatan', 'Status', 'Foto']],
      body: pangkalan.map((p, i) => [
        i + 1,
        p.nama_pangkalan,
        p.nama_pemilik,
        p.id_registrasi,
        p.kecamatan,
        p.status.toUpperCase(),
        p.foto_lengkap ? 'Lengkap' : 'Belum',
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
    doc.save(`Data Pangkalan${fileNameAgen}.pdf`)
    toast.success('Data berhasil diekspor ke PDF')
  }

  // Pagination
  const totalPages = Math.ceil(pangkalan.length / ITEMS_PER_PAGE)
  const paginatedData = pangkalan.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="stagger-children">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Pangkalan</h1>
          <p className="page-subtitle">
            Kelola seluruh data pangkalan LPG 3Kg wilayah {wilayah}
          </p>
        </div>
        <Link href="/pangkalan/tambah" className="btn btn-primary">
          <Plus size={16} />
          Tambah Pangkalan
        </Link>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="badge badge-blue" style={{ fontSize: 13, padding: '6px 14px' }}>
          <Building2 size={13} /> Total: {pangkalan.length}
        </div>
        <div className="badge badge-green" style={{ fontSize: 13, padding: '6px 14px' }}>
          <CheckCircle2 size={13} /> Aktif: {pangkalan.filter(p => p.status === 'aktif').length}
        </div>
        <div className="badge badge-red" style={{ fontSize: 13, padding: '6px 14px' }}>
          <XCircle size={13} /> Nonaktif: {pangkalan.filter(p => p.status === 'nonaktif').length}
        </div>
        <div className="badge badge-amber" style={{ fontSize: 13, padding: '6px 14px' }}>
          <AlertTriangle size={13} /> Belum Lengkap: {pangkalan.filter(p => !p.foto_lengkap).length}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="filter-panel" style={{ marginBottom: 16, flexDirection: 'column', alignItems: 'stretch', position: 'relative', zIndex: 40 }}>
        
        {/* Top Row: Search & Export */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
          <div className="search-wrapper filter-item-search" style={{ flex: 1, minWidth: 200 }}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Cari nama pangkalan, pemilik, ID registrasi..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          
          {/* Export buttons (Desktop only, positioned right) */}
          <div className="filter-actions-desktop mobile-hidden" style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn" 
              style={{ background: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, flex: 1, justifyContent: 'center' }} 
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button 
              className="btn" 
              style={{ background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, flex: 1, justifyContent: 'center' }} 
              onClick={handleExportPDF}
            >
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        {/* Bottom Row: Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%', position: 'relative', zIndex: 50 }}>
          {/* Status filter */}
          <CustomSelect
            className="filter-item"
            style={{ flex: 1, minWidth: 140 }}
            value={filterStatus}
            onChange={(val) => { setFilterStatus(val); setPage(1) }}
            options={[
              { value: 'semua', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Nonaktif' }
            ]}
          />

          {/* Kecamatan filter */}
          <CustomSelect
            className="filter-item"
            style={{ flex: 1, minWidth: 140 }}
            value={filterKecamatan}
            onChange={(val) => { setFilterKecamatan(val); setPage(1) }}
            options={[
              { value: 'semua', label: 'Semua Kecamatan' },
              ...kecamatanList.map(k => ({ value: k, label: k }))
            ]}
          />

          {/* Foto filter */}
          <CustomSelect
            className="filter-item"
            style={{ flex: 1, minWidth: 140 }}
            value={filterFoto}
            onChange={(val) => { setFilterFoto(val); setPage(1) }}
            options={[
              { value: 'semua', label: 'Semua Dokumen' },
              { value: 'lengkap', label: 'Dokumen Lengkap' },
              { value: 'belum', label: 'Belum Lengkap' }
            ]}
          />
        </div>

        {/* Export buttons (Mobile only, positioned bottom) */}
        <div className="filter-actions md-hidden">
          <button 
            className="btn" 
            style={{ background: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, flex: 1, justifyContent: 'center' }} 
            onClick={handleExportExcel}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button 
            className="btn" 
            style={{ background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, flex: 1, justifyContent: 'center' }} 
            onClick={handleExportPDF}
          >
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
            ))}
          </div>
        ) : pangkalan.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building2 size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, fontWeight: 500 }}>Tidak ada data pangkalan ditemukan</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Coba ubah filter atau tambah pangkalan baru</p>
            <Link href="/pangkalan/tambah" className="btn btn-primary btn-sm" style={{ marginTop: 16, display: 'inline-flex' }}>
              <Plus size={14} /> Tambah Pangkalan
            </Link>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ borderRadius: '16px 16px 0 0', border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Pangkalan</th>
                    <th>Kecamatan</th>
                    <th>No. HP</th>
                    <th>Status</th>
                    <th>Dokumen</th>
                    <th>Lokasi</th>
                    <th>Tgl Daftar</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {(page - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                          {p.nama_pangkalan}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                          {p.nama_pemilik} • {p.id_registrasi}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{p.kecamatan}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.kelurahan}</div>
                      </td>
                      <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{p.nomor_hp}</td>
                      <td>
                        <span className={`badge ${p.status === 'aktif' ? 'badge-green' : 'badge-red'}`}>
                          {p.status === 'aktif' ? '● Aktif' : '● Nonaktif'}
                        </span>
                      </td>
                      <td>
                        {p.foto_lengkap ? (
                          <span className="badge badge-green">
                            <CheckCircle2 size={11} /> Lengkap
                          </span>
                        ) : (
                          <span className="badge badge-amber">
                            <AlertTriangle size={11} /> Belum
                          </span>
                        )}
                      </td>
                      <td>
                        {p.latitude && p.longitude ? (
                          <a
                            href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                          >
                            <MapPin size={11} /> Lihat
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Belum ada</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                          <Link
                            href={`/pangkalan/${p.id}`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Lihat Detail"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            href={`/pangkalan/${p.id}/edit`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </Link>
                          <button
                            className={`btn btn-icon btn-sm ${p.status === 'aktif' ? 'btn-ghost' : 'btn-ghost'}`}
                            onClick={() => handleToggleStatus(p)}
                            disabled={togglingId === p.id}
                            title={p.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {togglingId === p.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : p.status === 'aktif'
                              ? <ToggleRight size={15} style={{ color: '#16a34a' }} />
                              : <ToggleLeft size={15} style={{ color: '#ef4444' }} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '12px 16px' }}>
              <div className="pagination">
                <span className="pagination-info">
                  Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, pangkalan.length)} dari {pangkalan.length} data
                </span>
                <div className="pagination-buttons">
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {(() => {
                    let range = [];
                    if (totalPages <= 5) {
                      range = Array.from({ length: totalPages }, (_, i) => i + 1);
                    } else if (page <= 3) {
                      range = [1, 2, 3, 4, 5];
                    } else if (page >= totalPages - 2) {
                      range = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                    } else {
                      range = [page - 2, page - 1, page, page + 1, page + 2];
                    }
                    return range.map((p) => (
                      <button
                        key={p}
                        className={`pagination-btn ${page === p ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                        style={page === p ? { background: '#16a34a', color: 'white', borderColor: '#16a34a' } : {}}
                      >
                        {p}
                      </button>
                    ));
                  })()}
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
