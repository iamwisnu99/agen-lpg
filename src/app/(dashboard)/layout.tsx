'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { NotificationManager } from '@/components/NotificationManager'
import { AppProvider } from '@/components/providers/AppProvider'

import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AppProvider>
      <div className="dashboard-layout">
        <NotificationManager />
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="dashboard-content">
          <TopNav onMenuClick={() => setSidebarOpen(true)} />
          <main className="main-content animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  )
}
