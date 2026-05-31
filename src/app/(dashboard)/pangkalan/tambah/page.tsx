'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateRegistrationId } from '@/lib/utils'
import { logAktivitas } from '@/lib/db'
import type { PangkalanFormData } from '@/types'
import {
  ChevronRight, ChevronLeft, CheckCircle2,
  Building2, MapPin, Save, Loader2, ArrowLeft, ClipboardList, Camera,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { CustomSelect } from '@/components/CustomSelect'

const LocationPickerDynamic = dynamic(
  () => import('@/components/maps/LocationPicker').then(m => ({ default: m.LocationPicker })),
  { ssr: false }
)

const PhotoUploadDynamic = dynamic(
  () => import('@/components/pangkalan/PhotoUpload').then(m => ({ default: m.PhotoUpload })),
  { ssr: false }
)

const STEPS = [
  { label: 'Lokasi', icon: MapPin },
  { label: 'Identitas', icon: Building2 },
  { label: 'Foto', icon: CheckCircle2 },
]

const initialForm: PangkalanFormData = {
  nama_pangkalan: '',
  nama_pemilik: '',
  id_registrasi: generateRegistrationId(),
  nomor_hp: '',
  alamat: '',
  kecamatan: '',
  kelurahan: '',
  kota: 'Jakarta Barat',
  provinsi: 'DKI Jakarta',
  latitude: '',
  longitude: '',
  link_maps: '',
  status: 'aktif',
  catatan_admin: '',
}

export default function TambahPangkalanPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<PangkalanFormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof PangkalanFormData, string>>>({})
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [kecamatanList, setKecamatanList] = useState<string[]>([])
  const [kelurahanList, setKelurahanList] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

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

  useEffect(() => {
    if (!form.kecamatan) { setKelurahanList([]); return }
    const fetchKelurahan = async () => {
      const { data } = await supabase
        .from('wilayah')
        .select('kelurahan')
        .eq('kecamatan', form.kecamatan)
        .order('kelurahan')
      if (data) {
        const unique = [...new Set(data.map(w => w.kelurahan))]
        setKelurahanList(unique)
      }
    }
    fetchKelurahan()
  }, [form.kecamatan])

  const update = (field: keyof PangkalanFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleAddressFound = (data: any) => {
    const kelurahan = data.village || data.suburb || data.neighbourhood || ''
    const kecamatan = data.county || data.city_district || data.town || data.municipality || ''
    const kota = data.city || data.region || data.state_district || ''
    const provinsi = data.state || ''
    const alamat = data.full || ''

    setForm(prev => ({
      ...prev,
      kelurahan: kelurahan || prev.kelurahan,
      kecamatan: kecamatan || prev.kecamatan,
      kota: kota || prev.kota,
      provinsi: provinsi || prev.provinsi,
      alamat: alamat || prev.alamat,
    }))
  }

  const validateStep0 = () => {
    const e: Partial<Record<keyof PangkalanFormData, string>> = {}
    if (!form.latitude || !form.longitude) e.latitude = 'Lokasi wajib dipilih dari peta'
    setErrors(e)
    if (Object.keys(e).length > 0) toast.error('Pilih lokasi di peta terlebih dahulu')
    return Object.keys(e).length === 0
  }

  const validateStep1 = () => {
    const e: Partial<Record<keyof PangkalanFormData, string>> = {}
    if (!form.nama_pangkalan.trim()) e.nama_pangkalan = 'Wajib diisi'
    if (!form.nama_pemilik.trim()) e.nama_pemilik = 'Wajib diisi'
    if (!form.id_registrasi.trim()) e.id_registrasi = 'Wajib diisi'
    if (!form.nomor_hp.trim()) e.nomor_hp = 'Wajib diisi'
    if (!form.alamat.trim()) e.alamat = 'Wajib diisi'
    if (!form.kecamatan) e.kecamatan = 'Pilih kecamatan'
    if (!form.kelurahan) e.kelurahan = 'Pilih kelurahan'
    setErrors(e)
    if (Object.keys(e).length > 0) toast.error('Mohon lengkapi semua kolom yang wajib diisi')
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return
    setStep(s => s + 1)
  }

  const handleSave = async () => {
    if (!validateStep1()) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('pangkalan')
        .insert({
          nama_pangkalan: form.nama_pangkalan,
          nama_pemilik: form.nama_pemilik,
          id_registrasi: form.id_registrasi,
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
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      await logAktivitas({
        aksi: 'tambah',
        entitas: 'pangkalan',
        entitas_id: data.id,
        entitas_nama: form.nama_pangkalan,
        data_baru: data,
      })

      toast.success('Pangkalan berhasil ditambahkan!')
      setSavedId(data.id)
      setStep(2)
    } catch (err: unknown) {
      const error = err as { message?: string }
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('ID Registrasi sudah digunakan. Ubah ID registrasi.')
        setStep(0)
        setErrors({ id_registrasi: 'ID ini sudah digunakan' })
      } else {
        toast.error('Gagal menyimpan data. Coba lagi.')
        console.error(err)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleFinish = () => {
    if (savedId) {
      router.push(`/pangkalan/${savedId}`)
    } else {
      router.push('/pangkalan')
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <Link href="/pangkalan" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Kembali
          </Link>
          <h1 className="page-title">Tambah Pangkalan</h1>
          <p className="page-subtitle">Isi data pangkalan LPG baru</p>
        </div>
      </div>

      {/* Steps */}
      <div className="steps" style={{ marginBottom: 28 }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`step-item ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''}`}>
              <div className="step-number">
                {i < step ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <div className="step-label">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Card */}
      <div className="card">

        {/* ── Step 0: Lokasi ── */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="#16a34a" /> Lokasi Pangkalan
            </h2>
            <LocationPickerDynamic
              lat={form.latitude}
              lng={form.longitude}
              linkMaps={form.link_maps}
              onChange={(lat, lng, link) => {
                update('latitude', lat)
                update('longitude', lng)
                update('link_maps', link)
              }}
              onAddressFound={handleAddressFound}
            />
          </div>
        )}

        {/* ── Step 1: Identitas ── */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={18} color="#16a34a" /> Data Identitas Pangkalan
            </h2>
            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Nama Pangkalan */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Nama Pangkalan <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Pangkalan Barokah"
                  value={form.nama_pangkalan}
                  onChange={e => update('nama_pangkalan', e.target.value.toUpperCase())}
                />
                {errors.nama_pangkalan && <p className="form-error">{errors.nama_pangkalan}</p>}
              </div>

              {/* Nama Pemilik */}
              <div>
                <label className="form-label">
                  Nama Pemilik <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama lengkap pemilik"
                  value={form.nama_pemilik}
                  onChange={e => update('nama_pemilik', e.target.value.toUpperCase())}
                />
                {errors.nama_pemilik && <p className="form-error">{errors.nama_pemilik}</p>}
              </div>

              {/* ID Registrasi */}
              <div>
                <label className="form-label">
                  ID Registrasi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={form.id_registrasi}
                    onChange={e => update('id_registrasi', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => update('id_registrasi', generateRegistrationId())}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Generate
                  </button>
                </div>
                {errors.id_registrasi && <p className="form-error">{errors.id_registrasi}</p>}
              </div>

              {/* Nomor HP */}
              <div>
                <label className="form-label">
                  Nomor HP <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="08xxxxxxxxxx"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.nomor_hp}
                  onChange={e => update('nomor_hp', e.target.value.replace(/\D/g, ''))}
                />
                {errors.nomor_hp && <p className="form-error">{errors.nomor_hp}</p>}
              </div>

              {/* Alamat */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Alamat Lengkap <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Alamat lengkap pangkalan..."
                  value={form.alamat}
                  onChange={e => update('alamat', e.target.value)}
                  rows={2}
                />
                {errors.alamat && <p className="form-error">{errors.alamat}</p>}
              </div>

              {/* Kecamatan */}
              <div>
                <label className="form-label">
                  Kecamatan <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Kebon Jeruk"
                  value={form.kecamatan}
                  onChange={e => update('kecamatan', e.target.value)}
                />
                {errors.kecamatan && <p className="form-error">{errors.kecamatan}</p>}
              </div>

              {/* Kelurahan */}
              <div>
                <label className="form-label">
                  Kelurahan / Desa <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Kedoya Selatan"
                  value={form.kelurahan}
                  onChange={e => update('kelurahan', e.target.value)}
                />
                {errors.kelurahan && <p className="form-error">{errors.kelurahan}</p>}
              </div>

              {/* Kota */}
              <div>
                <label className="form-label">Kota / Kabupaten</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Jakarta Barat"
                  value={form.kota}
                  onChange={e => update('kota', e.target.value)}
                />
              </div>

              {/* Provinsi */}
              <div>
                <label className="form-label">Provinsi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="DKI Jakarta"
                  value={form.provinsi}
                  onChange={e => update('provinsi', e.target.value)}
                />
              </div>

              {/* Status */}
              <div>
                <label className="form-label">Status Pangkalan</label>
                <CustomSelect
                  value={form.status}
                  onChange={(val) => update('status', val as 'aktif' | 'nonaktif')}
                  options={[
                    { value: 'aktif', label: 'Aktif' },
                    { value: 'nonaktif', label: 'Nonaktif' }
                  ]}
                />
              </div>

              {/* Catatan Admin */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Catatan Admin</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Catatan tambahan (opsional)..."
                  value={form.catatan_admin}
                  onChange={e => update('catatan_admin', e.target.value)}
                  rows={2}
                />
              </div>

            </div>
          </div>
        )}

        {/* ── Step 3: Foto ── */}
        {step === 2 && (
          <div className="animate-fade-in">
            {!savedId ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={32} color="#16a34a" />
                  </div>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Simpan Data Terlebih Dahulu
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Klik tombol &quot;Simpan Data&quot; untuk menyimpan data identitas dan lokasi, lalu upload foto
                </p>
              </div>
            ) : (
              <PhotoUploadDynamic
                pangkalanId={savedId}
                pangkalanNama={form.nama_pangkalan}
              />
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0 || saving}
          >
            <ChevronLeft size={16} /> Sebelumnya
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* Step 0 → 1 */}
            {step === 0 && (
              <button type="button" className="btn btn-primary" onClick={handleNext} disabled={saving}>
                Selanjutnya <ChevronRight size={16} />
              </button>
            )}

            {/* Step 1: Simpan data ke DB */}
            {step === 1 && !savedId && (
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                  : <><Save size={16} /> Simpan Data</>
                }
              </button>
            )}

            {/* Step 1 → 2 setelah tersimpan */}
            {step === 1 && savedId && (
              <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
                Selanjutnya <ChevronRight size={16} />
              </button>
            )}

            {/* Step 2: Selesai */}
            {step === 2 && (
              <button type="button" className="btn btn-primary" onClick={handleFinish}>
                <CheckCircle2 size={16} /> Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
