import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMembers } from '../lib/useMembers.jsx'
import { GROUPS, MONTHS_PT, getMeetings, dateStr } from '../lib/data'

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'var(--bg)', border: 'var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 500 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { members } = useMembers()
  const [attendance, setAttendance] = useState({})
  const [events, setEvents]         = useState({})
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: att }, { data: evts }] = await Promise.all([
        supabase.from('attendance').select('member_id,date,status').eq('year', 2026),
        supabase.from('events').select('date,event_type').eq('year', 2026),
      ])
      const attMap = {}
      att?.forEach(r => { attMap[`${r.member_id}_${r.date}`] = r.status })
      const evtMap = {}
      evts?.forEach(r => { evtMap[r.date] = r.event_type })
      setAttendance(attMap)
      setEvents(evtMap)
      setLoading(false)
    }
    load()
  }, [])

  function monthStats(month) {
    const mtgs = getMeetings(2026, month)
    let P = 0, Z = 0, A = 0
    mtgs.forEach(mt => {
      if (events[dateStr(mt.date)]) return
      members.forEach(mb => {
        const v = attendance[`${mb.id}_${dateStr(mt.date)}`]
        if (v === 'P') P++
        else if (v === 'Z') Z++
        else if (v === 'A') A++
      })
    })
    return { P, Z, A, tot: P + Z + A, n: mtgs.length }
  }

  let totalP = 0, totalZ = 0, totalA = 0, totalMtgs = 0
  for (let m = 0; m < 12; m++) {
    const s = monthStats(m)
    totalP += s.P; totalZ += s.Z; totalA += s.A; totalMtgs += s.n
  }
  const total = totalP + totalZ + totalA
  const pct = total > 0 ? Math.round((totalP + totalZ) / total * 100) : 0

  const groupStats = GROUPS.map(g => {
    const gm = members.filter(m => m.group_name === g.name)
    let gP = 0, gT = 0
    for (let m = 0; m < 12; m++) {
      getMeetings(2026, m).forEach(mt => {
        if (events[dateStr(mt.date)]) return
        gm.forEach(mb => {
          const v = attendance[`${mb.id}_${dateStr(mt.date)}`]
          if (v) gT++
          if (v === 'P' || v === 'Z') gP++
        })
      })
    }
    return { ...g, pct: gT > 0 ? Math.round(gP / gT * 100) : 0, count: gm.length }
  })

  if (loading) return <div style={{ padding: 32, color: 'var(--text2)', fontSize: 13 }}>Carregando…</div>

  return (
    <div style={{ padding: '20px 20px 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500 }}>Dashboard</h2>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Visão geral das presenças em 2026</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
        <StatCard label="Membros ativos" value={members.length} sub="5 grupos" />
        <StatCard label="Presença geral"  value={`${pct}%`}     sub="Presencial + Zoom" />
        <StatCard label="Reuniões"         value={totalMtgs}     sub="Qui + Dom" />
        <StatCard label="Ausências"        value={totalA}        sub={`${Math.round(totalA / (total || 1) * 100)}% do total`} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-users" style={{ fontSize: 14 }} /> Presença por grupo
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {groupStats.map(g => (
            <div key={g.name} style={{ background: 'var(--bg)', border: 'var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: g.tx, marginBottom: 3 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{g.count} membros</div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--bg3)', marginBottom: 3 }}>
                <div style={{ height: 5, borderRadius: 3, background: g.color, width: `${g.pct}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{g.pct}% presença</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-calendar" style={{ fontSize: 14 }} /> Por mês
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 6 }}>
          {MONTHS_PT.map((mn, i) => {
            const s = monthStats(i)
            const p = s.tot > 0 ? Math.round((s.P + s.Z) / s.tot * 100) : null
            return (
              <button key={i} onClick={() => navigate(`/assistencia?mes=${i}`)} style={{
                padding: '10px 6px', borderRadius: 'var(--radius)', border: 'var(--border)',
                background: 'var(--bg)', cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: p !== null ? 500 : 400 }}>{mn.slice(0, 3)}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>{p !== null ? `${p}%` : '—'}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
