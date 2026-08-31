import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  description: 'This page does not exist.',
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d0d',
        color: '#f0f0f0',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          fontSize: 96,
          lineHeight: 1,
          color: '#c9a84c',
          letterSpacing: '0.04em',
          margin: 0,
        }}
      >
        404
      </p>
      <p
        style={{
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          fontSize: 22,
          letterSpacing: '0.08em',
          marginTop: 8,
          marginBottom: 32,
          color: '#888',
        }}
      >
        PAGE NOT FOUND
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '12px 32px',
          background: '#c9a84c',
          color: '#000',
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          fontSize: 16,
          letterSpacing: '0.1em',
          textDecoration: 'none',
        }}
      >
        BACK TO HOME
      </Link>
    </div>
  )
}
