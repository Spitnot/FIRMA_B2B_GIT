import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Backend B2B',
  description: 'Backend para gestión de pedidos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}