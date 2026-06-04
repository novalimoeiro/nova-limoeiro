import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMembers } from '../lib/useMembers.jsx'
import { useGroups } from '../lib/useGroups.jsx'
import { EVENT_TYPES, MONTHS_PT, getMeetings, dateStr } from '../lib/data'

const STATUS_OPTIONS = [
  { v:'P', label:'Presente',    icon:'ti-check', bg:'var(--att-P-bg)', tx:'var(--att-P-tx)' },
  { v:'Z', label:'Zoom',        icon:'ti-video',  bg:'var(--att-Z-bg)', tx:'var(--att-Z-tx)' },
  { v:'A', label:'Ausente',     icon:'ti-x',      bg:'var(--att-A-bg)', tx:'var(--att-A-tx)' },
  { v:'E', label:'Visit./Est.', icon:'ti-star',   bg:'var(--att-E-bg)', tx:'var(--att-E-tx)' },
]

const thBase = { position:'sticky', top:0, zIndex:10, background:'var(--bg2)', padding:'4px 2px', border:'var(--border)', fontWeight:500, fontSize:10, color:'var(--text2)', textAlign:'center', width:42, minHeight:44 }
const tdBase = { border:'1px solid #d0d0cc', padding:0, textAlign:'center', height:40, width:42, cursor:'pointer', background:'#fafaf8' }

function thN(left, w) { return { ...thBase, position:'sticky', left, zIndex:20, textAlign:'center', width:w, background:'var(--bg2)' } }
function tdN(left, w, bold) { return { ...tdBase, position:'sticky', left, zIndex:5, background:'var(--bg)', padding:'0 6px', textAlign:'left', width:w, fontWeight:bold?700:400, fontSize:bold?13:12, height:bold?40:40, borderRight:'2px solid #c0c0bc' } }

