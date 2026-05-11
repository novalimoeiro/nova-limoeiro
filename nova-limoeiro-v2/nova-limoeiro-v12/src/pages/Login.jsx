import { useState, useEffect } from 'react'
import { signIn } from '../lib/supabase'

const STORAGE_KEY = 'cnl_saved_email'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) { setEmail(saved); setRemember(true) }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('E-mail ou senha incorretos.')
    } else {
      if (remember) localStorage.setItem(STORAGE_KEY, email)
      else localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: 16,
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/salao.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        filter: 'brightness(0.35)',
        zIndex: 0,
      }} />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(10,30,60,0.7) 100%)',
        zIndex: 1,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(22px, 6vw, 32px)',
            fontWeight: 500,
            color: '#ffffff',
            letterSpacing: 0.5,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            marginBottom: 8,
            lineHeight: 1.2,
          }}>
            Congregação Nova Limoeiro
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', letterSpacing: 1 }}>
            Sistema de Presenças
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 14,
          padding: '28px 28px 24px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="field">
              <label style={{ color: '#444' }}>E-mail</label>
              <input
                type="email" required autoFocus={!email}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{ background: '#f7f7f5', border: '0.5px solid #ddd', color: '#111' }}
              />
            </div>

            {/* Password */}
            <div className="field">
              <label style={{ color: '#444' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ background: '#f7f7f5', border: '0.5px solid #ddd', color: '#111', width: '100%', paddingRight: 38 }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 17, padding: 0 }}>
                  <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Remember email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}
              onClick={() => setRemember(r => !r)}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${remember ? '#185FA5' : '#ccc'}`,
                background: remember ? '#185FA5' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all .15s',
              }}>
                {remember && <i className="ti ti-check" style={{ fontSize: 11, color: '#fff' }} aria-hidden="true" />}
              </div>
              <span style={{ fontSize: 13, color: '#555', userSelect: 'none' }}>Lembrar e-mail</span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ fontSize: 12, color: '#A32D2D', background: '#FCEBEB', padding: '8px 10px', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-alert-circle" style={{ fontSize: 14, flexShrink: 0 }} aria-hidden="true" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', borderRadius: 8,
              background: loading ? '#85B7EB' : '#185FA5',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background .15s',
            }}>
              {loading ? (
                <>
                  <i className="ti ti-loader-2" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                  Entrando…
                </>
              ) : (
                <>
                  <i className="ti ti-login" style={{ fontSize: 16 }} aria-hidden="true" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
