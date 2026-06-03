export const metadata = {
  title: 'Kebijakan Privasi',
  description: 'Pahami Kebijakan Privasi dari PT Primadev Digital Technology dalam melindungi dan menyimpan data operasional Agen LPG Anda secara aman.',
}

export default function PrivasiPengguna() {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>Kebijakan Privasi</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <p>
          Kebijakan privasi ini menjelaskan bagaimana informasi Anda dikumpulkan, digunakan, dan dilindungi.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16 }}>1. Pengumpulan Data</h2>
        <p>
          Data yang kami kumpulkan meliputi informasi pangkalan, data identitas armada, hingga berkas dokumentasi yang Anda unggah secara sukarela untuk kepentingan operasional agen.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16 }}>2. Penyimpanan dan Keamanan</h2>
        <p>
          Demi menjamin keamanan dan ketaatan terhadap hukum Republik Indonesia, <strong>semua data tersimpan dengan enkripsi pada server milik PT Primadev Digital Technology</strong>. Kami berupaya maksimal untuk melindungi data dari akses yang tidak sah, kebocoran, atau penyalahgunaan.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16 }}>3. Pengungkapan Informasi</h2>
        <p>
          PT Primadev Digital Technology menjamin tidak akan memperjualbelikan, menyebarluaskan, atau membagikan data internal Anda kepada pihak ketiga manapun, kecuali jika diwajibkan oleh proses penegakan hukum di Indonesia berdasarkan putusan pengadilan yang sah.
        </p>
      </div>
    </div>
  )
}
