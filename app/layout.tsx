import './globals.css'
import type { Metadata } from 'next'
import GoogleMapsLoader from "@/components/GoogleMapsLoader";
import Map from '@/components/Map';

export const metadata: Metadata = {
  title: 'Kursa Dards',
  description: 'Next.js + TypeScript starter'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <GoogleMapsLoader />
        <Map />
        {children}
      </body>
    </html>
  )
}