export default function Assistencia() {
  const [params, setParams] = useSearchParams()
  const [month, setMonth] = useState(parseInt(params.get('mes') ?? new Date().getMonth()))
  const [gf, setGf] = useState('all')
  const { members, loading: mL } = useMembers()
  const { groups,  loading: gL } = useGroups()
  const [attendance, setAttendance] = useState({})
  const [events, setEvents]         = useState({})
  const [visitors, setVisitors]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [attModal, setAttModal]     = useState(null)
  const [evtModal, setEvtModal]     = useState(null)
  const [visModal, setVisModal]     = useState(null)
  const [visInput, setVisInput]     = useState('')
  const [saving, setSaving]         = useState(false)

  const meetings = getMeetings(2026, month)
  const filtered = gf==='all' ? members : members.filter(m=>m.group_name===gf)
  function gs(name) { return groups.find(g=>g.name===name) || {color:'#888',bg:'#eee',tx:'#444'} }

  useEffect(() => { setParams({mes:month}); loadData() }, [month])

  async function loadData() {
    setLoading(true)
    const [{ data:att },{ data:evts },{ data:vis }] = await Promise.all([
      supabase.from('attendance').select('member_id,date,status').eq('year',2026).limit(100000),
      supabase.from('events').select('date,event_type').eq('year',2026),
      supabase.from('visitors').select('date,count').eq('year',2026),
    ])
    const am={},em={},vm={}
    att?.forEach(r=>{am[`${r.member_id}_${r.date}`]=r.status})
    evts?.forEach(r=>{em[r.date]=r.event_type})
    vis?.forEach(r=>{vm[r.date]=r.count})
    setAttendance(am); setEvents(em); setVisitors(vm); setLoading(false)
  }

  async function saveStatus(memberId, date, status) {
    setSaving(true)
    const key=`${memberId}_${date}`
    if (!status) {
      await supabase.from('attendance').delete().eq('member_id',memberId).eq('date',date)
      setAttendance(p=>{const n={...p};delete n[key];return n})
    } else {
      await supabase.from('attendance').upsert({member_id:memberId,date,status,year:2026},{onConflict:'member_id,date'})
      setAttendance(p=>({...p,[key]:status}))
    }
    setSaving(false); setAttModal(null)
  }

  async function saveEvent(date, eventType) {
    setSaving(true)
    if (!eventType) {
      await supabase.from('events').delete().eq('date',date)
      setEvents(p=>{const n={...p};delete n[date];return n})
    } else {
      await supabase.from('events').upsert({date,event_type:eventType,year:2026},{onConflict:'date'})
      setEvents(p=>({...p,[date]:eventType}))
    }
    setSaving(false); setEvtModal(null)
  }

  async function saveVisitors(date, count) {
    setSaving(true)
    const n=parseInt(count)
    if (!count||isNaN(n)||n===0) {
      await supabase.from('visitors').delete().eq('date',date)
      setVisitors(p=>{const nv={...p};delete nv[date];return nv})
    } else {
      await supabase.from('visitors').upsert({date,count:n,year:2026},{onConflict:'date'})
      setVisitors(p=>({...p,[date]:n}))
    }
    setSaving(false); setVisModal(null)
  }

  const byGroup={}
  groups.forEach(g=>{byGroup[g.name]=[]})
  filtered.forEach(m=>{if(!byGroup[m.group_name])byGroup[m.group_name]=[];byGroup[m.group_name].push(m)})

  const isLoading=loading||mL||gL

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <style>{`
        /* LIGHT MODE cells */
        .att-cell { background: #f0eeea; border: 1px solid #c8c8c4 !important; }
        .att-cell:active { background: #dedad4 !important; }

        /* DARK MODE cells */
        [data-theme='dark'] .att-cell { background: #2e2e32 !important; border: 1px solid #505056 !important; }
        [data-theme='dark'] .att-cell:active { background: #424248 !important; }
        [data-theme='dark'] table td { border-color: #505056 !important; }
        [data-theme='dark'] table th { border-color: #505056 !important; background: #1e1e22 !important; }
        [data-theme='dark'] .att-name-col { background: #1a1a1e !important; border-right: 2px solid #606068 !important; }

        /* Touch target size */
        @media (max-width: 768px) { .att-cell { min-height: 44px; } }
      `}</style>
      <div style={{padding:'10px 16px',borderBottom:'var(--border)',background:'var(--bg)',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',flexShrink:0}}>
        <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
          style={{fontSize:13,padding:'5px 8px',border:'var(--border)',borderRadius:'var(--radius)',background:'var(--bg)',color:'var(--text)'}}>
          {MONTHS_PT.map((m,i)=><option key={i} value={i}>{m} 2026</option>)}
        </select>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:11,color:'var(--text2)'}}>Grupo:</span>
          <button className={`pill ${gf==='all'?'on':''}`} onClick={()=>setGf('all')}>Todos</button>
          {groups.map(g=><button key={g.id} className={`pill ${gf===g.name?'on':''}`} onClick={()=>setGf(g.name)}>{g.name}</button>)}
        </div>
        {/* Legend */}
        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
          {[['P','var(--att-P-bg)','var(--att-P-tx)'],['Z','var(--att-Z-bg)','var(--att-Z-tx)'],['A','var(--att-A-bg)','var(--att-A-tx)'],['E','var(--att-E-bg)','var(--att-E-tx)']].map(([l,bg,tx])=>(
            <span key={l} style={{width:18,height:18,borderRadius:4,background:bg,border:`1px solid ${tx}`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:tx}}>{l}</span>
          ))}
          {saving && <span style={{fontSize:11,color:'var(--text2)',marginLeft:4}}>Salvando…</span>}
        </div>
      </div>

      <div style={{flex:1,overflow:'auto'}}>
        {isLoading ? <div style={{padding:32,color:'var(--text2)',fontSize:13}}>Carregando…</div> : (
          <table style={{borderCollapse:'collapse',fontSize:12,width:'max-content',minWidth:'100%'}}>
            <thead>
              <tr>
                <th style={thN(0,130)}>Nome</th>
                {meetings.map(mt=>{
                  const d=dateStr(mt.date), ev=events[d]
                  const evObj=ev?EVENT_TYPES.find(e=>e.id===ev):null
                  return (
                    <th key={d} onClick={()=>setEvtModal({date:d,day:mt.date.getDate()})}
                      style={{...thBase,cursor:'pointer',background:ev?'var(--col-evt-bg)':'var(--bg2)',color:ev?'var(--col-evt-tx)':mt.type==='qui'?'var(--col-qui)':'var(--col-dom)'}}>
                      <span style={{fontSize:9,display:'block',opacity:.7}}>{mt.type==='qui'?'Qui':'Dom'}</span>
                      <span style={{fontSize:11,fontWeight:500}}>{mt.date.getDate()}</span>
                      {ev && <i className={`ti ${evObj?.icon||'ti-star'}`} style={{fontSize:9,display:'block',marginTop:1}} title={evObj?.label}/>}
                    </th>
                  )
                })}
                <th style={thBase}>P</th><th style={thBase}>Z</th><th style={thBase}>A</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byGroup).map(([grp,mems])=>{
                if(mems.length===0) return null
                const g=gs(grp)
                return [
                  <tr key={`sep-${grp}`}>
                    <td colSpan={meetings.length+4} style={{background:g.bg,padding:'5px 12px',borderTop:`3px solid ${g.color}`}}>
                      <span style={{fontSize:12,fontWeight:700,color:g.color,display:'flex',alignItems:'center',gap:6}}>
                        <span style={{width:8,height:8,borderRadius:'50%',background:g.color,display:'inline-block',flexShrink:0}}/>
                        {grp}
                      </span>
                    </td>
                  </tr>,
                  ...mems.map(mb=>{
                    let cP=0,cZ=0,cA=0
                    meetings.forEach(mt=>{
                      const v=attendance[`${mb.id}_${dateStr(mt.date)}`]
                      if(v==='P')cP++; else if(v==='Z')cZ++; else if(v==='A')cA++
                    })
                    return (
                      <tr key={mb.id}>
                        <td style={tdN(0,130)}>{mb.name}</td>
                        {meetings.map(mt=>{
                          const d=dateStr(mt.date)
                          if(events[d]) return <td key={d} style={{...tdBase,background:'var(--col-evt-bg)',color:'var(--col-evt-tx)',fontSize:10}}>—</td>
                          const v=attendance[`${mb.id}_${d}`]||''
                          return (
                            <td key={d} className="att-cell" style={{...tdBase,background:v?undefined:undefined}} onClick={()=>setAttModal({memberId:mb.id,date:d,name:mb.name,day:mt.date.getDate()})}>
                              {v && <span className={`badge badge-${v}`}>{v}</span>}
                            </td>
                          )
                        })}
                        <td style={{...tdBase,fontWeight:500,color:'var(--att-P-tx)',fontSize:11}}>{cP}</td>
                        <td style={{...tdBase,fontWeight:500,color:'var(--att-Z-tx)',fontSize:11}}>{cZ}</td>
                        <td style={{...tdBase,fontWeight:500,color:'var(--att-A-tx)',fontSize:11}}>{cA}</td>
                      </tr>
                    )
                  })
                ]
              })}

              {/* Visitantes/Outros */}
              <tr><td colSpan={meetings.length+4} style={{height:3,background:'var(--col-evt-bg)',borderColor:'var(--col-evt-bg)',padding:0}}/></tr>
              <tr>
                <td style={{...tdN(0,130),fontWeight:600,color:'var(--col-evt-tx)',fontSize:11}}>Visitantes/Outros</td>
                {meetings.map(mt=>{
                  const d=dateStr(mt.date)
                  if(events[d]) return <td key={d} style={{...tdBase,background:'var(--col-evt-bg)'}}>—</td>
                  const count=visitors[d]
                  return (
                    <td key={d} style={{...tdBase,cursor:'pointer',background:count?'var(--col-evt-bg)':undefined}}
                      onClick={()=>{setVisModal({date:d,day:mt.date.getDate()});setVisInput(count?String(count):'');}}>
                      {count?<span style={{fontSize:11,fontWeight:600,color:'var(--col-evt-tx)'}}>{count}</span>:''}
                    </td>
                  )
                })}
                <td style={tdBase}/><td style={tdBase}/><td style={tdBase}/>
              </tr>

              {/* Total */}
              <tr style={{background:'var(--bg2)',borderTop:'2px solid var(--border-strong)'}}>
                <td style={{...tdN(0,130,true)}}>Total</td>
                {meetings.map(mt=>{
                  const d=dateStr(mt.date)
                  if(events[d]) return <td key={d} style={{...tdBase,height:38}}/>
                  let P=0,Z=0,A=0
                  filtered.forEach(mb=>{
                    const v=attendance[`${mb.id}_${d}`]
                    if(v==='P')P++; else if(v==='Z')Z++; else if(v==='A')A++
                  })
                  return (
                    <td key={d} style={{...tdBase,fontSize:11,fontWeight:600,height:38}}>
                      <span style={{color:'var(--att-P-tx)'}}>{P}</span>/
                      <span style={{color:'var(--att-Z-tx)'}}>{Z}</span>/
                      <span style={{color:'var(--att-A-tx)'}}>{A}</span>
                    </td>
                  )
                })}
                <td style={{...tdBase,height:38}}/><td style={{...tdBase,height:38}}/><td style={{...tdBase,height:38}}/>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {attModal && (
        <div className="modal-overlay" onClick={()=>setAttModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>{attModal.name}</h3>
            <div className="sub">Dia {attModal.day} — marcar presença</div>
            <div className="btn-grid">
              {STATUS_OPTIONS.map(s=>(
                <button key={s.v} className="btn" style={{justifyContent:'center',background:attendance[`${attModal.memberId}_${attModal.date}`]===s.v?s.bg:undefined}}
                  onClick={()=>saveStatus(attModal.memberId,attModal.date,s.v)}>
                  <i className={`ti ${s.icon}`}/> {s.label}
                </button>
              ))}
              <button className="btn" style={{gridColumn:'1/-1',color:'var(--text2)'}} onClick={()=>saveStatus(attModal.memberId,attModal.date,null)}>Limpar marcação</button>
            </div>
            <button className="modal-cancel" onClick={()=>setAttModal(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {visModal && (
        <div className="modal-overlay" onClick={()=>setVisModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Visitantes/Outros — Dia {visModal.day}</h3>
            <div className="sub">Quantidade de visitantes e outros nesta reunião.</div>
            <div className="field">
              <label>Quantidade</label>
              <input type="number" min="0" autoFocus value={visInput} onChange={e=>setVisInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&saveVisitors(visModal.date,visInput)} placeholder="0"/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={()=>saveVisitors(visModal.date,visInput)}>Salvar</button>
              <button className="btn" style={{flex:1,justifyContent:'center'}} onClick={()=>setVisModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {evtModal && (
        <div className="modal-overlay" onClick={()=>setEvtModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Dia {evtModal.day} — evento</h3>
            <div className="sub">Selecione o tipo de evento para esta data.</div>
            {EVENT_TYPES.map(e=>(
              <div key={e.id} className={`evt-row ${events[evtModal.date]===e.id?'selected':''}`} onClick={()=>saveEvent(evtModal.date,e.id)}>
                <i className={`ti ${e.icon}`}/><span>{e.label}</span>
              </div>
            ))}
            {events[evtModal.date] && (
              <div className="evt-row" onClick={()=>saveEvent(evtModal.date,null)} style={{marginTop:4}}>
                <i className="ti ti-trash" style={{color:'var(--text2)'}}/><span style={{color:'var(--text2)',fontStyle:'italic'}}>Remover evento</span>
              </div>
            )}
            <button className="modal-cancel" onClick={()=>setEvtModal(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
