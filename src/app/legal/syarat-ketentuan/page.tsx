export const metadata = {
  title: 'Syarat dan Ketentuan',
  description: 'Pelajari aturan main, tanggung jawab, serta Syarat dan Ketentuan penggunaan Sistem Manajemen Pangkalan LPG 3Kg.',
}

export default function SyaratKetentuan() {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>Syarat dan Ketentuan</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <p>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p>
          Selamat datang di Sistem Manajemen Pangkalan LPG 3Kg ("Layanan"). Dengan mengakses dan menggunakan Layanan ini, Anda setuju untuk terikat oleh Syarat dan Ketentuan berikut.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16 }}>1. Penggunaan Layanan</h2>
        <p>
          Layanan ini dirancang khusus untuk memfasilitasi administrasi dan monitoring kepatuhan pangkalan bagi Agen LPG. Pengguna bertanggung jawab penuh atas keabsahan data yang diunggah ke dalam sistem.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16 }}>2. Kepemilikan Data dan Infrastruktur</h2>
        <p>
          Sesuai dengan hukum yang berlaku di Indonesia, Anda memahami dan menyetujui bahwa <strong>seluruh data yang Anda masukkan ke dalam sistem ini akan disimpan secara aman di dalam infrastruktur server yang dikelola oleh PT Primadev Digital Technology</strong>.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16 }}>3. Pembatasan Tanggung Jawab</h2>
        <p>
          PT Primadev Digital Technology hanya bertindak sebagai penyedia teknologi. Kami tidak bertanggung jawab atas isi data yang dikelola oleh Agen, maupun segala implikasi operasional antara Agen dengan PT Pertamina (Persero).
        </p>
      </div>
    </div>
  )
}
