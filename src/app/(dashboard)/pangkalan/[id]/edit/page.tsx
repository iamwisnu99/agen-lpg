'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPangkalanById, logAktivitas } from '@/lib/db'
import type { Pangkalan, PangkalanFormData } from '@/types'
import { LocationPicker } from '@/components/maps/LocationPicker'
import { ArrowLeft, Save, Loader2, ClipboardList, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const LocationPickerDynamic = dynamic(
  () => import('@/components/maps/LocationPicker').then(m => ({ default: m.LocationPicker })),
  { ssr: false }
)

export default function EditPangkalanPage() {
  const { id } = useParams<{ id: string }>()
  const [pangkalan, setPangkalan] = useState<Pangkalan | null>(null)
  const [form, setForm] = useState<PangkalanFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PangkalanFormData, string>>>({})
  const [kecamatanList, setKecamatanList] = useState<string[]>([])
  const [kelurahanList, setKelurahanList] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPangkalanById(id)
        setPangkalan(data)
        setForm({
          nama_pangkalan: data.nama_pangkalan,
          nama_pemilik: data.nama_pemilik,
          id_registrasi: data.id_registrasi,
          nomor_hp: data.nomor_hp,
          alamat: data.alamat,
          kecamatan: data.kecamatan,
          kelurahan: data.kelurahan,
          kota: data.kota,
          provinsi: data.provinsi,
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          link_maps: data.link_maps || '',
          status: data.status,
          catatan_admin: data.catatan_admin || '',
        })
      } catch {
        toast.error('Data tidak ditemukan')
        router.push('/pangkalan')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    const fetchKecamatan = async () => {
      const { data } = await supabase.from('wilayah').select('kecamatan').order('kecamatan')
      if (data) setKecamatanList([...new Set(data.map(w => w.kecamatan))])
    }
    fetchKecamatan()
  }, [])

  useEffect(() => {
    if (!form?.kecamatan) { setKelurahanList([]); return }
    const fetchKelurahan = async () => {
      const { data } = await supabase.from('wilayah').select('kelurahan').eq('kecamatan', form.kecamatan).order('kelurahan')
      if (data) setKelurahanList(data.map(w => w.kelurahan))
    }
    fetchKelurahan()
  }, [form?.kecamatan])

  const update = (field: keyof PangkalanFormData, value: string) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev)
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    if (!form) return false
    const e: Partial<Record<keyof PangkalanFormData, string>> = {}
    if (!form.nama_pangkalan.trim()) e.nama_pangkalan = 'Wajib diisi'
    if (!form.nama_pemilik.trim()) e.nama_pemilik = 'Wajib diisi'
    if (!form.nomor_hp.trim()) e.nomor_hp = 'Wajib diisi'
    if (!form.alamat.trim()) e.alamat = 'Wajib diisi'
    if (!form.kecamatan) e.kecamatan = 'Pilih kecamatan'
    if (!form.kelurahan) e.kelurahan = 'Pilih kelurahan'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!form || !pangkalan) return
    if (!validate()) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const updateData = {
        nama_pangkalan: form.nama_pangkalan,
        nama_pemilik: form.nama_pemilik,
        nomor_hp: form.nomor_hp,
        alamat: form.alamat,
        kecamatan: form.kecamatan,
        kelurahan: form.kelurahan,
        kota: form.kota,
        provinsi: form.provinsi,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        link_maps: form.link_maps || null,
        status: form.status,
        catatan_admin: form.catatan_admin || null,
        updated_by: user?.id,
      }

      const { error } = await supabase.from('pangkalan').update(updateData).eq('id', id)
      if (error) throw error

      await logAktivitas({
        aksi: 'edit',
        entitas: 'pangkalan',
        entitas_id: id,
        entitas_nama: form.nama_pangkalan,
        data_lama: pangkalan,
        data_baru: updateData,
      })

      toast.success('Data pangkalan berhasil diperbarui')
      router.push(`/pangkalan/${id}`)
    } catch (err) {
      toast.error('Gagal menyimpan perubahan')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 48, borderRadius: 10, marginBottom: 24, width: 200 }} />
        <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Link href={`/pangkalan/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Kembali
          </Link>
          <h1 className="page-title">Edit Pangkalan</h1>
          <p className="page-subtitle">{pangkalan?.nama_pangkalan}</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={18} color="#16a34a" /> Data Identitas
        </h2>
        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Nama Pangkalan <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" className="form-input" value={form.nama_pangkalan} onChange={e => update('nama_pangkalan', e.target.value)} />
            {errors.nama_pangkalan && <p className="form-error">{errors.nama_pangkalan}</p>}
          </div>
          <div>
            <label className="form-label">Nama Pemilik <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" className="form-input" value={form.nama_pemilik} onChange={e => update('nama_pemilik', e.target.value)} />
            {errors.nama_pemilik && <p className="form-error">{errors.nama_pemilik}</p>}
          </div>
          <div>
            <label className="form-label">ID Registrasi</label>
            <input type="text" className="form-input" value={form.id_registrasi} disabled style={{ opacity: 0.6 }} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>ID Registrasi tidak dapat diubah</p>
          </div>
          <div>
            <label className="form-label">Nomor HP <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="tel" className="form-input" value={form.nomor_hp} onChange={e => update('nomor_hp', e.target.value)} />
            {errors.nomor_hp && <p className="form-error">{errors.nomor_hp}</p>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Alamat Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="form-input form-textarea" rows={2} value={form.alamat} onChange={e => update('alamat', e.target.value)} />
            {errors.alamat && <p className="form-error">{errors.alamat}</p>}
          </div>
          <div>
            <label className="form-label">Kecamatan <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="form-input form-select" value={form.kecamatan} onChange={e => { update('kecamatan', e.target.value); update('kelurahan', '') }}>
              <option value="">-- Pilih Kecamatan --</option>
              {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            {errors.kecamatan && <p className="form-error">{errors.kecamatan}</p>}
          </div>
          <div>
            <label className="form-label">Kelurahan <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="form-input form-select" value={form.kelurahan} onChange={e => update('kelurahan', e.target.value)} disabled={!form.kecamatan}>
              <option value="">-- Pilih Kelurahan --</option>
              {kelurahanList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            {errors.kelurahan && <p className="form-error">{errors.kelurahan}</p>}
          </div>
          <div>
            <label className="form-label">Kota / Kabupaten</label>
            <input type="text" className="form-input" value={form.kota} onChange={e => update('kota', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input form-select" value={form.status} onChange={e => update('status', e.target.value)}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Catatan Admin</label>
            <textarea className="form-input form-textarea" rows={2} value={form.catatan_admin} onChange={e => update('catatan_admin', e.target.value)} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="#16a34a" /> Lokasi Pangkalan
          </h2>
          <LocationPickerDynamic
            lat={form.latitude}
            lng={form.longitude}
            linkMaps={form.link_maps}
            onChange={(lat, lng, link) => { update('latitude', lat); update('longitude', lng); update('link_maps', link) }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Link href={`/pangkalan/${id}`} className="btn btn-secondary">
            Batal
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Perubahan</>}
          </button>
        </div>
      </div>
    </div>
  )
}
