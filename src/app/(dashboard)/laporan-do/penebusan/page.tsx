'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { FileText, Eye, CheckSquare, Download, Trash2, X, Save, ChevronLeft, ChevronRight, FileSpreadsheet, Calendar, AlertCircle, CheckCircle2, Package, TrendingUp, Edit3 } from 'lucide-react'
import { getLaporanDOList, processPenebusan, deleteLaporanDO } from '@/lib/db'
import Link from 'next/link'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { CustomMonthPicker } from '@/components/CustomMonthPicker'
import { CustomSelect } from '@/components/CustomSelect'
import type { LaporanDO, LaporanDOItem } from '@/types'
import toast from 'react-hot-toast'
import { exportLaporanDOExcel, exportLaporanDOPDF } from './exportUtils'

export default function PenebusanPage() {
  const { data: laporanList = [], mutate: fetchData, isLoading: loading } = useSWR<LaporanDO[]>('laporanDOList', () => getLaporanDOList(), {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Modals
  const [viewModalData, setViewModalData] = useState<LaporanDO | null>(null)
  const [tebusModalData, setTebusModalData] = useState<LaporanDO | null>(null)
  
  // Checkbox State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [tebusInputs, setTebusInputs] = useState<Record<string, number>>({})
  const [savingTebus, setSavingTebus] = useState(false)

  // Export State
  const [showExportModal, setShowExportModal] = useState(false)
  const [closingModal, setClosingModal] = useState<'view' | 'tebus' | 'export' | null>(null)
  const [exportSpbe, setExportSpbe] = useState<'Semua' | 'SADIKUN' | 'JAKPRO'>('Semua')
  const [exportPeriode, setExportPeriode] = useState<string>('Bulanan')

  // Filter & Pagination State
  const [filterSpbe, setFilterSpbe] = useState('Semua')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  
  // Fetching handled by useSWR

  // Lock body scroll when modal is open
  useEffect(() => {
    if (viewModalData || tebusModalData || deleteModalId || showExportModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [viewModalData, tebusModalData, deleteModalId, showExportModal])

  const openTebusModal = (laporan: LaporanDO) => {
    const initialChecks: Record<string, boolean> = {}
    const initialInputs: Record<string, number> = {}
    laporan.items?.forEach(item => {
      initialChecks[item.id] = item.status_tebus
      initialInputs[item.id] = item.jumlah_do
    })
    setCheckedItems(initialChecks)
    setTebusInputs(initialInputs)
    setTebusModalData(laporan)
  }

  const handleCloseView = () => {
    setClosingModal('view')
    setTimeout(() => {
      setViewModalData(null)
      setClosingModal(null)
    }, 200)
  }

  const handleCloseTebus = () => {
    setClosingModal('tebus')
    setTimeout(() => {
      setTebusModalData(null)
      setClosingModal(null)
    }, 200)
  }

  const handleCloseExport = () => {
    setClosingModal('export')
    setTimeout(() => {
      setShowExportModal(false)
      setClosingModal(null)
    }, 200)
  }

  const handleSaveTebus = async () => {
    if (!tebusModalData) return
    setSavingTebus(true)
    try {
      const itemsToUpdate = tebusModalData.items?.map(item => {
        const isChecked = checkedItems[item.id]
        const inputAmount = tebusInputs[item.id] || 0
        const tebusDO = isChecked ? inputAmount : 0
        const sisaDO = isChecked ? item.jumlah_do - inputAmount : item.jumlah_do

        return {
          id: item.id,
          originalItem: item,
          tebusDO,
          sisaDO
        }
      }) || []

      await processPenebusan(itemsToUpdate)

      toast.success('Status penebusan berhasil diperbarui')
      handleCloseTebus()
      fetchData()
    } catch (err) {
      toast.error('Gagal memperbarui status penebusan')
    } finally {
      setSavingTebus(false)
    }
  }

  const handleExportExcel = () => {
    exportLaporanDOExcel(laporanList, exportSpbe, exportPeriode)
    handleCloseExport()
  }

  const handleExportPDF = () => {
    exportLaporanDOPDF(laporanList, exportSpbe, exportPeriode)
    handleCloseExport()
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

  // Metrik Bulanan Penebusan
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  let totalDoBulanIni = 0
  let totalDoDitebus = 0
  let totalTabungDitebus = 0

  laporanList.forEach(l => {
    const d = new Date(l.created_at)
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      l.items?.forEach(i => {
        totalDoBulanIni += i.jumlah_do
        if (i.status_tebus) {
          totalDoDitebus += i.jumlah_do
          totalTabungDitebus += i.alokasi
        }
      })
    }
  })

  const pendingDo = totalDoBulanIni - totalDoDitebus
  const progressPercent = totalDoBulanIni > 0 ? Math.round((totalDoDitebus / totalDoBulanIni) * 100) : 0

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Penebusan DO</h1>
          <p className="page-subtitle">Tandai DO yang sudah ditebus & Export Laporan</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>
          <Download size={16} /> CETAK
        </button>
      </div>

      {/* DASHBOARD WIDGETS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }} className="animate-fade-in">
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>DO DITEBUS</div>
            <div style={{ padding: 8, background: 'rgba(22, 163, 74, 0.1)', borderRadius: 8, color: '#16a34a' }}>
              <CheckSquare size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{totalDoDitebus} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>DO</span></div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: pendingDo > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>BELUM/TIDAK DITEBUS</div>
            <div style={{ padding: 8, background: pendingDo > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: 8, color: pendingDo > 0 ? '#ef4444' : '#10b981' }}>
              {pendingDo > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: pendingDo > 0 ? '#ef4444' : 'var(--text-primary)' }}>{pendingDo} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>DO</span></div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>TABUNG DITEBUS (BULAN INI)</div>
            <div style={{ padding: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, color: '#3b82f6' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{totalTabungDitebus.toLocaleString('id-ID')} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Pcs ({totalDoDitebus} DO)</span></div>
        </div>
      </div>

      <div className="card animate-fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckSquare size={18} color="#16a34a" /> Daftar Penebusan DO
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
            <p style={{ fontSize: 15 }}>Belum ada laporan DO yang sesuai filter.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paginatedList.map((laporan) => {
                const totalItems = laporan.items?.length || 0
              const itemsTebus = laporan.items?.filter(i => i.status_tebus).length || 0
              const totalDo = laporan.items?.reduce((acc, curr) => acc + curr.jumlah_do, 0) || 0
              const isFullTebus = totalItems > 0 && itemsTebus === totalItems

              return (
                <div key={laporan.id} className="dashboard-list-item hover-card" style={{ flexWrap: 'wrap', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 250px' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: isFullTebus ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckSquare size={20} color={isFullTebus ? "#16a34a" : "#f59e0b"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {laporan.spbe}
                        {isFullTebus ? (
                          <span className="badge badge-green">Semua Ditebus</span>
                        ) : (
                          <span className="badge badge-amber">{itemsTebus}/{totalItems} Ditebus</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        Total: <strong style={{ color: 'var(--text-primary)' }}>{totalDo} DO</strong> | Dibuat: {new Date(laporan.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <div className="item-actions" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => setViewModalData(laporan)} title="Lihat Detail">
                      <Eye size={16} />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => openTebusModal(laporan)} title="Proses Penebusan">
                      <CheckSquare size={16} color="#16a34a" />
                    </button>
                    <Link href={`/laporan-do/input?edit=${laporan.id}`} className="btn btn-ghost btn-icon" title="Edit DO" style={{ color: '#3b82f6' }}>
                      <Edit3 size={16} />
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

      {viewModalData && (
        <div className={`content-modal-overlay ${closingModal === 'view' ? 'modal-overlay-exit' : 'modal-overlay-enter'}`}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={handleCloseView} />
          
          <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', zIndex: 101, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={20} color="#16a34a" /> Detail DO - SPBE {viewModalData.spbe}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={handleCloseView}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, background: 'var(--bg-base)', overflowY: 'auto', flex: 1 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 500 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-muted)', borderBottom: '2px solid var(--border-default)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tanggal</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Alokasi</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Jumlah DO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Jenis</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {viewModalData.items?.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                      <td style={{ padding: '12px 16px' }}>{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: '12px 16px' }}>{item.alokasi}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{item.jumlah_do}</td>
                      <td style={{ padding: '12px 16px' }}>{item.jenis}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {item.status_tebus ? <span className="badge badge-green">Ditebus</span> : <span className="badge badge-amber">Belum</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tebusModalData && (
        <div className={`content-modal-overlay ${closingModal === 'tebus' ? 'modal-overlay-exit' : 'modal-overlay-enter'}`}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => !savingTebus && handleCloseTebus()} />
          
          <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', zIndex: 101, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={20} color="#16a34a" /> Proses Penebusan DO
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => !savingTebus && handleCloseTebus()}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 24, background: 'var(--bg-base)', overflowY: 'auto', flex: 1 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                Centang kotak di sebelah kanan untuk menandai DO yang sudah ditebus.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tebusModalData.items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.jumlah_do} DO ({item.alokasi} Tabung) - {item.jenis}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Tanggal: {new Date(item.tanggal).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    {item.status_tebus ? (
                      <span className="badge badge-green" style={{ padding: '6px 12px' }}>Sudah Ditebus</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {checkedItems[item.id] && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Jumlah DO:</label>
                            <input 
                              type="number"
                              className="form-input"
                              style={{ width: 60, padding: '4px 8px', height: 32 }}
                              min={1}
                              max={item.jumlah_do}
                              value={tebusInputs[item.id] || ''}
                              onChange={e => {
                                let val = parseInt(e.target.value)
                                if (isNaN(val)) val = 1
                                if (val > item.jumlah_do) val = item.jumlah_do
                                if (val < 1) val = 1
                                setTebusInputs({ ...tebusInputs, [item.id]: val })
                              }}
                            />
                          </div>
                        )}
                        <input 
                          type="checkbox" 
                          style={{ width: 20, height: 20, accentColor: '#16a34a', cursor: 'pointer' }}
                          checked={checkedItems[item.id] || false}
                          onChange={(e) => setCheckedItems({ ...checkedItems, [item.id]: e.target.checked })}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-surface)' }}>
              <button className="btn btn-secondary" onClick={() => handleCloseTebus()} disabled={savingTebus}>Batal</button>
              <button className="btn btn-primary" onClick={handleSaveTebus} disabled={savingTebus}>
                {savingTebus ? 'Menyimpan...' : <><Save size={16} /> Simpan Status</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className={`content-modal-overlay ${closingModal === 'export' ? 'modal-overlay-exit' : 'modal-overlay-enter'}`}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={handleCloseExport} />
          
          <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 400, zIndex: 101, padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileSpreadsheet size={20} color="#16a34a" /> Export Laporan DO
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={handleCloseExport}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, background: 'var(--bg-base)' }}>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Pilih SPBE</label>
                <CustomSelect 
                  value={exportSpbe} 
                  onChange={val => setExportSpbe(val as any)}
                  options={[
                    { value: 'Semua', label: 'Semua SPBE' },
                    { value: 'SADIKUN', label: 'SADIKUN' },
                    { value: 'JAKPRO', label: 'JAKPRO' }
                  ]}
                />
              </div>
              <div>
                <label className="form-label">Periode</label>
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                  <CustomSelect 
                    value={exportPeriode === 'Mingguan' || exportPeriode === 'Bulanan' ? exportPeriode : 'Custom'} 
                    onChange={val => {
                      if (val === 'Custom') setExportPeriode(new Date().toISOString().slice(0, 7))
                      else setExportPeriode(val as string)
                    }}
                    options={[
                      { value: 'Mingguan', label: 'Mingguan (1 Minggu Terakhir)' },
                      { value: 'Bulanan', label: 'Bulanan (Bulan Ini)' },
                      { value: 'Custom', label: 'Pilih Bulan...' }
                    ]}
                  />
                  {exportPeriode !== 'Mingguan' && exportPeriode !== 'Bulanan' && (
                    <CustomMonthPicker 
                      value={exportPeriode} 
                      onChange={setExportPeriode}
                    />
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-surface)', borderBottomLeftRadius: 'inherit', borderBottomRightRadius: 'inherit' }}>
              <button className="btn btn-primary" onClick={handleExportExcel} style={{ width: '100%', background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}>
                <FileSpreadsheet size={16} /> Download Excel
              </button>
              <button className="btn btn-primary" onClick={handleExportPDF} style={{ width: '100%', background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}>
                <FileText size={16} /> Download PDF
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
