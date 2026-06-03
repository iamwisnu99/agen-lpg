'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Upload, Camera, Trash2, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { JENIS_FOTO_LABELS, JENIS_FOTO_LIST, type JenisFoto } from '@/types'
import { uploadFoto, deleteFoto } from '@/lib/db'
import { logAktivitas } from '@/lib/db'
import toast from 'react-hot-toast'
import imageCompression from 'browser-image-compression'
import Cropper from 'react-easy-crop'

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

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  fileName: string
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(new File([file], fileName, { type: 'image/jpeg' }))
      } else {
        reject(new Error('Canvas is empty'))
      }
    }, 'image/jpeg', 1)
  })
}

const EMPTY_PHOTOS: any[] = []

export function PhotoUpload({ pangkalanId, pangkalanNama, existingPhotos = EMPTY_PHOTOS, onUpdate }: PhotoUploadProps) {
  const [localPhotos, setLocalPhotos] = useState(existingPhotos)
  
  // Sync local photos if parent updates them
  useEffect(() => {
    setLocalPhotos(prev => {
      const prevStr = JSON.stringify(prev)
      const nextStr = JSON.stringify(existingPhotos)
      if (prevStr !== nextStr) {
        return existingPhotos
      }
      return prev
    })
  }, [existingPhotos])

  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeJenis, setActiveJenis] = useState<JenisFoto | null>(null)
  const [preview, setPreview] = useState<{ jenis: JenisFoto; url: string; file: File } | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; title: string } | null>(null)

  // Crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number, y: number, width: number, height: number } | null>(null)

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const getExistingPhoto = (jenis: JenisFoto) => localPhotos.find(p => p.jenis_foto === jenis)

  const handleFileSelect = async (jenis: JenisFoto, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 20MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setPreview({ jenis, url: previewUrl, file })
  }

  const handleUpload = async () => {
    if (!preview || !croppedAreaPixels) return
    const { jenis, file } = preview

    setUploading(jenis)
    try {
      // 1. Crop image
      const croppedFile = await getCroppedImg(preview.url, croppedAreaPixels, file.name)

      // 2. Compress
      const compressed = await imageCompression(croppedFile, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85,
      })

      // 3. Add watermark
      const watermarked = await addWatermark(compressed, pangkalanNama)

      // 4. Upload to Supabase
      const newPhoto = await uploadFoto(pangkalanId, jenis, watermarked, pangkalanNama)

      await logAktivitas({
        aksi: 'upload_foto',
        entitas: 'foto_pangkalan',
        entitas_id: pangkalanId,
        entitas_nama: `${pangkalanNama} - ${JENIS_FOTO_LABELS[jenis]}`,
      })

      toast.success(`Foto ${JENIS_FOTO_LABELS[jenis]} berhasil diupload`)
      
      // 5. Update local state instantly so UI shows the uploaded image
      setLocalPhotos(prev => {
        const next = [...prev]
        const idx = next.findIndex(p => p.jenis_foto === jenis)
        if (idx >= 0) next[idx] = newPhoto
        else next.push(newPhoto)
        return next
      })

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
    if (!confirm(`Hapus foto ${JENIS_FOTO_LABELS[jenis]}? Anda harus mengupload ulang foto jika dihapus.`)) return

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
      
      // Remove from local state instantly
      setLocalPhotos(prev => prev.filter(p => p.jenis_foto !== jenis))
      
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
                onClick={() => {
                  if (existing) {
                    setViewingPhoto({ url: existing.url, title: JENIS_FOTO_LABELS[jenis] })
                  } else {
                    openFileInput(jenis)
                  }
                }}
                className="photo-container"
              >
                {existing ? (
                  <>
                    <Image
                      src={existing.url}
                      alt={JENIS_FOTO_LABELS[jenis]}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      style={{ objectFit: 'cover' }}
                      unoptimized={true}
                    />
                    <div className="photo-dim-overlay" />
                    {/* Delete button (Trash icon) floating at top right, visible on hover */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        zIndex: 10
                      }}
                      className="photo-delete-btn"
                    >
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          width: 28,
                          height: 28,
                          padding: 0,
                          borderRadius: '50%',
                          background: 'rgba(239,68,68,0.95)',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={e => { e.stopPropagation(); handleDelete(jenis) }}
                        disabled={isDeleting}
                        title="Hapus foto ini untuk mengupload ulang"
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
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

      {/* Preview modal with Crop */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div
            className="modal"
            style={{ maxWidth: 480, width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Sesuaikan Foto
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
              <div style={{ width: '100%', height: 350, position: 'relative', background: '#333' }}>
                <Cropper
                  image={preview.url}
                  crop={crop}
                  zoom={zoom}
                  aspect={4 / 3}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div style={{ padding: 16 }}>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100%', marginBottom: 16 }}
                />
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
                  ℹ️ Geser atau zoom foto untuk memotong. Foto akan dikompres otomatis dan ditambahkan watermark.
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

      {/* Fullscreen Photo Viewer */}
      {viewingPhoto && (
        <div 
          className="modal-overlay viewer-overlay" 
          onClick={() => setViewingPhoto(null)}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            className="viewer-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="btn btn-ghost btn-icon viewer-close"
              onClick={() => setViewingPhoto(null)}
            >
              <X size={24} color="white" />
            </button>
            <div className="viewer-title">
              {viewingPhoto.title}
            </div>
            <div className="viewer-image-wrapper">
              <Image
                src={viewingPhoto.url}
                alt={viewingPhoto.title}
                fill
                style={{ objectFit: 'contain' }}
                unoptimized={true}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .photo-container {
          position: relative;
        }
        .photo-dim-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0);
          transition: background 0.2s ease;
          pointer-events: none;
        }
        .photo-delete-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .photo-container:hover .photo-dim-overlay {
          background: rgba(0, 0, 0, 0.35);
        }
        .photo-container:hover .photo-delete-btn {
          opacity: 1;
        }

        /* Photo Viewer Animations */
        .viewer-overlay {
          animation: fadeIn 0.25s ease-out forwards;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
        }
        .viewer-content {
          position: relative;
          width: 90vw;
          max-width: 1000px;
          height: 85vh;
          animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          display: flex;
          flex-direction: column;
        }
        .viewer-image-wrapper {
          position: relative;
          flex: 1;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .viewer-close {
          position: absolute;
          top: -40px;
          right: -10px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          padding: 8px;
          z-index: 10;
        }
        .viewer-close:hover {
          background: rgba(255,255,255,0.2);
        }
        .viewer-title {
          position: absolute;
          top: -35px;
          left: 0;
          color: white;
          font-weight: 600;
          font-size: 16px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
