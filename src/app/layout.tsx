import type { Metadata, Viewport } from "next"
import { Bebas_Neue, Lekton } from "next/font/google"
import "./globals.css"

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ["latin"], variable: "--font-heading" })
const lekton = Lekton({ weight: ['400', '700'], subsets: ["latin"], variable: "--font-body" })

export const metadata: Metadata = {
  title: {
    default: "Athletic Odyssey",
    template: "%s | Athletic Odyssey",
  },
  description: "Elite personal training and nutrition coaching platform. Track workouts, macros, and body composition with your Athletic Odyssey coach.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Athletic Odyssey",
  },
  openGraph: {
    title: "Athletic Odyssey",
    description: "Elite personal training and nutrition coaching platform.",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`h-full ${bebasNeue.variable} ${lekton.variable}`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
