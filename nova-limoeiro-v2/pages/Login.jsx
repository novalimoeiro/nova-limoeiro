import { useState } from 'react'
import { signIn } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError('E-mail ou senha incorretos.')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg3)', padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg)', border: 'var(--border)', borderRadius: 'var(--radius-lg)',
        padding: '32px 28px', width: '100%', maxWidth: '360px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-circle-letter-c" style={{ fontSize: 22, color: 'var(--blue)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Congregação Nova Limoeiro</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Sistema de presenças</div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>E-mail</label>
            <input
              type="email" required autoFocus
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div style={{ fontSize: 12, color: 'var(--red-tx)', background: 'var(--red-bg)', padding: '8px 10px', borderRadius: 'var(--radius)', marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
