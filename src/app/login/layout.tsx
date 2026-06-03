import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke Dasbor Sistem Agen LPG untuk mengelola armada dan memonitor data pangkalan secara efisien dan real-time.',
  openGraph: {
    title: 'Masuk - Agen LPG',
    description: 'Masuk ke Dasbor Sistem Agen LPG untuk mengelola armada dan memonitor data pangkalan secara efisien dan real-time.',
  }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
