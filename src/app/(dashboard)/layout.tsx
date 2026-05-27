'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'

import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard-layout">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-content">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
