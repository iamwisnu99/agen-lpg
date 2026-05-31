import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import { PwaRegister } from '@/components/PwaRegister'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://agen-lpg.netlify.app'),
  title: {
    default: 'Agen LPG',
    template: 'Agen LPG - %s',
  },
  description: 'Sistem Manajemen Data Pangkalan LPG 3Kg – Agen LPG Jakarta Barat. Kelola data pangkalan, laporan harian, dan monitoring penyaluran dengan efisien.',
  keywords: ['LPG', 'pangkalan', 'agen lpg', 'manajemen', 'Jakarta Barat', 'cahaya wanodya sejati', 'sistem LPG 3kg', 'monitoring lpg'],
  authors: [{ name: 'Agen LPG Jakarta Barat' }],
  creator: 'PrimaDev',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://agen-lpg.netlify.app',
    title: 'Agen LPG - Sistem Manajemen Pangkalan 3Kg',
    description: 'Aplikasi manajemen dan monitoring pangkalan LPG 3Kg terpadu untuk wilayah Jakarta Barat.',
    siteName: 'Agen LPG',
    images: [
      {
        url: '/icons/favicon-96x96.png',
        width: 96,
        height: 96,
        alt: 'Agen LPG Logo',
      }
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Agen LPG - Sistem Manajemen Pangkalan 3Kg',
    description: 'Aplikasi manajemen dan monitoring pangkalan LPG 3Kg terpadu untuk wilayah Jakarta Barat.',
    images: ['/icons/favicon-96x96.png'],
  },
  icons: {
    icon: [
      { url: '/icons/favicon.ico' },
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' }
    ]
  },
  manifest: '/icons/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#16a34a' },
    { media: '(prefers-color-scheme: dark)', color: '#15803d' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <PwaRegister />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid var(--toast-border)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'var(--font-inter)',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#fff' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
