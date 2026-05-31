'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getArmadaById, logAktivitas } from '@/lib/db'
import type { Armada, ArmadaFormData } from '@/types'
import { ArrowLeft, Save, Loader2, Truck, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CustomSelect } from '@/components/CustomSelect'
import { CustomDatePicker } from '@/components/CustomDatePicker'
import { uploadArmadaFoto } from '@/lib/db'
import imageCompression from 'browser-image-compression'
import { Image as ImageIcon } from 'lucide-react'
import { ImageCropper } from '@/components/ImageCropper'

export default function EditArmadaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  
  const [armada, setArmada] = useState<Armada | null>(null)
  const [form, setForm] = useState<ArmadaFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string>('')
  const [cropperSrc, setCropperSrc] = useState<string>('')
  const [errors, setErrors] = useState<Partial<Record<keyof ArmadaFormData, string>>>({})

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getArmadaById(id)
        if (!data) throw new Error('Not found')
        
        setArmada(data)
        setForm({
          no_plat: data.no_plat,
          nama_sopir: data.nama_sopir,
          jatuh_tempo_pajak_1_tahun: data.jatuh_tempo_pajak_1_tahun || '',
          jatuh_tempo_plat_5_tahun: data.jatuh_tempo_plat_5_tahun || '',
          foto_kendaraan: data.foto_kendaraan || '',
          status: data.status
        })
        if (data.foto_kendaraan) {
          setFotoPreview(data.foto_kendaraan)
        }
      } catch (err) {
        toast.error('Gagal memuat data armada')
        router.push('/armada')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, router])

  const update = (field: keyof ArmadaFormData, value: string) => {
    if (!form) return
    setForm({ ...form, [field]: value })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    if (!form) return false
    const newErrors: typeof errors = {}
    
    if (!form.no_plat.trim()) newErrors.no_plat = 'Nomor plat wajib diisi'
    if (!form.nama_sopir.trim()) newErrors.nama_sopir = 'Nama sopir wajib diisi'
    if (!form.jatuh_tempo_pajak_1_tahun) newErrors.jatuh_tempo_pajak_1_tahun = 'Pajak 1 tahun wajib diisi'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Hanya file gambar yang diperbolehkan')
        return
      }
      setCropperSrc(URL.createObjectURL(file))
      e.target.value = ''
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    setFotoFile(croppedFile)
    setFotoPreview(URL.createObjectURL(croppedFile))
    setCropperSrc('')
  }

  const handleSave = async () => {
    if (!validate() || !form || !armada) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('armada')
        .update({
          no_plat: form.no_plat,
          nama_sopir: form.nama_sopir,
          jatuh_tempo_pajak_1_tahun: form.jatuh_tempo_pajak_1_tahun || null,
          jatuh_tempo_plat_5_tahun: form.jatuh_tempo_plat_5_tahun || null,
          foto_kendaraan: form.foto_kendaraan || null,
          status: form.status,
          updated_by: user?.id
        })
        .eq('id', armada.id)
        .select()
        .single()

      if (error) throw error

      let finalFotoUrl = form.foto_kendaraan
      if (fotoFile) {
        try {
          const compressed = await imageCompression(fotoFile, { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true })
          finalFotoUrl = await uploadArmadaFoto(armada.id, compressed, data.no_plat)
        } catch (uploadErr) {
          console.error(uploadErr)
          toast.error('Gagal mengupload foto baru, namun data armada tersimpan.')
        }
      }

      await logAktivitas({
        aksi: 'edit',
        entitas: 'armada',
        entitas_id: armada.id,
        entitas_nama: form.no_plat,
        data_lama: armada,
        data_baru: { ...data, foto_kendaraan: finalFotoUrl },
      })

      toast.success('Data armada berhasil diperbarui!')
      router.push(`/armada/${id}`)
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        toast.error('Nomor plat ini sudah terdaftar di kendaraan lain.')
        setErrors({ no_plat: 'Nomor plat sudah digunakan' })
      } else {
        toast.error('Gagal menyimpan pembaruan data.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 0' }}>
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Link href={`/armada/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Kembali
          </Link>
          <h1 className="page-title">Edit Armada</h1>
          <p className="page-subtitle">{armada?.no_plat}</p>
        </div>
      </div>

      <div className="card animate-fade-in">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={18} color="#16a34a" /> Data Kendaraan
        </h2>
        
        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {/* No Plat */}
          <div>
            <label className="form-label">Nomor Plat <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: B 1234 CDE" 
              value={form.no_plat} 
              onChange={e => update('no_plat', e.target.value.toUpperCase())} 
            />
            {errors.no_plat && <p className="form-error">{errors.no_plat}</p>}
          </div>

          {/* Nama Sopir */}
          <div>
            <label className="form-label">Nama Sopir <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Nama lengkap sopir" 
              value={form.nama_sopir} 
              onChange={e => update('nama_sopir', e.target.value)} 
            />
            {errors.nama_sopir && <p className="form-error">{errors.nama_sopir}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Pajak 1 Tahun */}
            <div>
              <label className="form-label">Jatuh Tempo Pajak 1 Tahun <span style={{ color: '#ef4444' }}>*</span></label>
              <CustomDatePicker
                value={form.jatuh_tempo_pajak_1_tahun}
                onChange={(val) => update('jatuh_tempo_pajak_1_tahun', val)}
                placeholder="Pilih Tanggal Pajak"
              />
              {errors.jatuh_tempo_pajak_1_tahun && <p className="form-error">{errors.jatuh_tempo_pajak_1_tahun}</p>}
            </div>

            {/* Pajak 5 Tahun */}
            <div>
              <label className="form-label">Jatuh Tempo Plat 5 Tahun</label>
              <CustomDatePicker
                value={form.jatuh_tempo_plat_5_tahun}
                onChange={(val) => update('jatuh_tempo_plat_5_tahun', val)}
                placeholder="Pilih Tanggal Plat"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="form-label">Status Kendaraan</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => update('status', val as any)}
              options={[
                { value: 'aktif', label: 'Aktif' },
                { value: 'perbaikan', label: 'Perbaikan / Bengkel' },
                { value: 'nonaktif', label: 'Nonaktif' }
              ]}
            />
          </div>

          {/* Upload Foto Kendaraan */}
          <div>
            <label className="form-label">Foto Kendaraan (Opsional)</label>
            <div 
              style={{
                border: fotoPreview ? 'none' : '2px dashed var(--border-default)',
                borderRadius: 12,
                padding: fotoPreview ? 0 : 24,
                textAlign: 'center',
                position: 'relative',
                background: 'var(--bg-surface)',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
            >
              {fotoPreview ? (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                  <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => document.getElementById('armada-foto')?.click()} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFotoFile(null);
                      setFotoPreview('');
                      update('foto_kendaraan', '');
                    }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                      border: 'none', borderRadius: '50%', width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                    title="Hapus Foto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', aspectRatio: '16/9', justifyContent: 'center' }}
                  onClick={() => document.getElementById('armada-foto')?.click()}
                >
                  <ImageIcon size={32} style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Tap untuk ambil / upload foto</span>
                  <span style={{ fontSize: 12 }}>Format JPG/PNG, Maks. 10MB</span>
                </div>
              )}
            </div>
            <input 
              id="armada-foto"
              type="file" 
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 32 }}>
          <Link href={`/armada/${id}`} className="btn btn-secondary">
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
      
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperSrc('')}
          aspectRatio={16 / 9}
        />
      )}
    </div>
  )
}
