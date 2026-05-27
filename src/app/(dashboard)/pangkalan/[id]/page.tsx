'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPangkalanById, logAktivitas } from '@/lib/db'
import type { Pangkalan } from '@/types'
import { JENIS_FOTO_LABELS } from '@/types'
import {
  ArrowLeft, Edit, MapPin, Phone, User, Building2,
  CheckCircle2, XCircle, AlertTriangle, ExternalLink,
  Calendar, Clock, Camera, Trash2, ToggleLeft, ToggleRight, Loader2,
  ClipboardList, Map, BarChart2, Zap
} from 'lucide-react'
import Link from 'next/link'
import { formatDateTime, formatTimeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import StaticMiniMap from '@/components/maps/StaticMiniMap'

const PhotoUploadDynamic = dynamic(
  () => import('@/components/pangkalan/PhotoUpload').then(m => ({ default: m.PhotoUpload })),
  { ssr: false }
)

export default function DetailPangkalanPage() {
  const { id } = useParams<{ id: string }>()
  const [pangkalan, setPangkalan] = useState<Pangkalan | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchData = async () => {
    try {
      const data = await getPangkalanById(id)
      setPangkalan(data)
    } catch {
      toast.error('Data tidak ditemukan')
      router.push('/pangkalan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleToggleStatus = async () => {
    if (!pangkalan) return
    const newStatus = pangkalan.status === 'aktif' ? 'nonaktif' : 'aktif'
    if (!confirm(`${newStatus === 'nonaktif' ? 'Nonaktifkan' : 'Aktifkan'} pangkalan ini?`)) return

    setToggling(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('pangkalan')
        .update({ status: newStatus, updated_by: user?.id })
        .eq('id', id)

      await logAktivitas({
        aksi: newStatus === 'aktif' ? 'aktifkan' : 'nonaktifkan',
        entitas: 'pangkalan',
        entitas_id: id,
        entitas_nama: pangkalan.nama_pangkalan,
        data_lama: { status: pangkalan.status },
        data_baru: { status: newStatus },
      })

      toast.success(`Pangkalan berhasil di${newStatus === 'aktif' ? 'aktifkan' : 'nonaktifkan'}`)
      fetchData()
    } catch {
      toast.error('Gagal mengubah status')
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    if (!pangkalan) return
    if (!confirm(`Hapus pangkalan "${pangkalan.nama_pangkalan}"? Tindakan ini tidak bisa dibatalkan.`)) return
    if (!confirm('Yakin? Semua data dan foto akan dihapus permanen.')) return

    setDeleting(true)
    try {
      await logAktivitas({
        aksi: 'hapus',
        entitas: 'pangkalan',
        entitas_id: id,
        entitas_nama: pangkalan.nama_pangkalan,
        data_lama: pangkalan,
      })

      // Delete storage files
      if (pangkalan.foto_pangkalan?.length) {
        const paths = pangkalan.foto_pangkalan.map(f => f.storage_path)
        await supabase.storage.from('foto-pangkalan').remove(paths)
      }

      await supabase.from('pangkalan').delete().eq('id', id)

      toast.success('Pangkalan berhasil dihapus')
      router.push('/pangkalan')
    } catch {
      toast.error('Gagal menghapus pangkalan')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 48, borderRadius: 10, marginBottom: 24, width: 200 }} />
        <div className="responsive-map-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
        </div>
      </div>
    )
  }

  if (!pangkalan) return null

  const fotoList = JENIS_FOTO_LABELS
  const fotoArray = Object.keys(fotoList).map(key => {
    const foto = pangkalan.foto_pangkalan?.find(f => f.jenis_foto === key)
    return { key, label: fotoList[key as keyof typeof fotoList], foto }
  })

  const existingPhotos = pangkalan.foto_pangkalan?.map(f => ({
    ...f,
    file_name: f.file_name ?? null,
    file_size: f.file_size ?? null,
    uploaded_by: f.uploaded_by ?? null,
  })) ?? []

  return (
    <div className="stagger-children">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link href="/pangkalan" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Kembali ke Daftar
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title">{pangkalan.nama_pangkalan}</h1>
            <span className={`badge ${pangkalan.status === 'aktif' ? 'badge-green' : 'badge-red'}`}>
              {pangkalan.status === 'aktif' ? '● Aktif' : '● Nonaktif'}
            </span>
            {!pangkalan.foto_lengkap && (
              <span className="badge badge-amber">
                <AlertTriangle size={11} /> Belum Lengkap
              </span>
            )}
          </div>
          <p className="page-subtitle">
            {pangkalan.id_registrasi} • {pangkalan.kecamatan}, {pangkalan.kota}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${pangkalan.status === 'aktif' ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleToggleStatus}
            disabled={toggling}
          >
            {toggling
              ? <Loader2 size={14} className="animate-spin" />
              : pangkalan.status === 'aktif'
              ? <><ToggleRight size={14} /> Nonaktifkan</>
              : <><ToggleLeft size={14} /> Aktifkan</>
            }
          </button>
          <Link href={`/pangkalan/${id}/edit`} className="btn btn-secondary btn-sm">
            <Edit size={14} /> Edit
          </Link>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? <Loader2 size={14} className="animate-spin" />
              : <><Trash2 size={14} /> Hapus</>
            }
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="responsive-map-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info Card */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={16} color="#16a34a" /> Informasi Pangkalan
            </h3>
            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { icon: Building2, label: 'Nama Pangkalan', value: pangkalan.nama_pangkalan },
                { icon: User, label: 'Nama Pemilik', value: pangkalan.nama_pemilik },
                { icon: Building2, label: 'ID Registrasi', value: pangkalan.id_registrasi, mono: true },
                { icon: Phone, label: 'Nomor HP', value: pangkalan.nomor_hp, mono: true },
                { icon: MapPin, label: 'Kecamatan', value: pangkalan.kecamatan },
                { icon: MapPin, label: 'Kelurahan', value: pangkalan.kelurahan },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                    fontFamily: item.mono ? 'monospace' : 'inherit',
                  }}>
                    {item.value || '—'}
                  </div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Alamat Lengkap
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                  {pangkalan.alamat}, {pangkalan.kelurahan}, {pangkalan.kecamatan}, {pangkalan.kota}, {pangkalan.provinsi}
                </div>
              </div>
              {pangkalan.catatan_admin && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Catatan Admin
                  </div>
                  <div style={{
                    fontSize: 13, color: 'var(--text-secondary)',
                    background: 'var(--bg-muted)', padding: '10px 12px',
                    borderRadius: 8, lineHeight: 1.5,
                  }}>
                    {pangkalan.catatan_admin}
                  </div>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div style={{
              display: 'flex', gap: 16, marginTop: 16, paddingTop: 14,
              borderTop: '1px solid var(--border-default)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <Calendar size={12} />
                Didaftarkan: {formatDateTime(pangkalan.created_at)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <Clock size={12} />
                Diperbarui: {formatTimeAgo(pangkalan.updated_at)}
              </div>
            </div>
          </div>

          {/* Photo Documentation */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={16} color="#16a34a" /> Dokumentasi Foto
              </h3>
              <span className={`badge ${pangkalan.foto_lengkap ? 'badge-green' : 'badge-amber'}`}>
                {pangkalan.foto_lengkap
                  ? <><CheckCircle2 size={11} /> Lengkap</>
                  : <><AlertTriangle size={11} /> Belum Lengkap</>
                }
              </span>
            </div>

            <PhotoUploadDynamic
              pangkalanId={id}
              pangkalanNama={pangkalan.nama_pangkalan}
              existingPhotos={existingPhotos}
              onUpdate={fetchData}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mini Map */}
          {pangkalan.latitude && pangkalan.longitude && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} color="#16a34a" /> Lokasi</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                  {pangkalan.latitude.toFixed(5)}, {pangkalan.longitude.toFixed(5)}
                </div>
              </div>
              <StaticMiniMap 
                lat={pangkalan.latitude} 
                lng={pangkalan.longitude} 
                height={200} 
              />
              <div style={{ padding: '12px 16px', background: 'var(--bg-surface)' }}>
                <a
                  href={`https://maps.google.com/?q=${pangkalan.latitude},${pangkalan.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <ExternalLink size={13} /> Buka di Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Status card */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 size={16} color="#16a34a" /> Status Pangkalan
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Operasional</span>
                <span className={`badge ${pangkalan.status === 'aktif' ? 'badge-green' : 'badge-red'}`}>
                  {pangkalan.status === 'aktif' ? '● Aktif' : '● Nonaktif'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Dokumen</span>
                <span className={`badge ${pangkalan.foto_lengkap ? 'badge-green' : 'badge-amber'}`}>
                  {pangkalan.foto_lengkap ? 'Lengkap' : 'Belum Lengkap'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Koordinat</span>
                <span className={`badge ${pangkalan.latitude ? 'badge-green' : 'badge-red'}`}>
                  {pangkalan.latitude ? 'Ada' : 'Belum Ada'}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                Kelengkapan foto: {pangkalan.foto_pangkalan?.length || 0}/5
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((pangkalan.foto_pangkalan?.length || 0) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="#16a34a" /> Aksi Cepat
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                href={`/pangkalan/${id}/edit`}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', fontSize: 13 }}
              >
                <Edit size={14} /> Edit Data Pangkalan
              </Link>
              {pangkalan.latitude && pangkalan.longitude && (
                <a
                  href={`https://maps.google.com/dir/?api=1&destination=${pangkalan.latitude},${pangkalan.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', fontSize: 13 }}
                >
                  <MapPin size={14} /> Rute ke Sini
                </a>
              )}
              <button
                className={`btn ${pangkalan.status === 'aktif' ? 'btn-secondary' : 'btn-primary'}`}
                style={{ justifyContent: 'flex-start', fontSize: 13 }}
                onClick={handleToggleStatus}
                disabled={toggling}
              >
                {pangkalan.status === 'aktif'
                  ? <><ToggleRight size={14} /> Nonaktifkan</>
                  : <><ToggleLeft size={14} /> Aktifkan</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
