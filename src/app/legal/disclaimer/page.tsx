export const metadata = {
  title: 'Disclaimer | Agen LPG',
}

export default function Disclaimer() {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em', color: '#ef4444' }}>Disclaimer (Sanggahan)</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <p>
          Melalui pemberitahuan tertulis ini, kami menegaskan posisi dan status kepemilikan platform <strong>Sistem Manajemen Pangkalan LPG 3Kg</strong>.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16 }}>Status Independensi Perangkat Lunak</h2>
        <p>
          Aplikasi ini adalah <strong>perangkat lunak independen pihak ketiga</strong> yang dirancang dan dioperasikan murni untuk membantu administrasi teknis Agen LPG (khususnya 3KG).
        </p>
        <p>
          Aplikasi ini <strong>SAMA SEKALI TIDAK</strong> berafiliasi, tidak dinaungi, tidak disponsori, dan tidak terdapat campur tangan dalam bentuk apapun dari pihak <strong>PT Pertamina (Persero)</strong> maupun entitas anak usahanya.
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 16 }}>Hak Kekayaan Intelektual</h2>
        <p>
          Seluruh baris kode (source code), desain antarmuka (UI/UX), dan infrastruktur server merupakan hak milik eksklusif dari <strong>PT Primadev Digital Technology</strong>.
        </p>
        <p>
          Setiap penggunaan logo, penamaan, atau referensi entitas luar hanya bersifat deskriptif (untuk kebutuhan internal operasional agen pengguna sistem) dan bukan sebagai representasi dukungan resmi dari entitas terkait.
        </p>
      </div>
    </div>
  )
}
