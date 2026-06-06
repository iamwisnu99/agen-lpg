'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { Sun, Moon, Bell, AlertTriangle, Menu, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getDaysRemaining } from '@/lib/utils'
import { useApp } from '@/components/providers/AppProvider'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface TopNavProps {
  onMenuClick?: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { theme, toggleTheme } = useTheme()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { user, profile, stats, armada } = useApp()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  
  // Derive counts from global context
  const incompleteCount = stats?.total_belum_lengkap || 0
  
  const expiringArmadaCount = armada.filter(a => {
    if (a.status !== 'aktif') return false
    if (!a.jatuh_tempo_pajak_1_tahun) return false
    const days = getDaysRemaining(a.jatuh_tempo_pajak_1_tahun)
    return days >= 0 && days <= 30
  }).length

  const totalNotif = incompleteCount + expiringArmadaCount
  
  const userEmail = user?.email || ''
  const userName = profile?.full_name || userEmail || 'Admin'

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    toast.success('Berhasil logout')
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="topnav">
        {/* Left — Hamburger Menu (Mobile) */}
        <div>
          <button
            className="btn btn-ghost btn-icon md-hidden"
            onClick={onMenuClick}
            title="Menu"
          >
            <Menu size={24} />
          </button>
        </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button
            className="btn btn-ghost btn-icon relative"
            onClick={() => setShowNotif(!showNotif)}
            title="Notifikasi"
          >
            <Bell size={20} />
            {totalNotif > 0 && (
              <span
                className="absolute"
                style={{
                  top: 6, right: 6,
                  width: 8, height: 8,
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid var(--bg-surface)',
                }}
              />
            )}
          </button>

          {showNotif && (
            <div
              style={{
                position: 'absolute', right: 0, top: '100%',
                marginTop: 8,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 14, padding: 16, minWidth: 280,
                boxShadow: 'var(--shadow-xl)', zIndex: 100,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Notifikasi
              </div>
              {totalNotif > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {incompleteCount > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      background: 'rgba(245,158,11,0.08)',
                      borderRadius: 10,
                      border: '1px solid rgba(245,158,11,0.2)',
                    }}>
                      <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#d97706' }}>
                          {incompleteCount} Pangkalan Belum Lengkap
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Dokumen foto belum lengkap
                        </div>
                      </div>
                    </div>
                  )}

                  {expiringArmadaCount > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      background: 'rgba(239,68,68,0.08)',
                      borderRadius: 10,
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}>
                      <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
                          {expiringArmadaCount} Pajak Armada Habis
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Segera lakukan perpanjangan
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                  Tidak ada notifikasi
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Profile (Mobile only, Desktop is in Sidebar) */}
        <div className="relative md-hidden">
          <button
            className="btn btn-ghost btn-icon relative"
            onClick={() => setShowProfile(!showProfile)}
            title="Profil"
          >
            <User size={20} />
          </button>

          {showProfile && (
            <div
              style={{
                position: 'absolute', right: 0, top: '100%',
                marginTop: 8,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 14, padding: 16, minWidth: 200,
                boxShadow: 'var(--shadow-xl)', zIndex: 100,
              }}
            >
              <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-default)', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail}
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', padding: '8px 12px' }}
                onClick={() => {
                  setShowProfile(false)
                  setShowLogoutModal(true)
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowLogoutModal(false)} />
          <div className="card animate-scale-in" style={{ position: 'relative', width: '90%', maxWidth: 400, zIndex: 101, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ef4444' }}>
              <LogOut size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Akhiri Sesi?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Anda akan keluar dari sistem. Lanjutkan?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutModal(false)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }} onClick={handleLogout}>Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Logging Out Overlay */}
      {isLoggingOut && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-spin" style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: 0.5 }}>Mengakhiri Sesi...</div>
        </div>
      )}
    </>
  )
}
