import type { Metadata } from 'next'

import './didar.css'
import './globals.css'

import { Toaster } from '@medusajs/ui'
import Head from 'next/head'

import { HtmlLangSetter } from '@/components/atoms/HtmlLangSetter/HtmlLangSetter'
import { retrieveCart } from '@/lib/data/cart'

import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    template: '%s | Didar',
    default: 'Didar',
  },
  description: 'Didar jewellery and stories',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cart = await retrieveCart()
  const htmlLang = 'en'

  return (
    <html lang={htmlLang}>
      <Head>
        <link
          rel="preconnect"
          href="https://medusa-public-images.s3.eu-west-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://medusa-public-images.s3.eu-west-1.amazonaws.com" />
        <link
          rel="preconnect"
          href="https://mercur-connect.s3.eu-central-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://mercur-connect.s3.eu-central-1.amazonaws.com" />
      </Head>
      <body className="relative bg-primary text-secondary antialiased">
        <HtmlLangSetter />
        <Providers cart={cart}>{children}</Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
