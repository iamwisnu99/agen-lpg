'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/components/providers/AppProvider'

export function NotificationManager() {
  const supabase = createClient()

  const { profile, stats, armada } = useApp()

  useEffect(() => {
    let mounted = true

    const checkNotifications = async () => {
      // Hanya cek 1x per sesi agar tidak spam
      if (sessionStorage.getItem('notif_checked') === 'true') return
      
      if (!profile || !stats) return

      if (profile.browser_notif && "Notification" in window && Notification.permission === "granted") {
        try {
          const getDaysBetween = (dateStr: string) => {
            const target = new Date(dateStr)
            const now = new Date()
            return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }

          // Gunakan pangkalan_list dari context
          const pangkalanData = stats.pangkalan_list || []
          
          const expApar = pangkalanData.filter(p => {
            if(!p.apar_expired_at) return false
            const d = getDaysBetween(p.apar_expired_at)
            return d >= 0 && d <= 30
          })

          // Gunakan armada dari context
          const expArmada = armada.filter(a => {
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
