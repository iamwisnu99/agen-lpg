'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Plus, Save, FileText, X, Eye, Trash2, Search, ChevronLeft, ChevronRight, Calendar, TrendingUp, Package, Clock, BarChart3 } from 'lucide-react'
import { getLaporanDOList, createLaporanDO, deleteLaporanDO } from '@/lib/db'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import type { LaporanDO } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { CustomSelect } from '@/components/CustomSelect'

export default function InputDOPage() {
  const { data: laporanList = [], mutate: fetchData, isLoading: loading } = useSWR<LaporanDO[]>('laporanDOList', () => getLaporanDOList(), {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State
  const [spbe, setSpbe] = useState<'SADIKUN' | 'JAKPRO'>('SADIKUN')
  const [items, setItems] = useState<Array<{ id: string, tanggal: string, alokasi: string, jenis: string }>>([
    { id: '1', tanggal: new Date().toISOString().split('T')[0], alokasi: '', jenis: 'Normal' }
  ])

  // Filter & Pagination State
  const [filterSpbe, setFilterSpbe] = useState('Semua')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Fetching handled by useSWR

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(), tanggal: new Date().toISOString().split('T')[0], alokasi: '', jenis: 'Normal' }])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return
    setItems(items.filter(item => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const getJumlahDO = (alokasiStr: string) => {
    const val = parseInt(alokasiStr) || 0
    if (val === 0) return 0
    return Math.ceil(val / 560)
  }

  const handleSave = async () => {
    const invalidItems = items.some(i => !i.tanggal || !i.alokasi || parseInt(i.alokasi) <= 0)
    if (invalidItems) {
      toast.error('Mohon lengkapi semua baris (tanggal dan alokasi > 0)')
      return
    }

    setSaving(true)
    try {
      const formattedItems = items.map(i => ({
        tanggal: i.tanggal,
        alokasi: parseInt(i.alokasi),
        jumlah_do: getJumlahDO(i.alokasi),
        jenis: i.jenis
      }))
      
      await createLaporanDO(spbe, formattedItems)
      toast.success('Laporan DO berhasil disimpan!')
      setShowModal(false)
      fetchData()
      setItems([{ id: '1', tanggal: new Date().toISOString().split('T')[0], alokasi: '', jenis: 'Normal' }])
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteModalId) return
    setIsDeleting(true)
    
    try {
      await deleteLaporanDO(deleteModalId)
      toast.success('Laporan DO berhasil dihapus')
      setDeleteModalId(null)
      fetchData()
    } catch (err) {
      toast.error('Gagal menghapus Laporan DO')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter and Pagination Logic
  const filteredList = laporanList.filter(l => {
    const matchSpbe = filterSpbe === 'Semua' || l.spbe === filterSpbe;
    const lDate = new Date(l.created_at);
    const matchStart = !startDate || lDate >= new Date(startDate);
    const matchEnd = !endDate || lDate <= new Date(endDate + 'T23:59:59');
    return matchSpbe && matchStart && matchEnd;
  })
  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Metrik Bulanan
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  let totalDoBulanIni = 0
  let totalTabungBulanIni = 0
  let normalBulanIni = 0
  let fakultatifBulanIni = 0

  laporanList.forEach(l => {
    const d = new Date(l.created_at)
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      l.items?.forEach(i => {
        totalDoBulanIni += i.jumlah_do
        totalTabungBulanIni += i.alokasi
        if (i.jenis === 'Normal') normalBulanIni += i.jumlah_do
        else fakultatifBulanIni += i.jumlah_do
      })
    }
  })

  const normalPercent = totalDoBulanIni > 0 ? Math.round((normalBulanIni / totalDoBulanIni) * 100) : 0
  const fakultatifPercent = totalDoBulanIni > 0 ? 100 - normalPercent : 0

  const lastActivityDate = laporanList.length > 0 ? new Date(laporanList[0].created_at) : null
  const lastActivityStr = lastActivityDate ? lastActivityDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Belum ada data'

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Input Laporan DO</h1>
          <p className="page-subtitle">Kelola dan input data Delivery Order dari SPBE</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Buat DO
        </button>
      </div>

      {/* DASHBOARD WIDGETS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }} className="animate-fade-in">
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>TOTAL DO (BULAN INI)</div>
            <div style={{ padding: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, color: '#3b82f6' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{totalDoBulanIni} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>DO</span></div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>TOTAL TABUNG</div>
            <div style={{ padding: 8, background: 'rgba(22, 163, 74, 0.1)', borderRadius: 8, color: '#16a34a' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{totalTabungBulanIni.toLocaleString('id-ID')} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Pcs</span></div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>JENIS ALOKASI</div>
            <div style={{ padding: 8, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, color: '#f59e0b' }}>
              <BarChart3 size={18} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              <span style={{ color: '#16a34a' }}>Normal {normalPercent}%</span>
              <span style={{ color: '#f59e0b' }}>Fakul {fakultatifPercent}%</span>
            </div>
            <div style={{ height: 6, width: '100%', background: 'rgba(245, 158, 11, 0.2)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', width: `${normalPercent}%`, background: '#16a34a' }} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>AKTIVITAS TERAKHIR</div>
            <div style={{ padding: 8, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8, color: '#8b5cf6' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: lastActivityDate ? '#10b981' : '#9ca3af' }} />
            {lastActivityStr}
          </div>
        </div>
      </div>

      <div className="card animate-fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#16a34a" /> Daftar Input DO
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end', background: 'var(--bg-base)', padding: 16, borderRadius: 12, border: '1px solid var(--border-default)' }}>
            <div>
              <label className="form-label" style={{ fontSize: 12 }}>Filter SPBE</label>
              <CustomSelect 
                value={filterSpbe}
                onChange={val => { setFilterSpbe(val as string); setCurrentPage(1); }}
                options={[
                  { value: 'Semua', label: 'Semua SPBE' },
                  { value: 'SADIKUN', label: 'SADIKUN' },
                  { value: 'JAKPRO', label: 'JAKPRO' }
                ]}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12 }}>Dari Tanggal</label>
              <CustomDatePicker 
                value={startDate}
                onChange={val => { setStartDate(val); setCurrentPage(1); }}
                placeholder="Pilih Tanggal Mulai"
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12 }}>Sampai Tanggal</label>
              <CustomDatePicker 
                value={endDate}
                onChange={val => { setEndDate(val); setCurrentPage(1); }}
                placeholder="Pilih Tanggal Selesai"
              />
            </div>
          </div>
        </div>

        {loading ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
             {[...Array(3)].map((_, i) => (
               <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />
             ))}
           </div>
        ) : paginatedList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 15, marginBottom: 16 }}>Belum ada laporan DO yang sesuai filter.</p>
            {filterSpbe === 'Semua' && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>Buat DO Pertama</button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paginatedList.map((laporan) => {
                const totalItems = laporan.items?.length || 0
              const totalDo = laporan.items?.reduce((acc, curr) => acc + curr.jumlah_do, 0) || 0
              return (
                <div key={laporan.id} className="dashboard-list-item hover-card" style={{ flexWrap: 'wrap', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 250px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={20} color="#16a34a" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {laporan.spbe}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Total: <strong style={{ color: 'var(--text-primary)' }}>{totalDo} DO</strong> | Dibuat: {new Date(laporan.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="item-actions" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'flex-end', marginTop: 8 }}>
                    <span className="badge badge-gray">{totalItems} Rincian</span>
                    <Link href={`/laporan-do/penebusan`} className="btn btn-ghost btn-icon" title="Lihat Penebusan">
                      <Eye size={16} />
                    </Link>
                    <button className="btn btn-ghost btn-icon" onClick={() => setDeleteModalId(laporan.id)} title="Hapus" style={{ color: '#ef4444' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
                <button 
                  className="btn btn-secondary btn-icon" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Halaman {currentPage} dari {totalPages}
                </div>
                <button 
                  className="btn btn-secondary btn-icon" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => !saving && setShowModal(false)} />
          
          <div className="card animate-scale-in" style={{ position: 'relative', width: '100%', maxWidth: 800, zIndex: 101, padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="#16a34a" /> Buat Input DO Baru
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => !saving && setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, background: 'var(--bg-base)' }}>
              {/* TABS */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button 
                  className={`btn ${spbe === 'SADIKUN' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, background: spbe === 'SADIKUN' ? '#16a34a' : 'transparent' }}
                  onClick={() => setSpbe('SADIKUN')}
                >
                  SPBE SADIKUN
                </button>
                <button 
                  className={`btn ${spbe === 'JAKPRO' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, background: spbe === 'JAKPRO' ? '#16a34a' : 'transparent' }}
                  onClick={() => setSpbe('JAKPRO')}
                >
                  SPBE JAKPRO
                </button>
              </div>

              {/* DYNAMIC FORM */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12 }}>
                {items.map((item, index) => (
                  <div key={item.id} style={{ padding: 16, borderBottom: index < items.length - 1 ? '1px solid var(--border-default)' : 'none', position: 'relative', zIndex: items.length - index }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, alignItems: 'end' }}>
                      
                      <div>
                        <label className="form-label" style={{ fontSize: 12 }}>Tanggal</label>
                        <CustomDatePicker 
                          value={item.tanggal}
                          onChange={val => handleUpdateItem(item.id, 'tanggal', val)}
                          placeholder="Pilih Tanggal"
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: 12 }}>Alokasi (Tabung)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          placeholder="Misal: 560"
                          value={item.alokasi}
                          onChange={e => handleUpdateItem(item.id, 'alokasi', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: 12 }}>Jumlah DO (Otomatis)</label>
                        <div style={{ 
                          height: 42, display: 'flex', alignItems: 'center', padding: '0 16px', 
                          background: 'var(--bg-muted)', borderRadius: 10, fontWeight: 700, color: '#16a34a' 
                        }}>
                          {getJumlahDO(item.alokasi)} DO
                        </div>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: 12 }}>Jenis</label>
                        <CustomSelect 
                          value={item.jenis}
                          onChange={val => handleUpdateItem(item.id, 'jenis', val as string)}
                          options={[
                            { value: 'Normal', label: 'Normal' },
                            { value: 'Fakultatif', label: 'Fakultatif' }
                          ]}
                        />
                      </div>

                    </div>
                    {items.length > 1 && (
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="btn btn-ghost btn-icon" 
                        style={{ position: 'absolute', top: 12, right: 12, color: '#ef4444' }}
                        title="Hapus baris"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleAddItem} style={{ borderRadius: 20 }}>
                  <Plus size={14} /> Tambah Kolom Alokasi Baru
                </button>
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-surface)', borderBottomLeftRadius: 'inherit', borderBottomRightRadius: 'inherit' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : <><Save size={16} /> Simpan Laporan DO</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteModalId}
        title="Hapus Laporan DO?"
        description="Laporan DO ini beserta seluruh rincian alokasinya akan dihapus secara permanen."
        itemName={`ID Laporan: ${deleteModalId?.slice(0, 8)}...`}
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalId(null)}
      />
    </div>
  )
}
