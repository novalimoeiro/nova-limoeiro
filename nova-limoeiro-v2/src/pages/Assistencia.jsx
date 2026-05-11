import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMembers } from '../lib/useMembers.jsx'
import { useGroups } from '../lib/useGroups.jsx'
import { EVENT_TYPES, MONTHS_PT, getMeetings, dateStr } from '../lib/data'

const STATUS_OPTIONS = [
  { v:'P', label:'Presente',    icon:'ti-check', bg:'var(--green-bg)', tx:'var(--green-tx)' },
  { v:'Z', label:'Zoom',        icon:'ti-video',  bg:'var(--blue-bg)',  tx:'var(--blue-tx)'  },
  { v:'A', label:'Ausente',     icon:'ti-x',      bg:'var(--red-bg)',   tx:'var(--red-tx)'   },
  { v:'E', label:'Visit./Est.', icon:'ti-star',   bg:'var(--amber-bg)', tx:'var(--amber-tx)' },
]

const thBase = { position:'sticky', top:0, zIndex:10, background:'var(--bg2)', padding:'3px 2px', border:'var(--border)', fontWeight:500, fontSize:10, color:'var(--text2)', textAlign:'center', width:42 }
const tdBase = { border:'var(--border)', padding:0, textAlign:'center', height:27, width:42 }
function thSticky(left, minWidth) { return { ...thBase, position:'sticky', left, zIndex:20, textAlign:'center', minWidth, background:'var(--bg2)' } }
function tdSticky(left, minWidth, bold) { return { ...tdBase, position:'sticky', left, zIndex:5, background:'var(--bg)', padding:'0 4px', textAlign:'center', minWidth, fontWeight:bold?500:400, fontSize:12 } }

