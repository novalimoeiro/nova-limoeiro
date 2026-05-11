import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EVENT_TYPES, MONTHS_PT } from '../lib/data'

export default function Eventos() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('events').select('*').eq('year', 2026).order('date')
      .then(({ data }) => { setEvents(data || []); setLoading(false) })
  }, [])

  async function remove(date) {
    await supabase.from('events').delete().eq('date', date)
    setEvents(prev => prev.filter(e => e.date !== date))
  }

  const grouped = {}
  events.forEach(e => {
    const m = parseInt(e.date.split('-')[1]) - 1
    ;(grouped[m] = grouped[m] || []).push(e)
  })

  return (
    <div style={{ padding: '20px 20px 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500 }}>Eventos</h2>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Datas marcadas como eventos em 2026</p>
        <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
          Para marcar ou editar eventos, acesse a Planilha e clique no cabeçalho de uma data.
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)', fontSize: 13 }}>Carregando…</div>
      ) : events.length === 0 ? (
        <div style={{ color: 'var(--text2)', fontSize: 13 }}>Nenhum evento registrado ainda.</div>
      ) : (
        Object.entries(grouped).map(([m, evts]) => (
          <div key={m} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>{MONTHS_PT[parseInt(m)]}</div>
            {evts.map(e => {
              const evType = EVENT_TYPES.find(t => t.id === e.event_type)
              const [, , day] = e.date.split('-')
              return (
                <div key={e.date} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: 'var(--bg)', border: 'var(--border)',
                  borderRadius: 'var(--radius)', marginBottom: 6,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--amber-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <i className={`ti ${evType?.icon || 'ti-star'}`} style={{ fontSize: 20, color: '#854F0B' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{evType?.label || e.event_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{parseInt(day)}/{parseInt(m)+1}/2026</div>
                  </div>
                  <button onClick={() => remove(e.date)} style={{
                    background: 'none', border: 'none', color: 'var(--text2)', fontSize: 16, cursor: 'pointer', padding: 4,
                  }} title="Remover evento">
                    <i className="ti ti-trash" />
                  </button>
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
