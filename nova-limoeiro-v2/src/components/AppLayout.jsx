import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [sideOpen, setSideOpen] = useState(false)
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'  // default: light
  })
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Apply light theme on first load if no preference saved
  useEffect(() => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  useEffect(() => { setSideOpen(false) }, [location])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar dark={dark} onToggleTheme={() => setDark(d => !d)} />
      </div>

      {sideOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }} onClick={() => setSideOpen(false)}>
          <div style={{ width: 260, height: '100%' }} onClick={e => e.stopPropagation()}>
            <Sidebar mobile onClose={() => setSideOpen(false)} dark={dark} onToggleTheme={() => setDark(d => !d)} />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{
          height: 'var(--header-h)', display: 'flex', alignItems: 'center',
          padding: '0 16px', borderBottom: 'var(--border)',
          background: 'var(--bg)', gap: 12, flexShrink: 0,
        }} className="mobile-header">
          <button onClick={() => setSideOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 22 }}>
            <i className="ti ti-menu-2" />
          </button>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Congregação Nova Limoeiro</div>
          <button onClick={() => setDark(d => !d)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text2)', fontSize: 18, cursor: 'pointer' }}>
            <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} />
          </button>
        </header>

        <main style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  )
}
