export const metadata = {
  title: 'Persetujuan Pengguna | Agen LPG',
}

export default function PersetujuanPengguna() {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>Persetujuan Pengguna</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <p>
          Melalui dokumen ini, Anda selaku Pengguna (Admin Agen LPG) menyatakan persetujuan secara sadar dan mengikat secara hukum terhadap poin-poin berikut:
        </p>
        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <li>
            <strong>Penyimpanan Data:</strong> Anda menyetujui bahwa seluruh data yang diunggah ke dalam sistem, termasuk namun tidak terbatas pada informasi pangkalan, data armada, dan dokumentasi foto, <strong>disimpan di server yang dimiliki dan dikelola oleh PT Primadev Digital Technology</strong>.
          </li>
          <li>
            <strong>Tujuan Penggunaan:</strong> Penggunaan data ini semata-mata ditujukan untuk mendukung kelancaran operasional administrasi Anda.
          </li>
          <li>
            <strong>Kepatuhan Hukum:</strong> Persetujuan ini dibuat berdasarkan ketentuan hukum mengenai perlindungan data pribadi dan transaksi elektronik yang berlaku di yurisdiksi Republik Indonesia, guna melindungi kedua belah pihak dari tuntutan yang tidak berdasar.
          </li>
        </ul>
      </div>
    </div>
  )
}
