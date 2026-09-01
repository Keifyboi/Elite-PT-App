'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
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
            fontFamily: 'sans-serif',
          }}
        >
          <p
            style={{
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              fontSize: 32,
              letterSpacing: '0.06em',
              color: '#c9a84c',
              margin: 0,
            }}
          >
            ATHLETIC ODYSSEY
          </p>
          <p
            style={{
              fontSize: 13,
              color: '#888',
              marginTop: 8,
              marginBottom: 32,
              maxWidth: 320,
            }}
          >
            Something went badly wrong loading the app. Try again — if it keeps happening, let your coach know.
          </p>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#c9a84c',
              color: '#000',
              border: 'none',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              fontSize: 16,
              letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  )
}
