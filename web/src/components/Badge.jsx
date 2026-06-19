const base = {
  fontSize: 8, fontWeight: 800, letterSpacing: '.08em',
  textTransform: 'uppercase', padding: '2px 5px', borderRadius: 3,
}

export default function Badge({ kind, bg, color, children }) {
  if (kind === 'status') {
    return (
      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, background: bg, color }}>
        {children}
      </span>
    )
  }
  if (kind === 'you') {
    return <span style={{ ...base, color: '#FFFFFF', background: '#1A1813' }}>{children}</span>
  }
  // jersey | viewing
  return <span style={{ ...base, color: 'var(--accent-ink)', background: 'var(--accent)' }}>{children}</span>
}
