'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/lib/cropImage'
import { Loader2, Check, X } from 'lucide-react'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedFile: File) => void
  onCancel: () => void
  aspectRatio?: number
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel, aspectRatio = 4 / 3 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number, y: number, width: number, height: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, 0)
      if (croppedFile) {
        onCropComplete(croppedFile)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', padding: 16
    }}>
      <div style={{ position: 'relative', flex: 1, borderRadius: 16, overflow: 'hidden' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteCallback}
          onZoomChange={setZoom}
        />
      </div>
      
      <div style={{ display: 'flex', gap: 16, marginTop: 16, padding: '16px 0', background: 'transparent' }}>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#16a34a' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 16 }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{ color: 'white' }}>
          <X size={18} /> Batal
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={isProcessing}>
          {isProcessing ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : <><Check size={18} /> Simpan Potongan</>}
        </button>
      </div>
    </div>
  )
}
