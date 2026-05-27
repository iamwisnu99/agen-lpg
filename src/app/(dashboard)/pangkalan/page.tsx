'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPangkalanList } from '@/lib/db'
import type { Pangkalan } from '@/types'
import Link from 'next/link'
import {
  Plus, Search, Filter, Download, Building2, FileSpreadsheet, FileText,
  CheckCircle2, XCircle, AlertTriangle, Eye, Edit, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Loader2, MapPin,
} from 'lucide-react'
import { formatDate, debounce } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { logAktivitas } from '@/lib/db'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPangkalanList({
        status: filterStatus === 'semua' ? undefined : filterStatus,
        kecamatan: filterKecamatan === 'semua' ? undefined : filterKecamatan,
        foto_lengkap: filterFoto === 'lengkap' ? true : filterFoto === 'belum' ? false : undefined,
        search: search || undefined,
      })
      setPangkalan(data)
    } catch (err) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterKecamatan, filterFoto, search])

  const debouncedFetch = useCallback(debounce(fetchData, 400), [fetchData])

  useEffect(() => {
    debouncedFetch()
  }, [search, filterStatus, filterKecamatan, filterFoto])

  useEffect(() => {
    const fetchKecamatan = async () => {
      const { data } = await supabase
        .from('wilayah')
        .select('kecamatan')
        .order('kecamatan')
      if (data) {
        const unique = [...new Set(data.map(w => w.kecamatan))]
        setKecamatanList(unique)
      }
    }
    fetchKecamatan()
  }, [])

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
      fetchData()
    } catch {
      toast.error('Gagal mengubah status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleExportExcel = () => {
    const data = pangkalan.map((p, i) => ({
      No: i + 1,
      'Nama Pangkalan': p.nama_pangkalan,
      'Nama Pemilik': p.nama_pemilik,
      'ID Registrasi': p.id_registrasi,
      'No. HP': p.nomor_hp,
      'Kecamatan': p.kecamatan,
      'Kelurahan': p.kelurahan,
      'Alamat': p.alamat,
      'Status': p.status,
      'Foto Lengkap': p.foto_lengkap ? 'Lengkap' : 'Belum Lengkap',
      'Latitude': p.latitude || '',
      'Longitude': p.longitude || '',
      'Tgl Daftar': formatDate(p.created_at),
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pangkalan')
    ws['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 14 },
      { wch: 12 }, { wch: 12 }, { wch: 14 },
    ]
    XLSX.writeFile(wb, `Data_Pangkalan_CWS_${new Date().toISOString().slice(0,10)}.xlsx`)
    toast.success('Data berhasil diekspor ke Excel')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('AGEN LPG', 14, 16)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Data Pangkalan LPG 3Kg - Jakarta Barat', 14, 23)
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 29)

    autoTable(doc, {
      startY: 35,
      head: [['No', 'Nama Pangkalan', 'Pemilik', 'ID Reg.', 'Kecamatan', 'Status', 'Foto', 'Tgl Daftar']],
      body: pangkalan.map((p, i) => [
        i + 1,
        p.nama_pangkalan,
        p.nama_pemilik,
        p.id_registrasi,
        p.kecamatan,
        p.status.toUpperCase(),
        p.foto_lengkap ? 'Lengkap' : 'Belum',
        formatDate(p.created_at),
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    })

    doc.save(`Data_Pangkalan_CWS_${new Date().toISOString().slice(0,10)}.pdf`)
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
            Kelola seluruh data pangkalan LPG 3Kg wilayah Jakarta Barat
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
      <div className="filter-panel" style={{ marginBottom: 16, flexDirection: 'column', alignItems: 'stretch' }}>
        
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
          {/* Status filter */}
          <select
            className="form-input form-select filter-item"
            style={{ flex: 1, minWidth: 140 }}
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>

          {/* Kecamatan filter */}
          <select
            className="form-input form-select filter-item"
            style={{ flex: 1, minWidth: 140 }}
            value={filterKecamatan}
            onChange={e => { setFilterKecamatan(e.target.value); setPage(1) }}
          >
            <option value="semua">Semua Kecamatan</option>
            {kecamatanList.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          {/* Foto filter */}
          <select
            className="form-input form-select filter-item"
            style={{ flex: 1, minWidth: 140 }}
            value={filterFoto}
            onChange={e => { setFilterFoto(e.target.value); setPage(1) }}
          >
            <option value="semua">Semua Dokumen</option>
            <option value="lengkap">Dokumen Lengkap</option>
            <option value="belum">Belum Lengkap</option>
          </select>
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
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    const p = Math.max(1, Math.min(page - 2 + idx, totalPages - (Math.min(5, totalPages) - 1 - idx)))
                    return (
                      <button
                        key={p}
                        className={`pagination-btn ${page === p ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  })}
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
