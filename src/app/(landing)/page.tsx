import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, Truck, BarChart3, ChevronRight, UserPlus, SlidersHorizontal, Activity, Lock, Smartphone, Palette, ChevronDown } from 'lucide-react'

export const metadata = {
  title: 'Agen LPG - Monitoring Pangkalan',
  description: 'Platform digital inovatif untuk mempermudah agen LPG dalam melakukan monitoring pangkalan dan armada secara real-time.'
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-default)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/icons/favicon-96x96.png" alt="Logo" width={40} height={40} unoptimized />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Agen LPG</span>
        </div>
        <Link href="/login" className="btn btn-primary" style={{ padding: '8px 24px', borderRadius: 99, fontWeight: 600 }}>
          Mulai
        </Link>
      </nav>

      {/* Hero Section Container */}
      <main style={{ flex: 1 }}>
        <div style={{ position: 'relative', overflow: 'hidden', backgroundImage: 'url(/login_image.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* Dark Overlay for readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 0 }} />
          <section style={{ padding: '80px 20px', textAlign: 'center', maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', borderRadius: 99, fontWeight: 600, fontSize: 14, marginBottom: 24, border: '1px solid rgba(74, 222, 128, 0.3)' }}>
              Sistem Manajemen Pangkalan Terpadu
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em', color: '#ffffff' }}>
              Agen LPG - System Monitoring Pangkalan
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 80, maxWidth: 600, margin: '0 auto' }}>
              Platform digital inovatif untuk mempermudah agen dalam melakukan monitoring kepatuhan pangkalan dan manajemen armada operasional secara real-time.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/login" className="btn btn-primary" style={{ padding: '10px 30px', fontSize: 16, borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginTop: '26px' }}>
                Mulai
              </Link>
            </div>
          </section>
        </div>

        {/* Features Section */}
        <section style={{ padding: '60px 20px 100px', background: 'var(--bg-muted)', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 60, letterSpacing: '-0.02em' }}>
              Tujuan Utama Sistem
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
              {/* Card 1 */}
              <div className="card" style={{ padding: 32, background: 'var(--bg-default)', borderRadius: 24, border: '1px solid var(--border-default)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ width: 56, height: 56, background: 'rgba(22, 163, 74, 0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <ShieldCheck size={28} color="#16a34a" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Manajemen Pangkalan</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Kemudahan mengelola dokumentasi wajib seperti foto APAR, Bak Tes Kebocoran, Papan Pangkalan, Gas Detector, hingga kendali penuh atas status kemitraan.
                </p>
              </div>

              {/* Card 2 */}
              <div className="card" style={{ padding: 32, background: 'var(--bg-default)', borderRadius: 24, border: '1px solid var(--border-default)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ width: 56, height: 56, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Truck size={28} color="#3b82f6" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Data Armada Kendaraan</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Pencatatan pelat nomor kendaraan operasional lengkap dengan monitoring batas waktu Pajak Tahunan dan Pajak 5 Tahun untuk memastikan kelancaran.
                </p>
              </div>

              {/* Card 3 */}
              <div className="card" style={{ padding: 32, background: 'var(--bg-default)', borderRadius: 24, border: '1px solid var(--border-default)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ width: 56, height: 56, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <BarChart3 size={28} color="#f59e0b" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Log Aktivitas Terpusat</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Lacak setiap perubahan dan aktivitas pembaruan data secara real-time untuk kebutuhan audit yang transparan, mudah, dan dapat dipertanggungjawabkan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section style={{ padding: '100px 20px', background: 'var(--bg-default)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
                Cara Kerja Sistem
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
                Tiga langkah sederhana untuk memulai digitalisasi dan pemantauan pangkalan LPG Anda.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, position: 'relative' }}>
              {/* Step 1 */}
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 80, height: 80, background: '#f0fdf4', border: '4px solid white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(22, 163, 74, 0.1)', position: 'relative', zIndex: 2 }}>
                  <UserPlus size={32} color="#16a34a" />
                  <div style={{ position: 'absolute', top: 0, right: -10, background: '#16a34a', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, border: '3px solid white' }}>1</div>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Registrasi Akun Agen</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Daftarkan akun agen Anda dengan mengisi data legal dan wilayah operasional secara cepat.</p>
              </div>

              {/* Step 2 */}
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 80, height: 80, background: '#f0fdf4', border: '4px solid white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(22, 163, 74, 0.1)', position: 'relative', zIndex: 2 }}>
                  <SlidersHorizontal size={32} color="#16a34a" />
                  <div style={{ position: 'absolute', top: 0, right: -10, background: '#16a34a', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, border: '3px solid white' }}>2</div>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Kelola Data Operasional</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Masukkan data seluruh armada kendaraan dan pangkalan LPG yang berada di bawah naungan Anda.</p>
              </div>

              {/* Step 3 */}
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 80, height: 80, background: '#f0fdf4', border: '4px solid white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(22, 163, 74, 0.1)', position: 'relative', zIndex: 2 }}>
                  <Activity size={32} color="#16a34a" />
                  <div style={{ position: 'absolute', top: 0, right: -10, background: '#16a34a', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, border: '3px solid white' }}>3</div>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Pantau Real-Time</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Lihat status kelengkapan foto pangkalan, masa berlaku pajak armada, dan log aktivitas secara real-time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section style={{ padding: '100px 20px', background: 'var(--bg-surface)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 60, alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  Mengapa Memilih Sistem Kami?
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1.6, marginBottom: 32 }}>
                  Dibuat sepenuhnya oleh pakar di <strong>PT Primadev Digital Technology</strong>, platform ini dirancang dengan standar kualitas enterprise yang menekankan pada keamanan, kecepatan, dan kenyamanan.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Lock size={24} color="#16a34a" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Keamanan Data Tingkat Tinggi</h4>
                      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Infrastruktur server terlindungi dengan sistem proteksi keamanan dan enkripsi kata sandi berlapis standar industri.</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Smartphone size={24} color="#3b82f6" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Responsif & Aksesibilitas</h4>
                      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Diakses dengan lancar dari Komputer, Laptop, Tablet, hingga Smartphone tanpa mengorbankan fungsionalitas fitur.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Palette size={24} color="#a855f7" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Desain Elegan & Intuitif</h4>
                      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Antarmuka pengguna yang dirancang untuk kemudahan tanpa perlu pelatihan khusus. Cukup klik, dan semua siap digunakan.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: 32, padding: 40, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(22, 163, 74, 0.2)' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, position: 'relative', zIndex: 1 }}>Independen & Mandiri</h3>
                <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9, position: 'relative', zIndex: 1, marginBottom: 32 }}>
                  Aplikasi perangkat lunak independen yang dirancang murni untuk membantu administrasi Agen LPG 3KG di Indonesia. Bebas intervensi dan birokrasi, fokus murni pada percepatan operasional Anda.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                  <ShieldCheck size={40} color="rgba(255,255,255,0.8)" />
                  <span style={{ fontSize: 18, fontWeight: 700 }}>PT Primadev Digital Technology</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '100px 20px', background: 'var(--bg-default)' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .faq-details summary::-webkit-details-marker { display: none; }
            .faq-details[open] .faq-icon { transform: rotate(180deg); }
            .faq-icon { transition: transform 0.3s ease; }
          `}} />
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
                Pertanyaan yang Sering Diajukan
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 18 }}>
                Informasi tambahan untuk membantu Anda memahami sistem kami lebih baik.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <details className="faq-details" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '20px 24px', cursor: 'pointer' }}>
                <summary style={{ fontSize: 18, fontWeight: 700, outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Apakah sistem ini buatan PT Pertamina?
                  <ChevronDown size={20} className="faq-icon" color="#9ca3af" />
                </summary>
                <div style={{ marginTop: 16, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: 16, paddingTop: 16, borderTop: '1px solid var(--border-default)' }}>
                  Tidak. Aplikasi ini dikembangkan sepenuhnya oleh <strong>PT Primadev Digital Technology</strong> sebagai perusahaan independen. Perangkat lunak ini murni ditujukan untuk membantu mempermudah administrasi internal Agen LPG tanpa afiliasi langsung dengan Pertamina.
                </div>
              </details>
              
              <details className="faq-details" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '20px 24px', cursor: 'pointer' }}>
                <summary style={{ fontSize: 18, fontWeight: 700, outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Apakah data Agen dan Pangkalan saya aman?
                  <ChevronDown size={20} className="faq-icon" color="#9ca3af" />
                </summary>
                <div style={{ marginTop: 16, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: 16, paddingTop: 16, borderTop: '1px solid var(--border-default)' }}>
                  Sangat aman. Data Anda disimpan di server terenkripsi dengan standar keamanan tinggi. Anda memiliki kendali penuh atas data Anda, dan kami melindungi privasi data sesuai hukum yang berlaku di Indonesia melalui Kebijakan Privasi yang mengikat.
                </div>
              </details>

              <details className="faq-details" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '20px 24px', cursor: 'pointer' }}>
                <summary style={{ fontSize: 18, fontWeight: 700, outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Bagaimana jika saya menemui kendala teknis?
                  <ChevronDown size={20} className="faq-icon" color="#9ca3af" />
                </summary>
                <div style={{ marginTop: 16, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: 16, paddingTop: 16, borderTop: '1px solid var(--border-default)' }}>
                  Tim dukungan teknis PT Primadev Digital Technology siap membantu Anda. Anda dapat menghubungi kami melalui Email atau WhatsApp resmi yang tertera di bagian paling bawah (Footer) halaman ini.
                </div>
              </details>

              <details className="faq-details" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '20px 24px', cursor: 'pointer' }}>
                <summary style={{ fontSize: 18, fontWeight: 700, outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Apakah saya bisa menghapus Akun beserta seluruh data yang telah saya registrasi dan ditambahkan sebelumnya?
                  <ChevronDown size={20} className="faq-icon" color="#9ca3af" />
                </summary>
                <div style={{ marginTop: 16, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: 16, paddingTop: 16, borderTop: '1px solid var(--border-default)' }}>
                  Bisa. Anda bisa menghapus akun pada menu Pengaturan &gt; Sistem &gt; Hapus Akun. Ketika akun di hapus maka seluruh data Pangkalan dan Kendaran Armada akan terhapus secara permanen dan tidak dapat dikembalikan.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section style={{ padding: '80px 20px', background: 'var(--bg-default)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 32, padding: '60px 40px', textAlign: 'center', border: '2px solid #bbf7d0', boxShadow: '0 20px 40px rgba(22, 163, 74, 0.05)' }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 20, color: '#166534', letterSpacing: '-0.02em' }}>
              Siap Meningkatkan Efisiensi Agen Anda?
            </h2>
            <p style={{ color: '#15803d', fontSize: 18, marginBottom: 40, maxWidth: 600, margin: '0 auto' }}>
              Bergabunglah sekarang dan rasakan kemudahan mengelola pangkalan serta armada operasional dalam satu platform yang terintegrasi.
            </p>
            <Link href="/register" className="btn btn-primary" style={{ padding: '18px 48px', fontSize: 18, borderRadius: 16, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 25px rgba(22, 163, 74, 0.3)' }}>
              Daftar Sekarang Secara Gratis <ChevronRight size={22} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: '60px 20px 40px', background: '#111', color: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 40, marginBottom: 40 }}>

          {/* Brand & Credit */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Image src="/primadev.png" alt="PT Primadev Digital Technology" width={140} height={38} unoptimized style={{ filter: 'brightness(0) invert(1)', marginBottom: 20, width: 120, height: 'auto' }} />
            <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6 }}>
              Dibuat dan dirancang sepenuhnya oleh <strong>PT Primadev Digital Technology</strong>. Memberikan solusi digital terdepan untuk efisiensi bisnis Anda.
            </p>
          </div>

          {/* Legal Links */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/legal/syarat-ketentuan" style={{ color: '#ccc', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-white">Syarat dan Ketentuan</Link>
              <Link href="/legal/persetujuan-pengguna" style={{ color: '#ccc', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-white">Persetujuan Pengguna</Link>
              <Link href="/legal/privasi" style={{ color: '#ccc', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-white">Privasi Pengguna</Link>
              <Link href="/legal/disclaimer" style={{ color: '#ccc', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-white">Disclaimer</Link>
            </div>
          </div>

          {/* Contact Us */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Hubungi Kami</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="mailto:wisnu.bussines99@gmail.com" style={{ color: '#ccc', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 8 }} className="hover:text-white">
                📧 wisnu.bussines99@gmail.com
              </a>
              <a href="https://wa.me/6283863867266" target="_blank" rel="noopener noreferrer" style={{ color: '#ccc', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 8 }} className="hover:text-white">
                💬 0838 6386 7266 (WhatsApp)
              </a>
              <a href="https://apps-primadev.netlify.app" target="_blank" rel="noopener noreferrer" style={{ color: '#ccc', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 8 }} className="hover:text-white">
                🌐 Website Resmi
              </a>
            </div>
          </div>

        </div>

        <div style={{ textAlign: 'center', color: '#666', fontSize: 13 }}>
          &copy; {new Date().getFullYear()} Agen LPG | All Rights Reserved
        </div>
      </footer>
    </div>
  )
}
