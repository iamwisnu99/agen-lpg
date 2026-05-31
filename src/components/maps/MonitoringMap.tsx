'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { Pangkalan } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface MonitoringMapProps {
  height?: number
  miniMode?: boolean
}

export default function MonitoringMap({
  height = 500,
  miniMode = false,
}: MonitoringMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const clusterRef = useRef<import('leaflet').LayerGroup | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [pangkalanData, setPangkalanData] = useState<Pangkalan[]>([])
  const [activeFilter, setActiveFilter] = useState('semua')
  const supabase = createClient()

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('pangkalan')
        .select('id, nama_pangkalan, nama_pemilik, nomor_hp, status, foto_lengkap, kecamatan, kelurahan, latitude, longitude, foto_pangkalan(url, jenis_foto)')
        .eq('created_by', user.id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
      
      if (data) setPangkalanData(data as Pangkalan[])
    }
    fetchData()
  }, [])

  // Init map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return

    const initMap = async () => {
      // 1. Import Leaflet core + CSS
      const L = (await import('leaflet')).default
      leafletRef.current = L
      await import('leaflet/dist/leaflet.css')

      // 2. Import markercluster as SIDE EFFECT (attaches to L automatically)
      await import('leaflet.markercluster')
      await import('leaflet.markercluster/dist/MarkerCluster.css')
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

      if (!mapRef.current || mapInstanceRef.current) return

      // 3. Create map
      const map = L.map(mapRef.current, {
        center: [-6.1751, 106.7650],
        zoom: miniMode ? 12 : 13,
        zoomControl: true,
        attributionControl: !miniMode,
      })
      mapInstanceRef.current = map

      // 4. Tile layers
      const googleTile = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        { attribution: '&copy; Google Maps', maxZoom: 20 }
      )
      const satelliteTile = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        { attribution: '&copy; Google Maps Satelit', maxZoom: 20 }
      )

      const activeTile = googleTile
      activeTile.addTo(map)

      if (!miniMode) {
        L.control.layers(
          { 'Peta Standar': activeTile, 'Satelit': satelliteTile },
          {},
          { position: 'topright' }
        ).addTo(map)
      }

      // 5. Create cluster group via L (plugin extends L globally)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      })
      clusterRef.current = cluster
      map.addLayer(cluster)

      setIsLoaded(true)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        clusterRef.current = null
      }
    }
  }, [miniMode])

  // Re-render markers whenever data or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current
    const cluster = clusterRef.current
    const L = leafletRef.current
    if (!isLoaded || !map || !cluster || !L) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(cluster as any).clearLayers()

    const filtered = pangkalanData.filter(p => {
      if (activeFilter === 'aktif') return p.status === 'aktif'
      if (activeFilter === 'nonaktif') return p.status === 'nonaktif'
      if (activeFilter === 'belum-lengkap') return !p.foto_lengkap
      return true
    })

    filtered.forEach(p => {
      if (!p.latitude || !p.longitude) return

      const isAktif = p.status === 'aktif'
      const isLengkap = p.foto_lengkap
      const color = !isLengkap ? '#f59e0b' : isAktif ? '#16a34a' : '#ef4444'
      const borderColor = !isLengkap ? '#d97706' : isAktif ? '#15803d' : '#dc2626'
      const symbol = !isLengkap ? '⚠' : isAktif ? '✓' : '✗'

      const icon = L.divIcon({
        html: `
          <div style="
            width:32px;height:32px;
            background:${color};
            border:3px solid ${borderColor};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 4px 12px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="transform:rotate(45deg);color:white;font-size:12px;">${symbol}</span>
          </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -38],
      })

      const fotoUrl = (p.foto_pangkalan as { url: string }[] | undefined)?.[0]?.url
      const popup = `
        <div style="font-family:system-ui,sans-serif;min-width:220px;">
          ${fotoUrl
            ? `<div style="height:130px;overflow:hidden;border-radius:10px 10px 0 0;margin:-1px -1px 0;">
                <img src="${fotoUrl}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>
               </div>`
            : `<div style="height:70px;background:rgba(22,163,74,0.06);display:flex;align-items:center;justify-content:center;border-radius:10px 10px 0 0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
               </div>`
          }
          <div style="padding:14px;">
            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:8px;">${p.nama_pangkalan}</div>
            <div style="font-size:12px;color:#64748b;display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
              <span style="display:flex;align-items:center;gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${p.nama_pemilik}</span>
              <span style="display:flex;align-items:center;gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${p.nomor_hp}</span>
              <span style="display:flex;align-items:center;gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${p.kecamatan}${p.kelurahan ? ', ' + p.kelurahan : ''}</span>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:12px;">
              <span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:${isAktif ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)'};color:${isAktif ? '#15803d' : '#dc2626'};">
                ${isAktif ? '● Aktif' : '● Nonaktif'}
              </span>
              ${!isLengkap ? '<span style="display:flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:rgba(245,158,11,0.1);color:#d97706;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Belum Lengkap</span>' : ''}
            </div>
            <a href="/pangkalan/${p.id}" style="display:block;text-align:center;padding:8px;border-radius:8px;background:linear-gradient(135deg,#16a34a,#22c55e);color:white;font-size:12px;font-weight:700;text-decoration:none;">
              Lihat Detail →
            </a>
          </div>
        </div>`

      const marker = L.marker([p.latitude!, p.longitude!], { icon })
      marker.bindPopup(popup, { maxWidth: 260 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(cluster as any).addLayer(marker)
    })
  }, [pangkalanData, activeFilter, isLoaded])

  const filterOptions = [
    { key: 'semua', label: `Semua (${pangkalanData.length})` },
    { key: 'aktif', label: `Aktif (${pangkalanData.filter(p => p.status === 'aktif').length})` },
    { key: 'nonaktif', label: `Nonaktif (${pangkalanData.filter(p => p.status === 'nonaktif').length})` },
    { key: 'belum-lengkap', label: `Belum Lengkap (${pangkalanData.filter(p => !p.foto_lengkap).length})` },
  ]

  return (
    <div style={{ position: 'relative' }}>
      {/* Filter bar */}
      {!miniMode && (
        <div style={{
          display: 'flex', gap: 8, padding: '12px 16px',
          borderBottom: '1px solid var(--border-default)',
          flexWrap: 'wrap', background: 'var(--bg-surface)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 600 }}>
            Filter:
          </span>
          {filterOptions.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`btn btn-sm ${activeFilter === f.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12 }}
            >
              {f.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {[
              { color: '#16a34a', label: 'Aktif' },
              { color: '#ef4444', label: 'Nonaktif' },
              { color: '#f59e0b', label: 'Belum Lengkap' },
            ].map(item => (
              <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        style={{ height, width: '100%', borderRadius: miniMode ? 0 : 16, zIndex: 0 }}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--bg-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: miniMode ? 0 : 16, zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Memuat peta...</div>
          </div>
        </div>
      )}
    </div>
  )
}
