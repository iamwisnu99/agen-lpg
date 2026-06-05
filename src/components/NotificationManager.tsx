'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function NotificationManager() {
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const checkNotifications = async () => {
      // Hanya cek 1x per sesi agar tidak spam
      if (sessionStorage.getItem('notif_checked') === 'true') return
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('browser_notif')
        .eq('id', user.id)
        .single()

      if (profile?.browser_notif && "Notification" in window && Notification.permission === "granted") {
        try {
          // Kita query langsung ke supabase dari client untuk mendapat total expired
          const getDaysBetween = (dateStr: string) => {
            const target = new Date(dateStr)
            const now = new Date()
            return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }

          // Fetch APAR
          const { data: pangkalanData } = await supabase
            .from('pangkalan')
            .select('nama_pangkalan, apar_expired_at')
            .not('apar_expired_at', 'is', null)
          
          const expApar = (pangkalanData || []).filter(p => {
            if(!p.apar_expired_at) return false
            const d = getDaysBetween(p.apar_expired_at)
            return d >= 0 && d <= 30
          })

          // Fetch Armada
          const { data: armadaData } = await supabase
            .from('armada')
            .select('no_plat, jatuh_tempo_pajak_1_tahun, jatuh_tempo_plat_5_tahun')
          
          const expArmada = (armadaData || []).filter(a => {
            const d1 = a.jatuh_tempo_pajak_1_tahun ? getDaysBetween(a.jatuh_tempo_pajak_1_tahun) : 999
            const d5 = a.jatuh_tempo_plat_5_tahun ? getDaysBetween(a.jatuh_tempo_plat_5_tahun) : 999
            return (d1 >= 0 && d1 <= 30) || (d5 >= 0 && d5 <= 30)
          })

          const total = expApar.length + expArmada.length
          if (total > 0 && mounted) {
            new Notification('Peringatan Sistem', {
              body: `Terdapat ${total} dokumen (APAR/Pajak) yang akan segera kedaluwarsa. Mohon cek dashboard!`,
              icon: '/icons/favicon-96x96.png'
            })
            sessionStorage.setItem('notif_checked', 'true')
          } else {
            sessionStorage.setItem('notif_checked', 'true')
          }
        } catch (error) {
          console.error("Error checking notifications:", error)
        }
      }
    }

    checkNotifications()

    return () => { mounted = false }
  }, [supabase])

  return null
}
