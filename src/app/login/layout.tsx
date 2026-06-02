import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Masuk ke Dasbor Sistem Agen LPG untuk mengelola dan memonitor data pangkalan secara efisien.',
  openGraph: {
    title: 'Login - Agen LPG',
    description: 'Masuk ke Dasbor Sistem Agen LPG untuk mengelola dan memonitor data pangkalan secara efisien.',
  }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
