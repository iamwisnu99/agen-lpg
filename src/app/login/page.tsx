'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email dan password harus diisi')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login')) {
          toast.error('Email atau password salah')
        } else {
          toast.error(error.message)
        }
        return
      }

      toast.success('Login berhasil! Selamat datang.')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Left Panel (Hidden on Mobile) */}
      <div className="mobile-hidden" style={{ flex: 1.2, position: 'relative', overflow: 'hidden' }}>
        <Image
          src="/login_image.webp"
          alt="LPG Distribution"
          fill
          priority
          style={{ objectFit: 'cover' }}
        />
        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(13, 80, 42, 0.9), rgba(22, 163, 74, 0.3))'
          }}
        />

        {/* Text Overlay */}
        <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', transform: 'translateY(-50%)' }}>
          <h1
            style={{
              color: 'white',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              textShadow: '0 4px 12px rgba(0,0,0,0.3)',
              letterSpacing: '-0.02em'
            }}
          >
            Agen LPG<br />Monitoring Pangkalan
          </h1>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-surface)', position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 96, height: 96, margin: '0 auto 16px', position: 'relative' }}>
              <Image src="/icons/favicon-96x96.png" alt="Agen LPG Logo" fill sizes="96px" priority style={{ objectFit: 'contain' }} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Masuk ke Akun
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="email" style={{ fontSize: 13, marginBottom: 8, display: 'block', color: 'var(--text-primary)', fontWeight: 500 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex' }}>
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  style={{ paddingLeft: 42, height: 46, borderRadius: 10 }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="password" style={{ fontSize: 13, marginBottom: 8, display: 'block', color: 'var(--text-primary)', fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex' }}>
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingLeft: 42, paddingRight: 44, height: 46, borderRadius: 10 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid #d1d5db', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Ingat Saya</span>
              </label>

              <a href="#" style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
                Lupa Kata Sandi?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn"
              style={{
                width: '100%',
                height: 48,
                background: '#16a34a',
                color: 'white',
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 10,
                border: 'none',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>

          {/* Register Link */}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Belum punya akun?{' '}
            <a href="/register" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Daftar Sekarang</a>
          </p>

        </div>

        {/* Footer absolute to bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          <p>© {new Date().getFullYear()} Agen LPG. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  )
}
