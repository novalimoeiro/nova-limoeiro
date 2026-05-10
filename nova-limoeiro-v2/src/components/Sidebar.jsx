import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'

const NAV = [
  { to: '/dashboard',   icon: 'ti-layout-dashboard', label: 'Dashboard'  },
  { to: '/assistencia', icon: 'ti-table',             label: 'Planilha'   },
  { to: '/membros',     icon: 'ti-users',             label: 'Membros'    },
  { to: '/eventos',     icon: 'ti-calendar-event',    label: 'Eventos'    },
]

export default function Sidebar({ mobile, onClose, dark, onToggleTheme }) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside style={{
      width: mobile ? '100%' : 'var(--nav-w)',
      height: '100%', background: 'var(--bg)',
      borderRight: 'var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="ti ti-circle-letter-c" style={{ fontSize: 20, color: 'var(--blue)' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Congregação Nova Limoeiro
            </div>
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>2026</div>
          </div>
          {mobile && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20 }}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflow: 'auto' }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 'var(--radius)',
            marginBottom: 2, fontSize: 13,
            color: isActive ? 'var(--blue)' : 'var(--text2)',
            background: isActive ? 'var(--blue-bg)' : 'transparent',
            fontWeight: isActive ? 500 : 400, transition: 'all .12s',
          })}>
            <i className={`ti ${icon}`} style={{ fontSize: 18 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: theme + logout */}
      <div style={{ padding: '10px 8px', borderTop: 'var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button onClick={onToggleTheme} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '9px 10px', borderRadius: 'var(--radius)',
          border: 'none', background: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
        }}>
          <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: 18 }} />
          {dark ? 'Tema claro' : 'Tema escuro'}
        </button>
        <button onClick={handleSignOut} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '9px 10px', borderRadius: 'var(--radius)',
          border: 'none', background: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
        }}>
          <i className="ti ti-logout" style={{ fontSize: 18 }} />
          Sair
        </button>
      </div>
    </aside>
  )
}
