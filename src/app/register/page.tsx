'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, User, Mail, Lock, Building2, MapPin, ChevronRight, ChevronLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

type Step = 'step1' | 'step2' | 'otp' | 'success'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('step1')
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Form state
  const [form, setForm] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    konfirmasi_password: '',
    nama_agen: '',
    sold_to: '',
    wilayah: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showKonfirmasi, setShowKonfirmasi] = useState(false)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  const updateFormUpper = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value.toUpperCase() }))

  const goToStep = (next: Step, dir: 'forward' | 'back' = 'forward') => {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 280)
  }

  const validateStep1 = () => {
    if (!form.nama_lengkap.trim()) { toast.error('Nama lengkap wajib diisi'); return false }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Format email tidak valid'); return false }
    if (form.password.length < 8) { toast.error('Password minimal 8 karakter'); return false }
    if (form.password !== form.konfirmasi_password) { toast.error('Konfirmasi password tidak cocok'); return false }
    return true
  }

  const validateStep2 = () => {
    if (!form.nama_agen.trim()) { toast.error('Nama agen wajib diisi'); return false }
    if (!form.sold_to.trim()) { toast.error('Sold To wajib diisi'); return false }
    if (!form.wilayah.trim()) { toast.error('Wilayah wajib diisi'); return false }
    return true
  }

  const handleSendOTP = async () => {
    if (!validateStep2()) return
    setLoading(true)
    try {
      const res = await fetch('/api/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agreedToTerms }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal mengirim OTP', { duration: 5000 })
        return
      }
      toast.success('Kode OTP telah dikirim ke email Anda!')
      setResendCooldown(60)
      goToStep('otp', 'forward')
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Gagal mengirim ulang OTP')
        return
      }
      toast.success('Kode OTP baru telah dikirim!')
      setResendCooldown(60)
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otpValues]
    newOtp[index] = value.slice(-1)
    setOtpValues(newOtp)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otpValues]
    pasted.split('').forEach((char, i) => { newOtp[i] = char })
    setOtpValues(newOtp)
    if (pasted.length > 0) {
      otpRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otp = otpValues.join('')
    if (otp.length < 6) { toast.error('Masukkan 6 digit kode OTP'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Verifikasi gagal')
        return
      }
      goToStep('success', 'forward')
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  const slideClass = animating
    ? direction === 'forward' ? 'slide-exit-left' : 'slide-exit-right'
    : direction === 'forward' ? 'slide-enter-right' : 'slide-enter-left'

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-40px); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(40px); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        .slide-enter-right { animation: slideInRight 0.3s ease forwards; }
        .slide-enter-left { animation: slideInLeft 0.3s ease forwards; }
        .slide-exit-left { animation: slideOutLeft 0.28s ease forwards; }
        .slide-exit-right { animation: slideOutRight 0.28s ease forwards; }
        .success-anim { animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        .otp-input {
          width: 48px; height: 56px;
          text-align: center; font-size: 22px; font-weight: 700;
          border: 2px solid #e5e7eb; border-radius: 12px;
          background: var(--bg-surface); color: var(--text-primary);
          transition: all 0.2s;
          outline: none;
        }
        .otp-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
        .otp-input.filled { border-color: #16a34a; background: #f0fdf4; color: #15803d; }

        .step-indicator { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
        .step-dot { width: 28px; height: 6px; border-radius: 3px; transition: all 0.3s; }
        .step-dot.active { background: #16a34a; }
        .step-dot.done { background: #16a34a; opacity: 0.4; }
        .step-dot.inactive { background: #e5e7eb; }

        .input-icon-wrap { position: relative; }
        .input-icon-wrap .icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; display: flex; }
        .input-icon-wrap input { padding-left: 42px; }
        .input-icon-wrap .icon-right { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; padding: 0; }

        .reg-btn-primary {
          width: 100%; height: 48px;
          background: #16a34a; color: white;
          font-weight: 600; font-size: 15px;
          border-radius: 12px; border: none;
          box-shadow: 0 4px 12px rgba(22,163,74,0.25);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: all 0.2s;
        }
        .reg-btn-primary:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(22,163,74,0.3); }
        .reg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .reg-btn-secondary {
          width: 100%; height: 48px;
          background: transparent; color: var(--text-primary);
          font-weight: 500; font-size: 15px;
          border-radius: 12px; border: 2px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: all 0.2s;
        }
        .reg-btn-secondary:hover { border-color: #16a34a; color: #16a34a; }

        .form-input-reg {
          width: 100%; height: 46px;
          border: 2px solid #e5e7eb; border-radius: 10px;
          background: var(--bg-surface); color: var(--text-primary);
          font-size: 14px; padding: 0 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .form-input-reg:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
        .form-label-reg { display: block; font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>

        {/* Left Panel */}
        <div className="mobile-hidden" style={{ flex: 1.2, position: 'relative', overflow: 'hidden' }}>
          <Image src="/login_image.webp" alt="LPG Distribution" fill priority style={{ objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,80,42,0.92), rgba(22,163,74,0.25))' }} />
          <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', transform: 'translateY(-50%)' }}>
            <h1 style={{ color: 'white', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, textShadow: '0 4px 12px rgba(0,0,0,0.3)', letterSpacing: '-0.02em' }}>
              Agen LPG<br/>Monitoring Pangkalan
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 16, fontSize: 16, lineHeight: 1.6 }}>
              Daftarkan akun Agen Anda untuk mengakses sistem manajemen dan monitoring pangkalan LPG 3Kg secara terpadu.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, margin: '0 auto 12px', position: 'relative' }}>
                <Image src="/icons/favicon-96x96.png" alt="Logo" fill sizes="48px" priority style={{ objectFit: 'contain' }} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Buat Akun Baru</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Sistem Manajemen Pangkalan LPG 3Kg</p>
            </div>

            {/* Step Indicator */}
            {step !== 'success' && (
              <div className="step-indicator">
                <div className={`step-dot ${step === 'step1' ? 'active' : 'done'}`} />
                <div className={`step-dot ${step === 'step2' ? 'active' : step === 'otp' ? 'done' : 'inactive'}`} />
                <div className={`step-dot ${step === 'otp' ? 'active' : 'inactive'}`} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                  {step === 'step1' ? 'Langkah 1 dari 3' : step === 'step2' ? 'Langkah 2 dari 3' : 'Verifikasi OTP'}
                </span>
              </div>
            )}

            {/* ---- STEP 1 ---- */}
            {step === 'step1' && (
              <div className={slideClass}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>Data Diri</p>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-reg" htmlFor="nama_lengkap">Nama Lengkap</label>
                  <div className="input-icon-wrap">
                    <span className="icon"><User size={16} /></span>
                    <input id="nama_lengkap" type="text" className="form-input-reg" placeholder="MASUKKAN NAMA LENGKAP" value={form.nama_lengkap} onChange={e => updateFormUpper('nama_lengkap', e.target.value)} style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-reg" htmlFor="email">Email</label>
                  <div className="input-icon-wrap">
                    <span className="icon"><Mail size={16} /></span>
                    <input id="email" type="email" className="form-input-reg" placeholder="contoh@gmail.com" value={form.email} onChange={e => updateForm('email', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-reg" htmlFor="password">Password</label>
                  <div className="input-icon-wrap">
                    <span className="icon"><Lock size={16} /></span>
                    <input id="password" type={showPassword ? 'text' : 'password'} className="form-input-reg" style={{ paddingRight: 44 }} placeholder="Min. 8 karakter" value={form.password} onChange={e => updateForm('password', e.target.value)} />
                    <button type="button" className="icon-right" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label className="form-label-reg" htmlFor="konfirmasi">Konfirmasi Password</label>
                  <div className="input-icon-wrap">
                    <span className="icon"><Lock size={16} /></span>
                    <input id="konfirmasi" type={showKonfirmasi ? 'text' : 'password'} className="form-input-reg" style={{ paddingRight: 44 }} placeholder="Ulangi password" value={form.konfirmasi_password} onChange={e => updateForm('konfirmasi_password', e.target.value)} />
                    <button type="button" className="icon-right" onClick={() => setShowKonfirmasi(v => !v)}>{showKonfirmasi ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>

                <button className="reg-btn-primary" onClick={() => { if (validateStep1()) goToStep('step2', 'forward') }}>
                  Lanjut <ChevronRight size={18} />
                </button>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                  Sudah punya akun?{' '}
                  <Link href="/login" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Masuk</Link>
                </p>
              </div>
            )}

            {/* ---- STEP 2 ---- */}
            {step === 'step2' && (
              <div className={slideClass}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>Data Agen</p>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-reg" htmlFor="nama_agen">Nama Agen</label>
                  <div className="input-icon-wrap">
                    <span className="icon"><Building2 size={16} /></span>
                    <input id="nama_agen" type="text" className="form-input-reg" placeholder="NAMA AGEN LPG ANDA" value={form.nama_agen} onChange={e => updateFormUpper('nama_agen', e.target.value)} style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label-reg" htmlFor="sold_to">Sold To (No. Pelanggan)</label>
                  <div className="input-icon-wrap">
                    <span className="icon"><ShieldCheck size={16} /></span>
                    <input id="sold_to" type="text" className="form-input-reg" placeholder="Nomor Sold To dari Pertamina" value={form.sold_to} onChange={e => updateForm('sold_to', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label className="form-label-reg" htmlFor="wilayah">Wilayah</label>
                  <div className="input-icon-wrap">
                    <span className="icon"><MapPin size={16} /></span>
                    <input id="wilayah" type="text" className="form-input-reg" placeholder="Contoh: Jakarta Barat" value={form.wilayah} onChange={e => updateForm('wilayah', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--bg-muted)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-default)' }}>
                  <input 
                    type="checkbox" 
                    id="termsCheck" 
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', accentColor: '#16a34a' }}
                  />
                  <label htmlFor="termsCheck" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, cursor: 'pointer' }}>
                    Saya telah Membaca, Memahami, dan Menyetujui{' '}
                    <Link href="/legal/syarat-ketentuan" target="_blank" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Syarat & Ketentuan</Link>
                    {' '}dan{' '}
                    <Link href="/legal/privasi" target="_blank" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Kebijakan Privasi</Link>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="reg-btn-secondary" style={{ flex: 0.4 }} onClick={() => goToStep('step1', 'back')}>
                    <ChevronLeft size={18} />
                  </button>
                  <button className="reg-btn-primary" style={{ flex: 1 }} onClick={handleSendOTP} disabled={!agreedToTerms || loading}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Mengirim...</> : <>Kirim OTP <ChevronRight size={18} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ---- STEP OTP ---- */}
            {step === 'otp' && (
              <div className={slideClass}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Mail size={24} color="#16a34a" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Cek Email Anda</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Kode OTP 6 digit telah dikirim ke<br/>
                    <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }} onPaste={handleOtpPaste}>
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      className={`otp-input${val ? ' filled' : ''}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                <button className="reg-btn-primary" onClick={handleVerifyOTP} disabled={loading}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Memverifikasi...</> : 'Verifikasi & Buat Akun'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tidak menerima kode? </span>
                  <button
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || loading}
                    style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, color: resendCooldown > 0 ? '#9ca3af' : '#16a34a', padding: 0 }}
                  >
                    {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim Ulang'}
                  </button>
                </div>

                <button className="reg-btn-secondary" style={{ marginTop: 12 }} onClick={() => goToStep('step2', 'back')}>
                  <ChevronLeft size={16} /> Kembali
                </button>
              </div>
            )}

            {/* ---- SUCCESS ---- */}
            {step === 'success' && (
              <div className="success-anim" style={{ textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '3px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={40} color="#16a34a" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>Akun Berhasil Dibuat!</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
                  Selamat, <strong style={{ color: 'var(--text-primary)' }}>{form.nama_lengkap}</strong>!<br/>
                  Akun Anda telah aktif. Silakan login untuk mengakses dashboard.
                </p>
                <button className="reg-btn-primary" onClick={() => router.push('/login')}>
                  Menuju Halaman Login <ChevronRight size={18} />
                </button>
              </div>
            )}

          </div>


        </div>
      </div>
    </>
  )
}
