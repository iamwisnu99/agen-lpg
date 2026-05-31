'use client'

import { useEffect, useRef, useState } from 'react'
import { extractCoordsFromGoogleMaps } from '@/lib/utils'
import { MapPin, Navigation, Link2, Type, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface LocationPickerProps {
  lat: string
  lng: string
  linkMaps: string
  onChange: (lat: string, lng: string, linkMaps: string) => void
  onAddressFound?: (addressData: any) => void
}

type InputMethod = 'manual' | 'link' | 'map' | 'gps'

export function LocationPicker({ lat, lng, linkMaps, onChange, onAddressFound }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)
  const [method, setMethod] = useState<InputMethod>('map')
  const [linkInput, setLinkInput] = useState(linkMaps || '')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [address, setAddress] = useState('')

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`)
      const data = await res.json()
      setAddress(data.display_name || '')
      if (onAddressFound && data.address) {
        onAddressFound({
          full: data.display_name,
          ...data.address
        })
      }
    } catch {
      setAddress('')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (mapInstanceRef.current) return

      const initLat = parseFloat(lat) || -6.1751
      const initLng = parseFloat(lng) || 106.7650

      const map = L.map(mapRef.current!, {
        center: [initLat, initLng],
        zoom: 15,
        zoomControl: true,
      })

      L.tileLayer(
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        { attribution: '&copy; Google Maps', maxZoom: 20 }
      ).addTo(map)

      // Custom draggable marker
      const markerIcon = L.divIcon({
        html: `
          <div style="
            width: 36px; height: 36px;
            background: #16a34a;
            border: 4px solid #15803d;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 16px rgba(22,163,74,0.5);
            cursor: grab;
          ">
            <div style="transform: rotate(45deg); display:flex; align-items:center; justify-content:center; height:100%; color:white; font-size:14px;">
              📍
            </div>
          </div>
        `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      const marker = L.marker([initLat, initLng], {
        icon: markerIcon,
        draggable: true,
      }).addTo(map)

      marker.on('dragend', async () => {
        const pos = marker.getLatLng()
        onChange(pos.lat.toFixed(7), pos.lng.toFixed(7), linkInput)
        await reverseGeocode(pos.lat, pos.lng)
      })

      map.on('click', async (e) => {
        marker.setLatLng(e.latlng)
        onChange(e.latlng.lat.toFixed(7), e.latlng.lng.toFixed(7), linkInput)
        await reverseGeocode(e.latlng.lat, e.latlng.lng)
      })

      mapInstanceRef.current = map
      markerRef.current = marker
      setIsMapReady(true)

      if (lat && lng) {
        reverseGeocode(parseFloat(lat), parseFloat(lng))
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as import('leaflet').Map).remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Update marker position when lat/lng changes externally
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return
    const numLat = parseFloat(lat)
    const numLng = parseFloat(lng)
    if (!isNaN(numLat) && !isNaN(numLng)) {
      const marker = markerRef.current as import('leaflet').Marker
      const map = mapInstanceRef.current as import('leaflet').Map
      marker.setLatLng([numLat, numLng])
      map.setView([numLat, numLng], 16, { animate: true })
    }
  }, [lat, lng])

  const handleLinkExtract = () => {
    const coords = extractCoordsFromGoogleMaps(linkInput)
    if (coords) {
      onChange(coords.lat.toFixed(7), coords.lng.toFixed(7), linkInput)
      toast.success(`Koordinat berhasil diekstrak: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
    } else {
      toast.error('Format link tidak dikenali. Coba link share Google Maps yang valid.')
    }
  }

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung GPS')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        onChange(latitude.toFixed(7), longitude.toFixed(7), linkInput)
        await reverseGeocode(latitude, longitude)
        toast.success('Lokasi GPS berhasil diambil')
        setGpsLoading(false)
      },
      (err) => {
        toast.error('Gagal mengambil lokasi GPS: ' + err.message)
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const methods = [
    { key: 'map' as InputMethod, label: 'Pilih di Peta', icon: MapPin },
    { key: 'link' as InputMethod, label: 'Paste Link Maps', icon: Link2 },
    { key: 'manual' as InputMethod, label: 'Input Manual', icon: Type },
    { key: 'gps' as InputMethod, label: 'Ambil GPS', icon: Navigation },
  ]

  return (
    <div>
      {/* Method selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {methods.map(m => {
          const Icon = m.icon
          return (
            <button
              key={m.key}
              type="button"
              onClick={m.key === 'gps' ? handleGPS : () => setMethod(m.key)}
              className={`btn btn-sm ${method === m.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexDirection: 'column', gap: 4, padding: '10px 8px', height: 'auto', fontSize: 11 }}
              disabled={m.key === 'gps' && gpsLoading}
            >
              {m.key === 'gps' && gpsLoading
                ? <Loader2 size={16} className="animate-spin" />
                : <Icon size={16} />
              }
              {m.key === 'gps' && gpsLoading ? 'Mengambil...' : m.label}
            </button>
          )
        })}
      </div>

      {/* Link input */}
      {method === 'link' && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Paste link Google Maps di sini..."
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleLinkExtract}
          >
            Ekstrak
          </button>
        </div>
      )}

      {/* Manual input */}
      {method === 'manual' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label className="form-label">Latitude</label>
            <input
              type="number"
              className="form-input"
              placeholder="-6.1751"
              value={lat}
              step="any"
              onChange={e => onChange(e.target.value, lng, linkInput)}
            />
          </div>
          <div>
            <label className="form-label">Longitude</label>
            <input
              type="number"
              className="form-input"
              placeholder="106.7650"
              value={lng}
              step="any"
              onChange={e => onChange(lat, e.target.value, linkInput)}
            />
          </div>
        </div>
      )}

      {/* Map */}
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border-default)',
          position: 'relative',
        }}
      >
        <div ref={mapRef} style={{ height: 320, width: '100%' }} />
        {!isMapReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--bg-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🗺️</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Memuat peta...</div>
            </div>
          </div>
        )}
      </div>

      {/* Tip */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        💡 Klik pada peta atau seret marker untuk memilih lokasi
      </p>

      {/* Coordinates display */}
      {lat && lng && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            background: 'rgba(22,163,74,0.05)',
            border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>📍 Koordinat Terpilih</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, fontFamily: 'monospace' }}>
                {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
              </div>
              {address && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                  {address}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Maps input */}
      <div style={{ marginTop: 12 }}>
        <label className="form-label">Link Google Maps (opsional)</label>
        <input
          type="url"
          className="form-input"
          placeholder="https://maps.google.com/..."
          value={linkInput}
          onChange={e => {
            setLinkInput(e.target.value)
            onChange(lat, lng, e.target.value)
          }}
        />
      </div>
    </div>
  )
}