export default function Assistencia() {
  const [params, setParams] = useSearchParams()
  const [month, setMonth]   = useState(parseInt(params.get('mes') ?? new Date().getMonth()))
  const [groupFilter, setGroupFilter] = useState('all')
  const { members, loading: mLoading } = useMembers()
  const { groups,  loading: gLoading } = useGroups()
  const [attendance, setAttendance] = useState({})
  const [events, setEvents]         = useState({})
  const [visitors, setVisitors]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [attModal, setAttModal]     = useState(null)
  const [evtModal, setEvtModal]     = useState(null)
  const [visitorModal, setVisitorModal] = useState(null)
  const [visitorInput, setVisitorInput] = useState('')
  const [saving, setSaving]         = useState(false)

  const meetings = getMeetings(2026, month)
  const filtered = groupFilter === 'all' ? members : members.filter(m => m.group_name === groupFilter)

  function gs(name) { return groups.find(g => g.name === name) || { color:'#888', bg:'#eee', tx:'#444' } }

  useEffect(() => { setParams({ mes: month }); loadData() }, [month])

  async function loadData() {
    setLoading(true)
    const [{ data: att }, { data: evts }, { data: vis }] = await Promise.all([
      supabase.from('attendance').select('member_id,date,status').eq('year', 2026),
      supabase.from('events').select('date,event_type').eq('year', 2026),
      supabase.from('visitors').select('date,count').eq('year', 2026),
    ])
    const attMap = {}; att?.forEach(r => { attMap[`${r.member_id}_${r.date}`] = r.status })
    const evtMap = {}; evts?.forEach(r => { evtMap[r.date] = r.event_type })
    const visMap = {}; vis?.forEach(r => { visMap[r.date] = r.count })
    setAttendance(attMap); setEvents(evtMap); setVisitors(visMap); setLoading(false)
  }

  async function saveStatus(memberId, date, status) {
    setSaving(true)
    const key = `${memberId}_${date}`
    if (!status) {
      await supabase.from('attendance').delete().eq('member_id', memberId).eq('date', date)
      setAttendance(prev => { const n = { ...prev }; delete n[key]; return n })
    } else {
      await supabase.from('attendance').upsert({ member_id: memberId, date, status, year: 2026 }, { onConflict: 'member_id,date' })
      setAttendance(prev => ({ ...prev, [key]: status }))
    }
    setSaving(false); setAttModal(null)
  }

  async function saveEvent(date, eventType) {
    setSaving(true)
    if (!eventType) {
      await supabase.from('events').delete().eq('date', date)
      setEvents(prev => { const n = { ...prev }; delete n[date]; return n })
    } else {
      await supabase.from('events').upsert({ date, event_type: eventType, year: 2026 }, { onConflict: 'date' })
      setEvents(prev => ({ ...prev, [date]: eventType }))
    }
    setSaving(false); setEvtModal(null)
  }

  async function saveVisitors(date, count) {
    setSaving(true)
    const n = parseInt(count)
    if (!count || isNaN(n) || n === 0) {
      await supabase.from('visitors').delete().eq('date', date)
      setVisitors(prev => { const nv = { ...prev }; delete nv[date]; return nv })
    } else {
      await supabase.from('visitors').upsert({ date, count: n, year: 2026 }, { onConflict: 'date' })
      setVisitors(prev => ({ ...prev, [date]: n }))
    }
    setSaving(false); setVisitorModal(null)
  }

  const byGroup = {}
  groups.forEach(g => { byGroup[g.name] = [] })
  filtered.forEach(m => {
    if (!byGroup[m.group_name]) byGroup[m.group_name] = []
    byGroup[m.group_name].push(m)
  })

  const isLoading = loading || mLoading || gLoading

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Controls */}
      <div style={{ padding:'10px 16px', borderBottom:'var(--border)', background:'var(--bg)', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
          style={{ fontSize:13, padding:'5px 8px', border:'var(--border)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)' }}>
          {MONTHS_PT.map((m,i) => <option key={i} value={i}>{m} 2026</option>)}
        </select>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--text2)' }}>Grupo:</span>
          <button className={`pill ${groupFilter==='all'?'on':''}`} onClick={() => setGroupFilter('all')}>Todos</button>
          {groups.map(g => (
            <button key={g.id} className={`pill ${groupFilter===g.name?'on':''}`} onClick={() => setGroupFilter(g.name)}>{g.name}</button>
          ))}
        </div>
        {saving && <span style={{ fontSize:11, color:'var(--text2)', marginLeft:'auto' }}>Salvando…</span>}
      </div>

      {/* Table */}
      <div style={{ flex:1, overflow:'auto' }}>
        {isLoading ? <div style={{ padding:32, color:'var(--text2)', fontSize:13 }}>Carregando…</div> : (
          <table style={{ borderCollapse:'collapse', fontSize:12, width:'max-content', minWidth:'100%' }}>
            <thead>
              <tr>
                <th style={thSticky(0, 120)}>Nome</th>
                {meetings.map(mt => {
                  const d = dateStr(mt.date)
                  const ev = events[d]
                  const evObj = ev ? EVENT_TYPES.find(e => e.id === ev) : null
                  return (
                    <th key={d} onClick={() => setEvtModal({ date:d, day:mt.date.getDate() })}
                      style={{ ...thBase, width:42, cursor:'pointer', background:ev?'var(--amber-bg)':'var(--bg2)', color:ev?'var(--amber-tx)':mt.type==='qui'?'var(--blue)':'#993556' }}>
                      <span style={{ fontSize:9, display:'block', opacity:.7 }}>{mt.type==='qui'?'Qui':'Dom'}</span>
                      <span style={{ fontSize:11, fontWeight:500 }}>{mt.date.getDate()}</span>
                      {ev && <i className={`ti ${evObj?.icon || 'ti-star'}`} style={{ fontSize:10, display:'block', marginTop:1 }} title={evObj?.label} aria-label={evObj?.label} />}
                    </th>
                  )
                })}
                <th style={thBase}>P</th><th style={thBase}>Z</th><th style={thBase}>A</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byGroup).map(([grp, mems]) => {
                if (mems.length === 0) return null
                const g = gs(grp)
                return [
                  <tr key={`sep-${grp}`}>
                    <td colSpan={meetings.length+4}
                      style={{ background:g.bg, padding:'5px 10px', borderTop:`2px solid ${g.color}`, borderBottom:`1px solid ${g.color}30` }}>
                      <span style={{ fontSize:11, fontWeight:700, color:g.color, letterSpacing:.3, whiteSpace:'nowrap' }}>{grp}</span>
                    </td>
                  </tr>,
                  ...mems.map(mb => {
                    let cP=0,cZ=0,cA=0
                    meetings.forEach(mt => {
                      const v = attendance[`${mb.id}_${dateStr(mt.date)}`]
                      if (v==='P') cP++; else if (v==='Z') cZ++; else if (v==='A') cA++
                    })
                    return (
                      <tr key={mb.id}>
                        <td style={tdSticky(0,120)}>{mb.name}</td>
                        {meetings.map(mt => {
                          const d = dateStr(mt.date)
                          if (events[d]) return <td key={d} style={{ ...tdBase, background:'var(--amber-bg)', color:'var(--amber-tx)', fontSize:10 }}>—</td>
                          const v = attendance[`${mb.id}_${d}`]||''
                          return (
                            <td key={d} style={{ ...tdBase, cursor:'pointer' }}
                              onClick={() => setAttModal({ memberId:mb.id, date:d, name:mb.name, day:mt.date.getDate() })}>
                              {v && <span className={`badge badge-${v}`}>{v}</span>}
                            </td>
                          )
                        })}
                        <td style={{ ...tdBase, fontWeight:500, color:'var(--green-tx)', fontSize:11 }}>{cP}</td>
                        <td style={{ ...tdBase, fontWeight:500, color:'var(--blue)', fontSize:11 }}>{cZ}</td>
                        <td style={{ ...tdBase, fontWeight:500, color:'var(--red-tx)', fontSize:11 }}>{cA}</td>
                      </tr>
                    )
                  })
                ]
              })}

              {/* Visitantes/Outros row */}
              <tr><td colSpan={meetings.length+5} style={{ height:3, background:'var(--amber-bg)', borderColor:'var(--amber-bg)', padding:0 }} /></tr>
              <tr>
                <td style={{ ...tdSticky(0,120), fontWeight:600, color:'var(--amber-tx)', fontSize:11 }}>Visitantes/Outros</td>
                {meetings.map(mt => {
                  const d = dateStr(mt.date)
                  if (events[d]) return <td key={d} style={{ ...tdBase, background:'var(--amber-bg)' }}>—</td>
                  const count = visitors[d]
                  return (
                    <td key={d} style={{ ...tdBase, cursor:'pointer', background:count?'var(--amber-bg)':undefined }}
                      onClick={() => { setVisitorModal({ date:d, day:mt.date.getDate() }); setVisitorInput(count?String(count):'') }}>
                      {count ? <span style={{ fontSize:11, fontWeight:600, color:'var(--amber-tx)' }}>{count}</span> : ''}
                    </td>
                  )
                })}
                <td style={tdBase}/><td style={tdBase}/><td style={tdBase}/>
              </tr>

              {/* Totals */}
              <tr style={{ background:'var(--bg2)' }}>
                <td style={{ ...tdSticky(0,110,true), fontSize:10 }}>Total</td>
                {meetings.map(mt => {
                  const d = dateStr(mt.date)
                  if (events[d]) return <td key={d} style={tdBase} />
                  let P=0,Z=0,A=0
                  filtered.forEach(mb => {
                    const v = attendance[`${mb.id}_${d}`]
                    if (v==='P') P++; else if (v==='Z') Z++; else if (v==='A') A++
                  })
                  return (
                    <td key={d} style={{ ...tdBase, fontSize:9 }}>
                      <span style={{ color:'var(--green-tx)' }}>{P}</span>/
                      <span style={{ color:'var(--blue)' }}>{Z}</span>/
                      <span style={{ color:'var(--red-tx)' }}>{A}</span>
                    </td>
                  )
                })}
                <td style={tdBase}/><td style={tdBase}/><td style={tdBase}/>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Attendance modal */}
      {attModal && (
        <div className="modal-overlay" onClick={() => setAttModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{attModal.name}</h3>
            <div className="sub">Dia {attModal.day} — marcar presença</div>
            <div className="btn-grid">
              {STATUS_OPTIONS.map(s => (
                <button key={s.v} className="btn"
                  style={{ justifyContent:'center', background:attendance[`${attModal.memberId}_${attModal.date}`]===s.v?s.bg:undefined }}
                  onClick={() => saveStatus(attModal.memberId, attModal.date, s.v)}>
                  <i className={`ti ${s.icon}`} aria-hidden="true"/> {s.label}
                </button>
              ))}
              <button className="btn" style={{ gridColumn:'1/-1', color:'var(--text2)' }}
                onClick={() => saveStatus(attModal.memberId, attModal.date, null)}>Limpar marcação</button>
            </div>
            <button className="modal-cancel" onClick={() => setAttModal(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Visitor modal */}
      {visitorModal && (
        <div className="modal-overlay" onClick={() => setVisitorModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Visitantes/Outros — Dia {visitorModal.day}</h3>
            <div className="sub">Quantidade de visitantes e outros nesta reunião.</div>
            <div className="field">
              <label>Quantidade</label>
              <input type="number" min="0" autoFocus value={visitorInput}
                onChange={e => setVisitorInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && saveVisitors(visitorModal.date, visitorInput)}
                placeholder="0" />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={() => saveVisitors(visitorModal.date, visitorInput)}>Salvar</button>
              <button className="btn" style={{ flex:1, justifyContent:'center' }} onClick={() => setVisitorModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Event modal */}
      {evtModal && (
        <div className="modal-overlay" onClick={() => setEvtModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Dia {evtModal.day} — evento</h3>
            <div className="sub">Selecione o tipo de evento para esta data.</div>
            {EVENT_TYPES.map(e => (
              <div key={e.id} className={`evt-row ${events[evtModal.date]===e.id?'selected':''}`} onClick={() => saveEvent(evtModal.date, e.id)}>
                <i className={`ti ${e.icon}`} aria-hidden="true"/><span>{e.label}</span>
              </div>
            ))}
            {events[evtModal.date] && (
              <div className="evt-row" onClick={() => saveEvent(evtModal.date, null)} style={{ marginTop:4 }}>
                <i className="ti ti-trash" style={{ color:'var(--text2)' }} aria-hidden="true"/>
                <span style={{ color:'var(--text2)', fontStyle:'italic' }}>Remover evento</span>
              </div>
            )}
            <button className="modal-cancel" onClick={() => setEvtModal(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
