'use client'

import { useEffect, useRef, useState } from 'react'

interface StaticMiniMapProps {
  lat: number
  lng: number
  height?: number
}

export default function StaticMiniMap({ lat, lng, height = 200 }: StaticMiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let mounted = true
    const initMap = async () => {
      // Import leaflet and css dynamically to avoid SSR window errors
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (!mounted || !mapRef.current) return
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      // Create map with interactions disabled
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
      })
      mapInstanceRef.current = map

      // Tile layer (Google Maps as requested)
      L.tileLayer(
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        { attribution: '&copy; Google Maps', maxZoom: 20 }
      ).addTo(map)

      // Marker
      const markerIcon = L.divIcon({
        html: `
          <div style="
            width: 32px; height: 32px;
            background: #16a34a;
            border: 3px solid #15803d;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div>
          </div>
        `,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })

      L.marker([lat, lng], { icon: markerIcon }).addTo(map)
      setIsLoaded(true)
    }

    initMap()

    return () => {
      mounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng])

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100%', zIndex: 1 }} 
      />
      {!isLoaded && (
        <div style={{
          position: 'absolute', inset: 0, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-muted)', zIndex: 2
        }}>
          <div className="animate-spin" style={{ width: 24, height: 24, border: '3px solid var(--border-default)', borderTopColor: '#16a34a', borderRadius: '50%' }} />
        </div>
      )}
    </div>
  )
}
