'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getArmadaById, logAktivitas, deleteArmada } from '@/lib/db'
import type { Armada } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Edit, Trash2, Truck, AlertCircle, Calendar, User, FileText, CheckCircle2, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatDate, getDaysRemaining } from '@/lib/utils'
import { format, addYears } from 'date-fns'

export default function DetailArmadaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [armada, setArmada] = useState<Armada | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [updatingTax, setUpdatingTax] = useState(false)
  const [dismissedTax1, setDismissedTax1] = useState(false)
  const [dismissedTax5, setDismissedTax5] = useState(false)

  const loadData = async () => {
    try {
      const data = await getArmadaById(id)
      if (!data) throw new Error('Not found')
      setArmada(data)
      
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      if (localStorage.getItem(`tax1_dismissed_${data.id}_${todayStr}`)) setDismissedTax1(true)
      if (localStorage.getItem(`tax5_dismissed_${data.id}_${todayStr}`)) setDismissedTax5(true)
    } catch (err) {
      toast.error('Gagal memuat data armada')
      router.push('/armada')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, router])

  const handleDelete = async () => {
    if (!armada) return
    if (!window.confirm(`Yakin ingin menghapus armada ${armada.no_plat}?`)) return
    
    setDeleting(true)
    try {
      await logAktivitas({
        aksi: 'hapus',
        entitas: 'armada',
        entitas_id: armada.id,
        entitas_nama: armada.no_plat,
        data_lama: armada,
      })
      await deleteArmada(armada.id)
      toast.success('Data armada berhasil dihapus')
      router.push('/armada')
    } catch (err) {
      toast.error('Gagal menghapus data')
      setDeleting(false)
    }
  }

  const handlePayTax = async (type: '1_tahun' | '5_tahun') => {
    if (!armada) return
    setUpdatingTax(true)
    try {
      const currentVal = type === '1_tahun' ? armada.jatuh_tempo_pajak_1_tahun : armada.jatuh_tempo_plat_5_tahun
      if (!currentVal) return

      const newDate = addYears(new Date(currentVal), type === '1_tahun' ? 1 : 5)
      const formattedDate = format(newDate, 'yyyy-MM-dd')

      const updates = type === '1_tahun' 
        ? { jatuh_tempo_pajak_1_tahun: formattedDate }
        : { jatuh_tempo_plat_5_tahun: formattedDate }

      const { error } = await supabase.from('armada').update(updates).eq('id', armada.id)
      if (error) throw error

      toast.success(`Pajak ${type === '1_tahun' ? '1 Tahunan' : '5 Tahunan'} berhasil diperpanjang ke ${formatDate(formattedDate)}`)
      await loadData()
    } catch (err) {
      toast.error('Gagal memperbarui data pajak')
    } finally {
      setUpdatingTax(false)
    }
  }

  const handleDismissTax = (type: '1_tahun' | '5_tahun') => {
    if (!armada) return
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    localStorage.setItem(`tax${type === '1_tahun' ? '1' : '5'}_dismissed_${armada.id}_${todayStr}`, 'true')
    if (type === '1_tahun') setDismissedTax1(true)
    if (type === '5_tahun') setDismissedTax5(true)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 0' }}>
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    )
  }

  if (!armada) return null

  // Warnings
  let pajak1TahunWarning = false
  let daysPajak1Tahun = -1
  if (armada.jatuh_tempo_pajak_1_tahun) {
    daysPajak1Tahun = getDaysRemaining(armada.jatuh_tempo_pajak_1_tahun)
    if (daysPajak1Tahun >= 0 && daysPajak1Tahun <= 30) pajak1TahunWarning = true
  }

  let pajak5TahunWarning = false
  let daysPajak5Tahun = -1
  if (armada.jatuh_tempo_plat_5_tahun) {
    daysPajak5Tahun = getDaysRemaining(armada.jatuh_tempo_plat_5_tahun)
    if (daysPajak5Tahun >= 0 && daysPajak5Tahun <= 30) pajak5TahunWarning = true
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <Link href="/armada" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Kembali
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">{armada.no_plat}</h1>
            <span className={`badge badge-${armada.status === 'aktif' ? 'green' : armada.status === 'perbaikan' ? 'amber' : 'red'}`} style={{ padding: '6px 12px', fontSize: 13 }}>
              {armada.status === 'aktif' ? 'Aktif' : armada.status === 'perbaikan' ? 'Perbaikan' : 'Nonaktif'}
            </span>
          </div>
          <p className="page-subtitle">Sopir: {armada.nama_sopir}</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }} onClick={handleDelete} disabled={deleting}>
            <Trash2 size={16} /> <span className="mobile-hidden">Hapus</span>
          </button>
          <Link href={`/armada/${armada.id}/edit`} className="btn btn-primary">
            <Edit size={16} /> <span className="mobile-hidden">Edit</span>
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, overflow: 'hidden', padding: 0 }}>
        <div style={{ background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: '16/9', position: 'relative' }}>
          {armada.foto_kendaraan ? (
            <img src={armada.foto_kendaraan} alt={armada.no_plat} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Truck size={64} style={{ margin: '0 auto', marginBottom: 12, opacity: 0.5 }} />
              <p>Belum ada foto kendaraan</p>
            </div>
          )}
        </div>
        
        <div style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#16a34a" /> Detail Informasi
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} /> Nama Sopir
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{armada.nama_sopir}</p>
            </div>
            
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} /> Jatuh Tempo Pajak 1 Thn
              </p>
              {armada.jatuh_tempo_pajak_1_tahun ? (
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: pajak1TahunWarning ? '#ef4444' : 'var(--text-primary)' }}>
                    {formatDate(armada.jatuh_tempo_pajak_1_tahun)}
                  </p>
                  {pajak1TahunWarning && (
                    <div style={{ alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12, marginTop: 4, background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: 4, display: 'inline-flex' }}>
                      <AlertCircle size={12} /> {daysPajak1Tahun === 0 ? 'Hari ini!' : `Sisa ${daysPajak1Tahun} hari`}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Belum diatur</p>
              )}
            </div>

            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} /> Jatuh Tempo Plat 5 Thn
              </p>
              {armada.jatuh_tempo_plat_5_tahun ? (
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: pajak5TahunWarning ? '#ef4444' : 'var(--text-primary)' }}>
                    {formatDate(armada.jatuh_tempo_plat_5_tahun)}
                  </p>
                  {pajak5TahunWarning && (
                    <div style={{ alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12, marginTop: 4, background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: 4, display: 'inline-flex' }}>
                      <AlertCircle size={12} /> {daysPajak5Tahun === 0 ? 'Hari ini!' : `Sisa ${daysPajak5Tahun} hari`}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Belum diatur</p>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Tax Prompts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {pajak1TahunWarning && !dismissedTax1 && (
          <div className="card animate-in slide-in-from-bottom-4" style={{ borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Apakah kendaraan sudah membayar pajak 1 tahunan?</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pajak akan segera habis atau sudah lewat.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDismissTax('1_tahun')}>
                Belum
              </button>
              <button className="btn btn-primary btn-sm" style={{ background: '#16a34a', border: 'none' }} onClick={() => handlePayTax('1_tahun')} disabled={updatingTax}>
                {updatingTax ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Ya, Sudah
              </button>
            </div>
          </div>
        )}

        {pajak5TahunWarning && !dismissedTax5 && (
          <div className="card animate-in slide-in-from-bottom-4" style={{ borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Apakah kendaraan sudah ganti plat / pajak 5 tahunan?</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Masa berlaku plat nomor akan segera habis.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDismissTax('5_tahun')}>
                Belum
              </button>
              <button className="btn btn-primary btn-sm" style={{ background: '#16a34a', border: 'none' }} onClick={() => handlePayTax('5_tahun')} disabled={updatingTax}>
                {updatingTax ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Ya, Sudah
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
