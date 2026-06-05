'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logAktivitas } from '@/lib/db'
import type { Profile } from '@/types'
import {
  User, Save, Loader2, Key, Shield,
  Building2, AlertTriangle, Info, Trash2, Bell, Lock, Activity, CheckCircle2, ClipboardList, Upload, Image as ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getInitials } from '@/lib/utils'
import { getFallbackProfileData, saveSystemSettingsData, sendPasswordChangeEmail } from '@/app/actions'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'

const SISTEM_DEFAULTS = {
  nama_agen: '',
  sold_to: '',
  wilayah_kerja: '',
}

export default function PengaturanPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteSoldTo, setDeleteSoldTo] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan' | 'sistem' | 'info' | 'kop_surat'>('profil')
  const [sistemForm, setSistemForm] = useState(SISTEM_DEFAULTS)
  const [savingSistem, setSavingSistem] = useState(false)
  
  // Dummy Toggles
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifBrowser, setNotifBrowser] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  
  // Kop Surat State
  const [kopForm, setKopForm] = useState({
    kop_nama_perusahaan: '',
    kop_alamat: '',
    kop_kontak: '',
    kop_logo_base64: ''
  })
  const [savingKop, setSavingKop] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      let userFullName = profileData?.full_name || user.user_metadata?.full_name || ''
      const userEmail = user.email || profileData?.email || ''
      const userPhone = profileData?.phone || ''

      if (userEmail) {
        const fallbackData = await getFallbackProfileData(userEmail)
        if (fallbackData) {
          if (!userFullName) userFullName = fallbackData.nama_lengkap
          
          setSistemForm({
            nama_agen: fallbackData.nama_agen || '',
            sold_to: fallbackData.sold_to || '',
            wilayah_kerja: fallbackData.wilayah || '',
          })
        }
      }

      setProfile({
        id: user.id,
        full_name: userFullName,
        email: userEmail,
        phone: userPhone,
        role: user.user_metadata?.role || 'admin',
        avatar_url: profileData?.avatar_url || null,
        email_notif: profileData?.email_notif ?? true,
        browser_notif: profileData?.browser_notif ?? false,
        created_at: profileData?.created_at || '',
        updated_at: profileData?.updated_at || '',
      })
      setNotifEmail(profileData?.email_notif ?? true)
      setNotifBrowser(profileData?.browser_notif ?? false)
      setForm({ full_name: userFullName, phone: userPhone })
      setKopForm({
        kop_nama_perusahaan: profileData?.kop_nama_perusahaan || '',
        kop_alamat: profileData?.kop_alamat || '',
        kop_kontak: profileData?.kop_kontak || '',
        kop_logo_base64: profileData?.kop_logo_base64 || ''
      })
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('profiles')
        .update({ full_name: form.full_name, phone: form.phone })
        .eq('id', user!.id)
      setProfile(p => p ? { ...p, full_name: form.full_name, phone: form.phone } : p)
      toast.success('Profil berhasil diperbarui')
    } catch {
      toast.error('Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.newPass || passwordForm.newPass.length < 8) {
      toast.error('Password baru minimal 8 karakter')
      return
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
      if (error) throw error
      await logAktivitas({ aksi: 'edit', entitas: 'profil', entitas_nama: 'Ubah Password' })
      
      // Send Email Notification
      if (profile?.email && profile?.full_name) {
        await sendPasswordChangeEmail(profile.email, profile.full_name)
      }

      toast.success('Password berhasil diubah. Email pemberitahuan telah dikirim.')
      setPasswordForm({ newPass: '', confirm: '' })
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error.message || 'Gagal mengubah password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleToggleEmail = async (val: boolean) => {
    setNotifEmail(val)
    if (profile) {
      await supabase.from('profiles').update({ email_notif: val }).eq('id', profile.id)
      toast.success(val ? 'Peringatan email diaktifkan' : 'Peringatan email dinonaktifkan')
    }
  }

  const handleToggleBrowser = async (val: boolean) => {
    if (val) {
      if (!("Notification" in window)) {
        toast.error("Browser Anda tidak mendukung notifikasi")
        return
      }
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setNotifBrowser(true)
        if (profile) await supabase.from('profiles').update({ browser_notif: true }).eq('id', profile.id)
        toast.success("Notifikasi browser diaktifkan")
        new Notification("Sistem Agen LPG", { body: "Notifikasi browser berhasil diaktifkan!" })
      } else {
        setNotifBrowser(false)
        toast.error("Izin notifikasi ditolak oleh browser")
      }
    } else {
      setNotifBrowser(false)
      if (profile) await supabase.from('profiles').update({ browser_notif: false }).eq('id', profile.id)
      toast.success("Notifikasi browser dinonaktifkan")
    }
  }

  const handleSaveSistem = async () => {
    if (!profile?.email) return
    setSavingSistem(true)
    const success = await saveSystemSettingsData(profile.email, {
      nama_agen: sistemForm.nama_agen,
      sold_to: sistemForm.sold_to,
      wilayah: sistemForm.wilayah_kerja,
    })
    
    if (success) {
      toast.success('Pengaturan sistem berhasil disimpan')
    } else {
      toast.error('Gagal menyimpan pengaturan sistem')
    }
    setSavingSistem(false)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Kompres ukuran gambar (Max height 120px untuk logo PDF)
        const targetHeight = 120
        const scale = targetHeight / img.height
        const targetWidth = img.width * scale

        canvas.width = targetWidth
        canvas.height = targetHeight
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Gunakan PNG agar background transparan tetap terjaga
        let dataUrl = canvas.toDataURL('image/png')
        
        // Cek ukuran hasil kompresi (dalam KB)
        const kbSize = Math.round((dataUrl.length * 0.75) / 1024)
        if (kbSize > 100) {
          // Jika masih > 100kb, paksa kompres ke JPEG kualitas rendah
          dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        }
        
        setKopForm(prev => ({ ...prev, kop_logo_base64: dataUrl }))
        toast.success(`Logo berhasil dikompresi (~${Math.round((dataUrl.length * 0.75) / 1024)}KB)`)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSaveKopSurat = async () => {
    if (!profile) return
    setSavingKop(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(kopForm)
        .eq('id', profile.id)
      
      if (error) throw error
      toast.success('Kop Surat berhasil disimpan')
    } catch (e) {
      toast.error('Gagal menyimpan Kop Surat')
    } finally {
      setSavingKop(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteSoldTo !== sistemForm.sold_to) {
      toast.error('Kode Sold To yang Anda masukkan tidak sesuai.')
      return
    }

    setDeletingAccount(true)
    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' })
      const resData = await response.json()
      
      if (resData.success) {
        toast.success(resData.message || 'Akun berhasil dihapus.')
        await supabase.auth.signOut()
        router.push('/login')
      } else {
        toast.error(resData.message || 'Gagal menghapus akun.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Terjadi kesalahan saat menghapus akun.')
    } finally {
      setDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }

  const tabs = [
    { key: 'profil'   as const, label: 'Profil Admin', icon: User, desc: 'Informasi data diri Anda' },
    { key: 'keamanan' as const, label: 'Keamanan',     icon: Shield, desc: 'Sandi & preferensi' },
    { key: 'sistem'   as const, label: 'Sistem Agen',  icon: Building2, desc: 'Data operasional agen' },
    { key: 'kop_surat'as const, label: 'Kop Surat (PDF)', icon: ClipboardList, desc: 'Logo & identitas PDF' },
    { key: 'info'     as const, label: 'Tentang',      icon: Info, desc: 'Versi & detail aplikasi' },
  ]

  const unset = (val: string) => !val.trim()

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 48, borderRadius: 10, marginBottom: 24, width: 200 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 32 }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <style jsx>{`
        @media (max-width: 768px) {
          .settings-layout {
            grid-template-columns: 1fr !important;
          }
          .sidebar-nav {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .sidebar-nav button {
            min-width: 200px;
          }
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--border-default);
          transition: .3s;
          border-radius: 34px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px; width: 18px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-color: #16a34a;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        
        /* Mobile fixes for Info tab */
        .info-card { padding: 48px; }
        .info-badges { display: flex; justify-content: center; gap: 16px; }
        @media (max-width: 600px) {
          .info-card { padding: 24px 16px !important; }
          .info-title { font-size: 22px !important; }
          .info-desc { font-size: 14px !important; margin-bottom: 24px !important; }
          .info-badges { flex-direction: column; width: 100%; gap: 12px; }
        }
      `}</style>

      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">Sesuaikan pengalaman dan keamanan sistem Anda</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }} className="settings-layout">
        
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="sidebar-nav">
          {/* Profile Quick Summary */}
          <div style={{ padding: '0 8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'white',
              flexShrink: 0,
            }}>
              {getInitials(profile?.full_name || profile?.email || 'A')}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {profile?.full_name || 'Admin'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Administrator
              </div>
            </div>
          </div>

          {tabs.map(t => {
            const Icon = t.icon
            const isActive = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ 
                  width: 36, height: 36, borderRadius: 10, 
                  background: isActive ? 'rgba(22,163,74,0.1)' : 'var(--bg-muted)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? '#16a34a' : 'var(--text-muted)'
                }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          
          {/* ── TAB: Profil ── */}
          {activeTab === 'profil' && (
            <div className="card animate-fade-in" style={{ padding: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>
                Informasi Pribadi
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Nama Lengkap</label>
                    <input
                      type="text" className="form-input"
                      value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Nama lengkap Anda"
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Alamat Email</label>
                    <input
                      type="email" className="form-input"
                      value={profile?.email || ''} disabled style={{ opacity: 0.6, background: 'var(--bg-muted)' }}
                    />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Shield size={12} /> Email terkunci sebagai identitas utama
                    </p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Nomor WhatsApp / HP</label>
                    <input
                      type="tel" className="form-input"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="Contoh: 08123456789"
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ padding: '12px 24px' }}>
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={18} /> Simpan Perubahan</>}
                </button>
              </div>
            </div>
          )}

          {/* ── TAB: Keamanan ── */}
          {activeTab === 'keamanan' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Ganti Password
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
                  Kami menyarankan Anda menggunakan password yang kuat dan tidak digunakan di situs lain.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="form-label">Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="password" className="form-input"
                        value={passwordForm.newPass}
                        onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))}
                        placeholder="Minimal 8 karakter"
                        style={{ paddingLeft: 42 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Konfirmasi Password Baru</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="password" className="form-input"
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                        placeholder="Ulangi password baru"
                        style={{ paddingLeft: 42 }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <button className="btn btn-secondary" onClick={handleChangePassword} disabled={changingPassword}>
                    {changingPassword ? <><Loader2 size={16} className="animate-spin" /> Mengubah...</> : 'Perbarui Password'}
                  </button>
                </div>
              </div>

              {/* Preferensi Toggles */}
              <div className="card" style={{ padding: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>
                  Preferensi & Notifikasi
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Peringatan Email</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Dapatkan email saat dokumen (Pajak/APAR) hampir kedaluwarsa.</div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifEmail} onChange={(e) => handleToggleEmail(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div style={{ height: 1, background: 'var(--border-default)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Notifikasi Browser</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Peringatan pop-up saat aplikasi terbuka.</div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={notifBrowser} onChange={(e) => handleToggleBrowser(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  {/*
                  <div style={{ height: 1, background: 'var(--border-default)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Mode Gelap (Dark Mode)</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Ubah tema dashboard menjadi gelap.</div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  */}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Sistem ── */}
          {activeTab === 'sistem' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
              <div className="card" style={{ padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                      Konfigurasi Bisnis
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                      Data resmi keagenan untuk ditampilkan pada laporan.
                    </p>
                  </div>
                  <div style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.1)', color: '#2563eb', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={14} /> Sistem Aktif
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                  <div>
                    <label className="form-label">Nama Agen Resmi</label>
                    <input
                      type="text" className="form-input"
                      value={sistemForm.nama_agen}
                      onChange={e => setSistemForm(s => ({ ...s, nama_agen: e.target.value }))}
                      placeholder="Masukkan nama agen..."
                    />
                    {unset(sistemForm.nama_agen) && (
                      <p style={{ fontSize: 12, color: '#d97706', marginTop: 6, fontStyle: 'italic', display: 'flex', gap: 4, alignItems: 'center' }}><AlertTriangle size={12}/> Belum Diatur</p>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label className="form-label">Kode Sold To</label>
                      <input
                        type="text" className="form-input"
                        value={sistemForm.sold_to}
                        onChange={e => setSistemForm(s => ({ ...s, sold_to: e.target.value }))}
                        placeholder="Contoh: 1000XXXX"
                      />
                    </div>
                    <div>
                      <label className="form-label">Cakupan Wilayah</label>
                      <input
                        type="text" className="form-input"
                        value={sistemForm.wilayah_kerja}
                        onChange={e => setSistemForm(s => ({ ...s, wilayah_kerja: e.target.value }))}
                        placeholder="Contoh: Kota Semarang"
                      />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSaveSistem} disabled={savingSistem} style={{ padding: '12px 24px' }}>
                    {savingSistem ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={18} /> Terapkan Konfigurasi</>}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)', padding: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ef4444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={20} /> Zona Berbahaya
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                  Menghapus akun akan memusnahkan secara permanen seluruh data Anda (Profil, Armada, Pangkalan, Foto, dan Log Aktivitas) dari server. Tindakan ini <strong>mutlak tidak dapat dibatalkan</strong>.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn btn-ghost"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px'
                  }}
                >
                  <Trash2 size={18} /> Saya Mengerti, Hapus Akun
                </button>
              </div>
            </div>
          )}

          {/* ── TAB: Kop Surat ── */}
          {activeTab === 'kop_surat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
              <div className="card" style={{ padding: 32 }}>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Pengaturan Kop Surat Dokumen</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                    Identitas ini akan otomatis dicetak pada bagian atas (*Header*) setiap kali Anda mengekspor laporan ke format PDF.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                  
                  {/* Upload Logo */}
                  <div style={{ padding: 24, borderRadius: 12, border: '2px dashed var(--border-default)', background: 'var(--bg-muted)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      {kopForm.kop_logo_base64 ? (
                        <img src={kopForm.kop_logo_base64} alt="Logo" style={{ maxHeight: 80, objectFit: 'contain', background: 'white', padding: 8, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                    <label htmlFor="logo-upload" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Upload size={16} /> Pilih Logo Perusahaan
                    </label>
                    <input id="logo-upload" type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleLogoUpload} />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                      Gambar akan otomatis dikompresi (Resize max height 120px). Sangat disarankan format PNG transparan.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    <div>
                      <label className="form-label">Nama Perusahaan (Kop Atas)</label>
                      <input
                        type="text" className="form-input"
                        value={kopForm.kop_nama_perusahaan}
                        onChange={e => setKopForm(s => ({ ...s, kop_nama_perusahaan: e.target.value.toUpperCase() }))}
                        placeholder="PT. AGEN GAS LESTARI"
                      />
                    </div>
                    <div>
                      <label className="form-label">Alamat Lengkap</label>
                      <input
                        type="text" className="form-input"
                        value={kopForm.kop_alamat}
                        onChange={e => setKopForm(s => ({ ...s, kop_alamat: e.target.value }))}
                        placeholder="Jl. Merdeka No.123, Kel. Sukamaju, Kec. Majujaya, Kota Bandung"
                      />
                    </div>
                    <div>
                      <label className="form-label">Kontak (Telp / Email / Website)</label>
                      <input
                        type="text" className="form-input"
                        value={kopForm.kop_kontak}
                        onChange={e => setKopForm(s => ({ ...s, kop_kontak: e.target.value }))}
                        placeholder="Telp: (022) 123456 | Email: info@agenlestari.com"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Preview Box */}
                <div style={{ marginTop: 32, padding: 24, border: '1px solid var(--border-default)', borderRadius: 12, background: 'white' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16, letterSpacing: 1 }}>Preview Kop Surat PDF</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {kopForm.kop_logo_base64 && (
                      <img src={kopForm.kop_logo_base64} alt="Preview Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />
                    )}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'black', textTransform: 'uppercase' }}>{kopForm.kop_nama_perusahaan || 'NAMA PERUSAHAAN'}</div>
                      <div style={{ fontSize: 13, color: '#333', marginTop: 4 }}>{kopForm.kop_alamat || 'Alamat Perusahaan'}</div>
                      <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{kopForm.kop_kontak || 'Kontak Perusahaan'}</div>
                    </div>
                    {kopForm.kop_logo_base64 && (
                      <div style={{ width: 70 }} /> /* Spacer for centering */
                    )}
                  </div>
                  <div style={{ height: 2, background: 'black', width: '100%', marginTop: 12 }} />
                  <div style={{ height: 1, background: 'black', width: '100%', marginTop: 2 }} />
                </div>

                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSaveKopSurat} disabled={savingKop} style={{ padding: '12px 24px' }}>
                    {savingKop ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={18} /> Simpan Kop Surat</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Info Website ── */}
          {activeTab === 'info' && (
            <div className="card animate-fade-in info-card" style={{ textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'linear-gradient(135deg, rgba(22,163,74,0.1), transparent)', borderRadius: '50%', zIndex: 0 }} />
              <div style={{ position: 'absolute', bottom: -100, left: -50, width: 300, height: 300, background: 'linear-gradient(to top right, rgba(59,130,246,0.05), transparent)', borderRadius: '50%', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: 24,
                    background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    border: '1px solid var(--border-default)'
                  }}>
                    <Image src="/icons/favicon-96x96.png" alt="Logo LPG" width={64} height={64} style={{ objectFit: 'contain' }} />
                  </div>
                  
                  <div style={{ color: 'var(--border-default)' }}>
                    <XIcon />
                  </div>

                  <div style={{
                    width: 90, height: 90, borderRadius: 24,
                    background: '#1a1a1a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                  }}>
                    <Image src="/primadev-white.png" alt="Primadev Logo" width={64} height={64} style={{ objectFit: 'contain' }} />
                  </div>
                </div>
                
                <h2 className="info-title" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Sistem Informasi Agen LPG
                </h2>
                <p className="info-desc" style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.6 }}>
                  Infrastruktur digital modern yang dirancang untuk merampingkan manajemen armada, pangkalan, dan operasional keagenan gas LPG.
                </p>
                
                <div className="info-badges">
                  <div style={{ background: 'var(--bg-muted)', padding: '16px 24px', borderRadius: 16, textAlign: 'left', minWidth: 200, border: '1px solid var(--border-default)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Versi Sistem</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>v1.2.0-stable</div>
                  </div>
                  <div style={{ background: 'var(--bg-muted)', padding: '16px 24px', borderRadius: 16, textAlign: 'left', minWidth: 200, border: '1px solid var(--border-default)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Lisensi</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>Enterprise Pro</div>
                  </div>
                </div>
                
                <div style={{ marginTop: 48, fontSize: 14, color: 'var(--text-muted)' }}>
                  Dikembangkan dengan ❤️ oleh <strong style={{ color: 'var(--text-primary)' }}>PT Primadev Digital Technology</strong>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={showDeleteModal}
        title="Hapus Akun Permanen?"
        description="Peringatan keras: Anda akan menghapus akun beserta SELURUH data pangkalan, armada, dan riwayat yang Anda miliki. Untuk mengonfirmasi, ketikkan Sold To akun ini di bawah."
        itemName={`Ketik: ${sistemForm.sold_to}`}
        loading={deletingAccount}
        confirmDisabled={deleteSoldTo !== sistemForm.sold_to}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeleteSoldTo('')
        }}
      >
        <div style={{ marginTop: 8 }}>
          <label className="form-label" style={{ fontSize: 13, marginBottom: 8 }}>Masukkan Kode Sold To</label>
          <input
            type="text"
            className="form-input"
            placeholder={sistemForm.sold_to}
            value={deleteSoldTo}
            onChange={(e) => setDeleteSoldTo(e.target.value)}
            style={{ textAlign: 'center', fontWeight: 'bold' }}
          />
        </div>
      </DeleteConfirmModal>

    </div>
  )
}

function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}
