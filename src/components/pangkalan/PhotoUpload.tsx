'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Upload, Camera, Trash2, CheckCircle2, AlertCircle, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { JENIS_FOTO_LABELS, JENIS_FOTO_LIST, type JenisFoto } from '@/types'
import { uploadFoto, deleteFoto } from '@/lib/db'
import { logAktivitas } from '@/lib/db'
import toast from 'react-hot-toast'
import imageCompression from 'browser-image-compression'
import Cropper from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'
import { getDaysRemaining, formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'

interface PhotoUploadProps {
  pangkalanId: string
  pangkalanNama: string
  existingPhotos?: { jenis_foto: string; url: string; id: string; storage_path: string; uploaded_at: string; pangkalan_id: string; file_name: string | null; file_size: number | null; uploaded_by: string | null }[]
  aparExpiredAt?: string | null
  onUpdate?: () => void
}

// addWatermark removed

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

export function PhotoUpload({ pangkalanId, pangkalanNama, existingPhotos = EMPTY_PHOTOS, aparExpiredAt, onUpdate }: PhotoUploadProps) {
  const [localPhotos, setLocalPhotos] = useState(existingPhotos)
  const [localAparExpiredAt, setLocalAparExpiredAt] = useState(aparExpiredAt)
  const [aparDateInput, setAparDateInput] = useState<Date | null>(null)
  const [aparDateUpdateModal, setAparDateUpdateModal] = useState(false)
  const [updatingApar, setUpdatingApar] = useState(false)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<JenisFoto | null>(null)
  
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

  useEffect(() => {
    setLocalAparExpiredAt(aparExpiredAt)
  }, [aparExpiredAt])

  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeJenis, setActiveJenis] = useState<JenisFoto | null>(null)
  
  const [uploadMethodTarget, setUploadMethodTarget] = useState<JenisFoto | null>(null)
  const [cameraTarget, setCameraTarget] = useState<JenisFoto | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const startCamera = async (jenis: JenisFoto) => {
    setUploadMethodTarget(null)
    setCameraTarget(jenis)
    setCameraLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengakses kamera. Pastikan izin kamera diberikan.')
      setCameraTarget(null)
    } finally {
      setCameraLoading(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !cameraTarget) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1920
    canvas.height = video.videoHeight || 1080
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' })
          handleFileSelect(cameraTarget, file)
          stopCamera()
          setCameraTarget(null)
        }
      }, 'image/jpeg', 0.95)
    }
  }

  const [preview, setPreview] = useState<{ jenis: JenisFoto; url: string; file: File } | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; title: string; jenis: JenisFoto } | null>(null)
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, jenis: JenisFoto, url: string, title: string } | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handleContextMenu = (e: React.MouseEvent, jenis: JenisFoto, url: string, title: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, jenis, url, title })
  }

  const handleTouchStart = (e: React.TouchEvent, jenis: JenisFoto, url: string, title: string) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      longPressTimer.current = setTimeout(() => {
        setContextMenu({ x: touch.clientX, y: touch.clientY, jenis, url, title })
      }, 500)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${pangkalanNama}_${title.replace(/\s+/g, '_')}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      setContextMenu(null)
    } catch (err) {
      toast.error('Gagal mengunduh gambar')
    }
  }

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

      // 3. Add watermark (DISABLED per request to allow downloading clean image)
      // const watermarked = await addWatermark(compressed, pangkalanNama)

      // 4. Upload to Supabase (Upload original clean compressed image)
      const newPhoto = await uploadFoto(pangkalanId, jenis, compressed, pangkalanNama)

      if (jenis === 'apar' && aparDateInput) {
        const supabase = createClient()
        const formattedDate = format(aparDateInput, 'yyyy-MM-dd')
        await supabase.from('pangkalan').update({ apar_expired_at: formattedDate }).eq('id', pangkalanId)
        setLocalAparExpiredAt(formattedDate)
      }

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

  const handleDeleteClick = (jenis: JenisFoto) => {
    setDeleteTarget(jenis)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const jenis = deleteTarget
    const photo = getExistingPhoto(jenis)
    if (!photo) return

    setDeleting(jenis)
    setDeleteModalOpen(false)
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
      setDeleteTarget(null)
    }
  }

  const handleUpdateAparDate = async () => {
    if (!aparDateInput) {
      toast.error('Silakan isi tanggal kedaluwarsa')
      return
    }
    setUpdatingApar(true)
    try {
      const formattedDate = format(aparDateInput, 'yyyy-MM-dd')
      const supabase = createClient()
      await supabase.from('pangkalan').update({ apar_expired_at: formattedDate }).eq('id', pangkalanId)
      setLocalAparExpiredAt(formattedDate)
      toast.success('Tanggal kedaluwarsa APAR berhasil diperbarui')
      setAparDateUpdateModal(false)
      onUpdate?.()
    } catch (err) {
      toast.error('Gagal memperbarui tanggal APAR')
    } finally {
      setUpdatingApar(false)
    }
  }

  const openFileInput = (jenis: JenisFoto) => {
    setUploadMethodTarget(null)
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
                    setViewingPhoto({ url: existing.url, title: JENIS_FOTO_LABELS[jenis], jenis })
                  } else {
                    setUploadMethodTarget(jenis)
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
                        onClick={e => { e.stopPropagation(); handleDeleteClick(jenis) }}
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

              {/* APAR Expiry Logic */}
              {jenis === 'apar' && existing && localAparExpiredAt && (
                <div style={{ marginTop: 8, padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Kedaluwarsa APAR:</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {formatDate(localAparExpiredAt)}
                  </div>
                  {getDaysRemaining(localAparExpiredAt) <= 30 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 10, color: getDaysRemaining(localAparExpiredAt) < 0 ? '#ef4444' : '#f59e0b', marginBottom: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={12} />
                        {getDaysRemaining(localAparExpiredAt) < 0 ? 'Sudah Kedaluwarsa!' : `Tinggal ${getDaysRemaining(localAparExpiredAt)} hari`}
                      </div>
                      <button
                        className="btn btn-sm"
                        style={{ width: '100%', fontSize: 11, padding: '4px 8px', background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}
                        onClick={(e) => { e.stopPropagation(); setAparDateUpdateModal(true); setAparDateInput(null) }}
                      >
                        Sudah Update
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                {preview.jenis === 'apar' && (
                  <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Tanggal Kedaluwarsa APAR <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div className="custom-datepicker-wrapper">
                      <DatePicker
                        selected={aparDateInput}
                        onChange={(date: Date | null) => setAparDateInput(date)}
                        className="input input-bordered w-full"
                        dateFormat="dd/MM/yyyy"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        placeholderText="Pilih Tanggal..."
                        required
                      />
                    </div>
                  </div>
                )}
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
                disabled={!!uploading || (preview.jenis === 'apar' && !aparDateInput)}
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
            <div 
              className="viewer-image-wrapper"
              onContextMenu={(e) => viewingPhoto.jenis && handleContextMenu(e, viewingPhoto.jenis, viewingPhoto.url, viewingPhoto.title)}
              onTouchStart={(e) => viewingPhoto.jenis && handleTouchStart(e, viewingPhoto.jenis, viewingPhoto.url, viewingPhoto.title)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingPhoto.url}
                alt={viewingPhoto.title}
                className="viewer-img"
              />
              <div 
                style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  height: 70,
                  background: 'rgba(0,0,0,0.55)',
                  color: 'white',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{pangkalanNama}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Context Menu */}
      {contextMenu && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }}
          />
          <div
            style={{
              position: 'fixed',
              top: Math.min(contextMenu.y, window.innerHeight - 150),
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10001,
              minWidth: 160,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <button
              style={{ padding: '12px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}
              onClick={() => handleDownload(contextMenu.url, contextMenu.title)}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Unduh Gambar
            </button>
            <button
              style={{ padding: '12px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: '#ef4444' }}
              onClick={() => { setContextMenu(null); setViewingPhoto(null); handleDeleteClick(contextMenu.jenis) }}
              onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Hapus
            </button>
            <button
              style={{ padding: '12px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}
              onClick={() => { setContextMenu(null); setViewingPhoto(null); }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Tutup
            </button>
          </div>
        </>
      )}

      {/* APAR Date Update Modal */}
      {aparDateUpdateModal && (
        <div className="modal-overlay" onClick={() => setAparDateUpdateModal(false)}>
          <div className="modal" style={{ maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Update Tanggal Kedaluwarsa APAR</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Masukkan tanggal kedaluwarsa baru</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setAparDateUpdateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>Tanggal Baru</label>
              <div className="custom-datepicker-wrapper">
                <DatePicker
                  selected={aparDateInput}
                  onChange={(date: Date | null) => setAparDateInput(date)}
                  className="input input-bordered w-full"
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Pilih Tanggal..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAparDateUpdateModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleUpdateAparDate} disabled={updatingApar || !aparDateInput}>
                {updatingApar ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : 'Simpan Tanggal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Method Modal */}
      {uploadMethodTarget && (
        <div className="modal-overlay" onClick={() => setUploadMethodTarget(null)}>
          <div className="modal" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Pilih Metode</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bagaimana Anda ingin mengunggah foto?</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setUploadMethodTarget(null)} style={{ position: 'absolute', right: 16, top: 16 }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '24px' }}>
              <button className="btn btn-primary" style={{ padding: '16px', fontSize: 15, display: 'flex', justifyContent: 'center', gap: 8 }} onClick={() => startCamera(uploadMethodTarget)}>
                <Camera size={20} /> Ambil Langsung
              </button>
              <button className="btn btn-secondary" style={{ padding: '16px', fontSize: 15, display: 'flex', justifyContent: 'center', gap: 8 }} onClick={() => {
                const target = uploadMethodTarget
                setUploadMethodTarget(null)
                setActiveJenis(target)
                fileInputRef.current?.click()
              }}>
                <ImageIcon size={20} /> Pilih dari Galeri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera View */}
      {cameraTarget && (
        <div className="modal-overlay" style={{ background: '#000', zIndex: 10000 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(rgba(0,0,0,0.5), transparent)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
              <div style={{ color: 'white', fontWeight: 600 }}>{JENIS_FOTO_LABELS[cameraTarget]}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => { stopCamera(); setCameraTarget(null) }} style={{ color: 'white' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <div style={{ width: '100%', maxWidth: 600, aspectRatio: '4/3', position: 'relative', background: '#222', borderRadius: 8, overflow: 'hidden' }}>
                {cameraLoading && <Loader2 size={40} className="animate-spin" style={{ color: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraLoading ? 'none' : 'block' }}
                  onLoadedMetadata={() => setCameraLoading(false)}
                />
              </div>
            </div>

            <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
              <button 
                onClick={capturePhoto}
                style={{ 
                  width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' 
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'white' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={deleteModalOpen}
        title="Hapus Foto"
        description={deleteTarget ? `Apakah Anda yakin ingin menghapus foto ${JENIS_FOTO_LABELS[deleteTarget]}? Anda harus mengupload ulang foto jika dihapus.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false)
          setDeleteTarget(null)
        }}
        loading={!!deleting}
      />

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
          opacity: 0.9;
          transition: all 0.2s ease;
        }
        
        .photo-container:hover .photo-dim-overlay {
          background: rgba(0, 0, 0, 0.2);
        }
        .photo-container:hover .photo-delete-btn {
          opacity: 1;
          transform: scale(1.05);
        }

        /* Photo Viewer Animations */
        .viewer-overlay {
          animation: fadeIn 0.25s ease-out forwards;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
        }
        .viewer-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .viewer-image-wrapper {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          display: flex;
          background: rgba(0,0,0,0.5);
        }
        .viewer-img {
          max-width: 90vw;
          max-height: 85vh;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
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
        .custom-datepicker-wrapper .react-datepicker-wrapper,
        .custom-datepicker-wrapper .react-datepicker__input-container {
          width: 100%;
          display: block;
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
