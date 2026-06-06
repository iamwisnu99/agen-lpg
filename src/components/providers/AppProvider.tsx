'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDashboardStats, getArmadaList } from '@/lib/db'
import { getFallbackProfileData } from '@/app/actions'
import type { DashboardStats, Armada } from '@/types'
import { User } from '@supabase/supabase-js'

interface AppContextType {
  user: User | null
  profile: any
  agenData: any
  stats: DashboardStats | null
  armada: Armada[]
  loading: boolean
  refreshing: boolean
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  user: null,
  profile: null,
  agenData: null,
  stats: null,
  armada: [],
  loading: true,
  refreshing: false,
  refresh: async () => {},
})

export const useApp = () => useContext(AppContext)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [agenData, setAgenData] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [armada, setArmada] = useState<Armada[]>([])
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  const fetchData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
         setLoading(false)
         setRefreshing(false)
         return
      }
      setUser(currentUser)

      // Fetch independent data in parallel
      const [profileRes, statsData, armadaData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
        getDashboardStats(currentUser.id),
        getArmadaList(undefined, currentUser.id)
      ])

      setProfile(profileRes.data)
      setStats(statsData)
      setArmada(armadaData)

      // Fetch agen_account via fallback
      if (currentUser.email) {
        const agen = await getFallbackProfileData(currentUser.email)
        setAgenData(agen)
      }
    } catch (err) {
      console.error('Error fetching global app data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  return (
    <AppContext.Provider value={{ user, profile, agenData, stats, armada, loading, refreshing, refresh }}>
      {children}
    </AppContext.Provider>
  )
}
