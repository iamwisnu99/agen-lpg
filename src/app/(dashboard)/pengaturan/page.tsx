'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logAktivitas } from '@/lib/db'
import type { Profile } from '@/types'
import {
  User, Save, Loader2, Key, Shield,
  Building2, AlertTriangle, Download, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getInitials } from '@/lib/utils'

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
  const [activeTab, setActiveTab] = useState<'profil' | 'sistem' | 'info'>('profil')
  const [sistemForm, setSistemForm] = useState(SISTEM_DEFAULTS)
  const [savingSistem, setSavingSistem] = useState(false)
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

      // Fallback: Jika masih kosong, ambil dari tabel agen_account via Server Action (Aman dari RLS/Key Error)
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
      })
      setForm({ full_name: userFullName, phone: userPhone })
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
      toast.success('Password berhasil diubah')
      setPasswordForm({ newPass: '', confirm: '' })
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error.message || 'Gagal mengubah password')
    } finally {
      setChangingPassword(false)
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

  const tabs = [
    { key: 'profil'   as const, label: 'Profil Admin', icon: User },
    { key: 'sistem'   as const, label: 'Sistem',       icon: Building2 },
    { key: 'info'     as const, label: 'Info Website', icon: Info },
  ]

  const unset = (val: string) => !val.trim()

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 48, borderRadius: 10, marginBottom: 24, width: 200 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }} className="stagger-children">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">Kelola profil dan konfigurasi sistem</p>
        </div>
      </div>

      {/* Profile card */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.05), rgba(34,197,94,0.02))',
          border: '1px solid rgba(22,163,74,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: 'white',
            boxShadow: '0 4px 16px rgba(22,163,74,0.3)', flexShrink: 0,
          }}>
            {getInitials(profile?.full_name || profile?.email || 'A')}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              {profile?.full_name || 'Administrator'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              {profile?.email}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px',
                background: 'rgba(22,163,74,0.1)', color: '#15803d',
                borderRadius: 99, fontSize: 11, fontWeight: 700,
                border: '1px solid rgba(22,163,74,0.2)',
              }}>
                <Shield size={11} /> Administrator
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginBottom: 24 }}>
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === t.key ? '2px solid #16a34a' : '2px solid transparent',
                background: 'none', fontSize: 13,
                fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? '#16a34a' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s', fontFamily: 'var(--font-inter)',
              }}
            >
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB: Profil ── */}
      {activeTab === 'profil' && (
        <div className="card animate-fade-in">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Informasi Profil
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text" className="form-input"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Nama lengkap Anda"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email" className="form-input"
                value={profile?.email || ''} disabled style={{ opacity: 0.6 }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email tidak dapat diubah</p>
            </div>
            <div>
              <label className="form-label">Nomor HP</label>
              <input
                type="tel" className="form-input"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="form-label">Role</label>
              <input type="text" className="form-input" value="Administrator" disabled style={{ opacity: 0.6 }} />
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Profil</>}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Info Website ── */}
      {activeTab === 'info' && (
        <div className="card animate-fade-in" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              border: '1px solid var(--border-default)', overflow: 'hidden'
            }}>
              <img src="/icons/favicon-96x96.png" alt="Logo LPG" style={{ width: 64, height: 64, objectFit: 'contain' }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--border-default)' }}>&times;</span>
            </div>

            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              border: '1px solid var(--border-default)', overflow: 'hidden'
            }}>
              <img src="/primadev.png" alt="Primadev Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
            </div>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Sistem Informasi Agen LPG
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            Aplikasi modern untuk mempermudah operasional dan manajemen Agen LPG beserta Pangkalannya.
          </p>
          
          <div style={{
            background: 'var(--bg-muted)', padding: 24, borderRadius: 16,
            display: 'inline-block', textAlign: 'left', minWidth: 300
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>Dibuat Oleh:</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', marginBottom: 16 }}>PT Primadev Digital Technology</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Versi</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>v1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Lisensi</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>Enterprise</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Sistem ── */}
      {activeTab === 'sistem' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Informasi Agen
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Nama Agen */}
              <div>
                <label className="form-label">Nama Agen</label>
                <input
                  type="text" className="form-input"
                  value={sistemForm.nama_agen}
                  onChange={e => setSistemForm(s => ({ ...s, nama_agen: e.target.value }))}
                  placeholder="Masukkan nama agen..."
                />
                {unset(sistemForm.nama_agen) && (
                  <p style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontStyle: 'italic' }}>
                    Belum Diatur
                  </p>
                )}
              </div>

              {/* Sold To */}
              <div>
                <label className="form-label">Sold To</label>
                <input
                  type="text" className="form-input"
                  value={sistemForm.sold_to}
                  onChange={e => setSistemForm(s => ({ ...s, sold_to: e.target.value }))}
                  placeholder="Kode Sold To (contoh: 1000XXXX)..."
                />
                {unset(sistemForm.sold_to) && (
                  <p style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontStyle: 'italic' }}>
                    Belum Diatur
                  </p>
                )}
              </div>

              {/* Wilayah Kerja */}
              <div>
                <label className="form-label">Wilayah Kerja</label>
                <input
                  type="text" className="form-input"
                  value={sistemForm.wilayah_kerja}
                  onChange={e => setSistemForm(s => ({ ...s, wilayah_kerja: e.target.value }))}
                  placeholder="Contoh: Jakarta Barat, DKI Jakarta..."
                />
                {unset(sistemForm.wilayah_kerja) && (
                  <p style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontStyle: 'italic' }}>
                    Belum Diatur
                  </p>
                )}
              </div>

            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSaveSistem} disabled={savingSistem}>
                {savingSistem ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Pengaturan</>}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
