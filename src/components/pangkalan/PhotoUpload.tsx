'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Camera, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { JENIS_FOTO_LABELS, JENIS_FOTO_LIST, type JenisFoto } from '@/types'
import { uploadFoto, deleteFoto } from '@/lib/db'
import { logAktivitas } from '@/lib/db'
import toast from 'react-hot-toast'
import imageCompression from 'browser-image-compression'

interface PhotoUploadProps {
  pangkalanId: string
  pangkalanNama: string
  existingPhotos?: { jenis_foto: string; url: string; id: string; storage_path: string; uploaded_at: string; pangkalan_id: string; file_name: string | null; file_size: number | null; uploaded_by: string | null }[]
  onUpdate?: () => void
}

const addWatermark = async (file: File, pangkalanNama: string): Promise<File> => {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Watermark background
      const watermarkH = 60
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, img.height - watermarkH, img.width, watermarkH)

      // Watermark text
      ctx.fillStyle = 'white'
      ctx.font = `bold ${Math.max(14, img.width / 30)}px Arial`
      ctx.fillText(pangkalanNama, 12, img.height - watermarkH + 22)

      const now = new Date()
      const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      ctx.font = `${Math.max(12, img.width / 36)}px Arial`
      ctx.fillText(dateStr, 12, img.height - watermarkH + 46)

      // Logo CWS
      ctx.fillStyle = '#22c55e'
      ctx.font = `bold ${Math.max(12, img.width / 36)}px Arial`
      ctx.textAlign = 'right'
      ctx.fillText('Agen LPG', img.width - 12, img.height - watermarkH + 22)
      ctx.textAlign = 'left'

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        if (blob) {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        } else {
          resolve(file)
        }
      }, 'image/jpeg', 0.9)
    }
    img.src = url
  })
}

