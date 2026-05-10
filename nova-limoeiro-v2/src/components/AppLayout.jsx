import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [sideOpen, setSideOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}
          onClick={() => setSideOpen(false)}
        >
          <div style={{ width: 260, height: '100%' }} onClick={e => e.stopPropagation()}>
            <Sidebar mobile onClose={() => setSideOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile top bar */}
        <header style={{
          height: 'var(--header-h)', display: 'flex', alignItems: 'center',
          padding: '0 16px', borderBottom: 'var(--border)',
          background: 'var(--bg)', gap: 12, flexShrink: 0,
        }} className="mobile-header">
          <button onClick={() => setSideOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 22 }}>
            <i className="ti ti-menu-2" />
          </button>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Congregação Nova Limoeiro</div>
          <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'var(--blue-bg)', color: 'var(--blue-tx)', fontWeight: 500 }}>2026</span>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: '0' }}>
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
