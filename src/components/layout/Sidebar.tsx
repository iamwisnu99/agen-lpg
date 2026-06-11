'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Settings,
  LogOut,
  User,
  Truck,
  FileText,
  ChevronDown,
  ClipboardList,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '@/components/providers/AppProvider'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  subItems?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Peta Monitoring', href: '/peta', icon: MapPin },
  { label: 'Data Pangkalan', href: '/pangkalan', icon: Building2 },
  { label: 'Data Armada', href: '/armada', icon: Truck },
  { 
    label: 'Laporan DO', 
    href: '/laporan-do', 
    icon: FileText,
    subItems: [
      { label: 'Input DO', href: '/laporan-do/input' },
      { label: 'Penebusan', href: '/laporan-do/penebusan' }
    ]
  },
  { label: 'Log Aktivitas', href: '/aktivitas', icon: ClipboardList },
]

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const { user, profile, agenData } = useApp()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/laporan-do': pathname.startsWith('/laporan-do')
  })

  // Derive display values from context
  let userName = 'Admin'
  if (profile?.full_name) userName = profile.full_name
  else if (agenData?.nama_lengkap) userName = agenData.nama_lengkap
  else if (user?.email) userName = user.email

  const namaAgen = agenData?.nama_agen || ''
  const soldTo = agenData?.sold_to || ''

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    toast.success('Berhasil logout')
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/laporan-do') return false // parent menu itself isn't a direct page usually
    return pathname.startsWith(href)
  }

  const toggleExpanded = (href: string) => {
    setExpandedMenus(prev => ({ ...prev, [href]: !prev[href] }))
  }

  const SidebarContent = (
    <aside className={cn('sidebar', mobileOpen && 'sidebar-mobile-open')}>
      {/* Mobile close button space (optional, we can just use overlay) */}
      {/* Logo */}
      <div className="sidebar-logo" style={{ flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '32px 16px 24px' }}>
        <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Image src="/icons/favicon-96x96.png" alt="Logo CWS" fill sizes="96px" priority style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)', lineHeight: 1.5, wordWrap: 'break-word' }}>
            {soldTo ? `Sold To - ${soldTo}` : 'Agen LPG'}
          </div>
          {namaAgen && (
            <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)', wordWrap: 'break-word' }}>
              {namaAgen}
            </div>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu Utama</div>

        {navItems.map((item) => {
          const Icon = item.icon
          
          if (item.subItems) {
            const isExpanded = expandedMenus[item.href]
            return (
              <div key={item.href}>
                <button
                  className={cn('nav-item', pathname.startsWith(item.href) && 'active')}
                  onClick={() => toggleExpanded(item.href)}
                  style={{ width: '100%', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon size={20} className="nav-item-icon" style={{ margin: 0 }} />
                    <span className="nav-item-label">{item.label}</span>
                  </div>
                  <ChevronDown size={16} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateRows: isExpanded ? '1fr' : '0fr', 
                    transition: 'grid-template-rows 0.25s ease-out',
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div style={{ overflow: 'hidden', transition: 'opacity 0.25s ease-out' }}>
                    <div style={{ paddingLeft: 36, marginTop: 4, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {item.subItems.map(subItem => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn('nav-item', isActive(subItem.href) && 'active')}
                          style={{ padding: '8px 12px', fontSize: 14 }}
                          onClick={onClose}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-item', isActive(item.href) && 'active')}
              onClick={onClose}
            >
              <Icon size={20} className="nav-item-icon" />
              <span className="nav-item-label">{item.label}</span>
            </Link>
          )
        })}

        <div className="flex-1" />

        <div className="nav-section-label" style={{ marginTop: 8 }}>Pengaturan</div>
        <Link
          href="/pengaturan"
          className={cn('nav-item', isActive('/pengaturan') && 'active')}
          onClick={onClose}
        >
          <Settings size={20} className="nav-item-icon" />
          <span className="nav-item-label">Pengaturan</span>
        </Link>
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-default)' }}>
        <div style={{
          padding: '10px 12px',
          borderRadius: 10,
          background: 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'white',
          }}>
            {userName.slice(0, 1).toUpperCase() || <User size={16} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrator</div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="btn btn-ghost btn-icon"
            title="Logout"
            style={{ flexShrink: 0, color: 'var(--text-muted)' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="md-hidden"
          style={{
            position: 'fixed', inset: 0, zIndex: 35,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={onClose}
        />
      )}
      {SidebarContent}

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