export function PhotoUpload({ pangkalanId, pangkalanNama, existingPhotos = [], onUpdate }: PhotoUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeJenis, setActiveJenis] = useState<JenisFoto | null>(null)
  const [preview, setPreview] = useState<{ jenis: JenisFoto; url: string; file: File } | null>(null)

  const getExistingPhoto = (jenis: JenisFoto) =>
    existingPhotos.find(p => p.jenis_foto === jenis)

  const handleFileSelect = async (jenis: JenisFoto, file: File) => {
    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 20MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPreview({ jenis, url: previewUrl, file })
  }

  const handleUpload = async () => {
    if (!preview) return
    const { jenis, file } = preview

    setUploading(jenis)
    try {
      // Compress
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85,
      })

      // Add watermark
      const watermarked = await addWatermark(compressed, pangkalanNama)

      // Upload to Supabase
      const result = await uploadFoto(pangkalanId, jenis, watermarked, pangkalanNama)

      await logAktivitas({
        aksi: 'upload_foto',
        entitas: 'foto_pangkalan',
        entitas_id: pangkalanId,
        entitas_nama: `${pangkalanNama} - ${JENIS_FOTO_LABELS[jenis]}`,
      })

      toast.success(`Foto ${JENIS_FOTO_LABELS[jenis]} berhasil diupload`)
      URL.revokeObjectURL(preview.url)
      setPreview(null)
      onUpdate?.()
    } catch (err) {
      toast.error('Gagal upload foto. Coba lagi.')
      console.error(err)
    } finally {
      setUploading(null)
    }
  }

  const handleDelete = async (jenis: JenisFoto) => {
    const photo = getExistingPhoto(jenis)
    if (!photo) return
    if (!confirm(`Hapus foto ${JENIS_FOTO_LABELS[jenis]}?`)) return

    setDeleting(jenis)
    try {
      await deleteFoto(photo as Parameters<typeof deleteFoto>[0])
      await logAktivitas({
        aksi: 'hapus_foto',
        entitas: 'foto_pangkalan',
        entitas_id: pangkalanId,
        entitas_nama: `${pangkalanNama} - ${JENIS_FOTO_LABELS[jenis]}`,
      })
      toast.success('Foto berhasil dihapus')
      onUpdate?.()
    } catch {
      toast.error('Gagal menghapus foto')
    } finally {
      setDeleting(null)
    }
  }

  const openFileInput = (jenis: JenisFoto) => {
    setActiveJenis(jenis)
    fileInputRef.current?.click()
  }

  const completedCount = JENIS_FOTO_LIST.filter(j => getExistingPhoto(j)).length
  const totalCount = JENIS_FOTO_LIST.length

  return (
    <div>
      {/* Progress indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Dokumentasi Foto Wajib
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {completedCount}/{totalCount} foto telah diupload
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completedCount === totalCount ? (
            <span className="badge badge-green">
              <CheckCircle2 size={12} /> Lengkap
            </span>
          ) : (
            <span className="badge badge-amber">
              <AlertCircle size={12} /> {totalCount - completedCount} belum diupload
            </span>
          )}
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: 20 }}>
        <div
          className="progress-fill"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file && activeJenis) handleFileSelect(activeJenis, file)
          e.target.value = ''
        }}
      />

      {/* Photo grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {JENIS_FOTO_LIST.map((jenis) => {
          const existing = getExistingPhoto(jenis)
          const isUploading = uploading === jenis
          const isDeleting = deleting === jenis

          return (
            <div key={jenis}>
              {/* Photo slot */}
              <div
                style={{
                  aspectRatio: '4/3',
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'relative',
                  border: existing
                    ? '2px solid rgba(22,163,74,0.3)'
                    : '2px dashed var(--border-default)',
                  background: existing ? 'transparent' : 'var(--bg-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => !existing && openFileInput(jenis)}
              >
                {existing ? (
                  <>
                    <img
                      src={existing.url}
                      alt={JENIS_FOTO_LABELS[jenis]}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    {/* Overlay on hover */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'all 0.2s',
                      }}
                      className="photo-overlay"
                    >
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.95)', color: '#374151', backdropFilter: 'blur(4px)' }}
                        onClick={e => { e.stopPropagation(); openFileInput(jenis) }}
                        disabled={isDeleting}
                      >
                        <Camera size={12} /> Ganti
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'rgba(220,38,38,0.9)', color: 'white', backdropFilter: 'blur(4px)' }}
                        onClick={e => { e.stopPropagation(); handleDelete(jenis) }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                      </button>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 22,
                        height: 22,
                        background: '#16a34a',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle2 size={13} color="white" />
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: 12,
                    }}
                  >
                    {isUploading ? (
                      <Loader2 size={24} className="animate-spin" style={{ color: '#16a34a' }} />
                    ) : (
                      <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                      {isUploading ? 'Mengupload...' : 'Tap untuk upload'}
                    </span>
                  </div>
                )}
              </div>

              {/* Label */}
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: existing ? '#16a34a' : 'var(--text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {existing ? '✓ ' : ''}{JENIS_FOTO_LABELS[jenis]}
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div
            className="modal"
            style={{ maxWidth: 480 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Preview Foto
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {JENIS_FOTO_LABELS[preview.jenis]}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setPreview(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                <img
                  src={preview.url}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    padding: 12,
                    background: 'rgba(22,163,74,0.05)',
                    border: '1px solid rgba(22,163,74,0.15)',
                    borderRadius: 10,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginBottom: 0,
                  }}
                >
                  ℹ️ Foto akan dikompres otomatis dan ditambahkan watermark nama pangkalan + tanggal upload
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreview(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!!uploading}
              >
                {uploading ? (
                  <><Loader2 size={14} className="animate-spin" /> Mengupload...</>
                ) : (
                  <><Upload size={14} /> Upload Foto</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .photo-overlay:hover {
          background: rgba(0,0,0,0.45) !important;
        }
      `}</style>
    </div>
  )
}
