import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useMembers } from '../lib/useMembers.jsx'
import { useGroups } from '../lib/useGroups.jsx'
import { MONTHS_PT, getMeetings, dateStr } from '../lib/data'

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background:'var(--bg)', border:'var(--border)', borderRadius:'var(--radius)', padding:'14px 16px' }}>
      <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:500 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

function GroupDetailModal({ group, members, attendance, events, onClose }) {
  const [mf, setMf] = useState('all')
  const gm = members.filter(m => m.group_name === group.name)

  function stats(mid) {
    let P=0,Z=0,A=0,total=0
    const months = mf==='all' ? [0,1,2,3,4,5,6,7,8,9,10,11] : [parseInt(mf)]
    months.forEach(m => getMeetings(2026,m).forEach(mt => {
      if (events[dateStr(mt.date)]) return
      const v = attendance[`${mid}_${dateStr(mt.date)}`]
      if (v==='P'){P++;total++} else if(v==='Z'){Z++;total++} else if(v==='A'){A++;total++}
    }))
    return {P,Z,A,total}
  }

  const ms = gm.map(m=>({...m,...stats(m.id)})).sort((a,b)=>(b.P+b.Z)-(a.P+a.Z))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480, width:'100%', maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:500, color:group.color }}>{group.name}</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{gm.length} membros</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:20, padding:4 }}><i className="ti ti-x"/></button>
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12, flexShrink:0 }}>
          <button className={`pill ${mf==='all'?'on':''}`} onClick={()=>setMf('all')}>Total</button>
          {MONTHS_PT.map((mn,i) => {
            const has = gm.some(m=>getMeetings(2026,i).some(mt=>attendance[`${m.id}_${dateStr(mt.date)}`]))
            if (!has) return null
            return <button key={i} className={`pill ${mf===String(i)?'on':''}`} onClick={()=>setMf(String(i))}>{mn.slice(0,3)}</button>
          })}
        </div>
        <div style={{ display:'flex', gap:12, marginBottom:10, flexShrink:0 }}>
          {[['#3B6D11','Presente'],['#185FA5','Zoom'],['#A32D2D','Ausente']].map(([c,l])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}>
              <div style={{ width:8, height:8, borderRadius:2, background:c, flexShrink:0 }}/>
              {l}
            </div>
          ))}
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {ms.map(m => {
            if (m.total===0) return null
            const pp=Math.round(m.P/m.total*100), zp=Math.round(m.Z/m.total*100), ap=100-pp-zp
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:`${group.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:500, color:group.color, flexShrink:0 }}>
                  {m.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                </div>
                <div style={{ width:120, fontSize:12, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{m.name}</div>
                <div style={{ flex:1, height:8, borderRadius:4, background:'var(--bg3)', display:'flex', overflow:'hidden' }}>
                  <div style={{ width:`${pp}%`, background:'#639922' }}/>
                  <div style={{ width:`${zp}%`, background:'#185FA5' }}/>
                  <div style={{ width:`${ap}%`, background:'#A32D2D' }}/>
                </div>
                <div style={{ display:'flex', gap:5, fontSize:11, flexShrink:0, width:64, justifyContent:'flex-end' }}>
                  <span style={{ color:'#3B6D11', fontWeight:500 }}>{m.P}</span>
                  <span style={{ color:'#185FA5', fontWeight:500 }}>{m.Z}</span>
                  <span style={{ color:'#A32D2D', fontWeight:500 }}>{m.A}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { members } = useMembers()
  const { groups }  = useGroups()
  const [attendance, setAttendance] = useState({})
  const [events, setEvents]         = useState({})
  const [visitors, setVisitors]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [selGroup, setSelGroup]     = useState(null)
  const [resumoMes, setResumoMes]   = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: att }, { data: evts }, { data: vis }] = await Promise.all([
        supabase.from('attendance').select('member_id,date,status').eq('year',2026).limit(100000),
        supabase.from('events').select('date,event_type').eq('year',2026),
        supabase.from('visitors').select('date,count').eq('year',2026),
      ])
      const attMap={}, evtMap={}, visMap={}
      att?.forEach(r=>{attMap[`${r.member_id}_${r.date}`]=r.status})
      evts?.forEach(r=>{evtMap[r.date]=r.event_type})
      vis?.forEach(r=>{visMap[r.date]=r.count})
      setAttendance(attMap); setEvents(evtMap); setVisitors(visMap); setLoading(false)
    }
    load()
  }, [])

  function getMtgTotal(date) {
    if (events[date]) return null
    let count=0
    members.forEach(mb=>{
      const v=attendance[`${mb.id}_${date}`]
      if(v==='P'||v==='Z'||v==='E') count++
    })
    return count + (visitors[date]||0)
  }

  function getMonthSummary(month) {
    const mtgs=getMeetings(2026,month)
    const qui=mtgs.filter(m=>m.type==='qui'), dom=mtgs.filter(m=>m.type==='dom')
    const quiT=qui.map(m=>getMtgTotal(dateStr(m.date))).filter(v=>v!==null)
    const domT=dom.map(m=>getMtgTotal(dateStr(m.date))).filter(v=>v!==null)
    const quiTotal=quiT.reduce((a,b)=>a+b,0), domTotal=domT.reduce((a,b)=>a+b,0)
    const dates=mtgs.map(mt=>{
      const d=dateStr(mt.date)
      if(events[d]) return null
      let P=0,Z=0,A=0,E=0
      members.forEach(mb=>{
        const v=attendance[`${mb.id}_${d}`]
        if(v==='P')P++; else if(v==='Z')Z++; else if(v==='A')A++; else if(v==='E')E++
      })
      const vis=visitors[d]||0
      return {date:d,day:mt.date.getDate(),type:mt.type,P,Z,A,E:E+vis,total:P+Z+E+vis}
    }).filter(Boolean)
    return {
      quiTotal, domTotal,
      quiMedia: quiT.length>0?Math.round(quiTotal/quiT.length):0,
      domMedia: domT.length>0?Math.round(domTotal/domT.length):0,
      quiCount: quiT.length, domCount: domT.length, dates
    }
  }

  function monthStats(month) {
    const mtgs=getMeetings(2026,month)
    let P=0,Z=0,A=0
    mtgs.forEach(mt=>{
      if(events[dateStr(mt.date)]) return
      members.forEach(mb=>{
        const v=attendance[`${mb.id}_${dateStr(mt.date)}`]
        if(v==='P')P++; else if(v==='Z')Z++; else if(v==='A')A++
      })
    })
    return {P,Z,A,tot:P+Z+A,n:mtgs.length}
  }

  let totalP=0,totalZ=0,totalA=0,totalMtgs=0
  for(let m=0;m<12;m++){const s=monthStats(m);totalP+=s.P;totalZ+=s.Z;totalA+=s.A;totalMtgs+=s.n}
  const total=totalP+totalZ+totalA
  const pct=total>0?Math.round((totalP+totalZ)/total*100):0

  const groupStats=groups.map(g=>{
    const gm=members.filter(m=>m.group_name===g.name)
    let gP=0,gT=0
    for(let m=0;m<12;m++) getMeetings(2026,m).forEach(mt=>{
      if(events[dateStr(mt.date)]) return
      gm.forEach(mb=>{const v=attendance[`${mb.id}_${dateStr(mt.date)}`]; if(v) gT++; if(v==='P'||v==='Z') gP++})
    })
    return {...g, pct:gT>0?Math.round(gP/gT*100):0, count:gm.length}
  })

  if(loading) return <div style={{padding:32,color:'var(--text2)',fontSize:13}}>Carregando…</div>

  const summary = resumoMes!==null ? getMonthSummary(resumoMes) : null

  return (
    <div style={{padding:'20px 20px 32px'}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:16,fontWeight:500}}>Dashboard</h2>
        <p style={{fontSize:12,color:'var(--text2)',marginTop:2}}>Visão geral das presenças em 2026</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:24}}>
        <StatCard label="Membros ativos" value={members.length} sub="grupos ativos"/>
        <StatCard label="Presença geral"  value={`${pct}%`}     sub="Presencial + Zoom"/>
        <StatCard label="Reuniões"         value={totalMtgs}     sub="Qui + Dom"/>
        <StatCard label="Ausências"        value={totalA}        sub={`${Math.round(totalA/(total||1)*100)}% do total`}/>
      </div>

      <div style={{marginBottom:24}}>
        <div style={{fontSize:12,fontWeight:500,color:'var(--text2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
          <i className="ti ti-users" style={{fontSize:14}}/> Presença por grupo
          <span style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>— toque para ver detalhes</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8}}>
          {groupStats.map(g=>(
            <button key={g.name} onClick={()=>setSelGroup(g)} style={{background:'var(--bg)',border:'var(--border)',borderRadius:'var(--radius)',padding:12,cursor:'pointer',textAlign:'left',borderLeft:`3px solid ${g.color}`}}>
              <div style={{fontSize:12,fontWeight:500,color:g.color,marginBottom:3}}>{g.name}</div>
              <div style={{fontSize:11,color:'var(--text2)',marginBottom:8}}>{g.count} membros</div>
              <div style={{height:5,borderRadius:3,background:'var(--bg3)',marginBottom:4}}>
                <div style={{height:5,borderRadius:3,background:g.color,width:`${g.pct}%`}}/>
              </div>
              <div style={{fontSize:11,color:'var(--text2)',display:'flex',justifyContent:'space-between'}}>
                <span>{g.pct}% presença</span>
                <i className="ti ti-chevron-right" style={{fontSize:12}}/>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{marginBottom:24}}>
        <div style={{fontSize:12,fontWeight:500,color:'var(--text2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
          <i className="ti ti-calendar" style={{fontSize:14}}/> Por mês
          <span style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>— toque para ver resumo</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(70px,1fr))',gap:6}}>
          {MONTHS_PT.map((mn,i)=>{
            const s=monthStats(i)
            const p=s.tot>0?Math.round((s.P+s.Z)/s.tot*100):null
            const sel=resumoMes===i
            return (
              <button key={i} onClick={()=>setResumoMes(sel?null:i)} style={{padding:'10px 6px',borderRadius:'var(--radius)',border:sel?`1.5px solid var(--blue)`:'var(--border)',background:sel?'var(--blue-bg)':'var(--bg)',cursor:'pointer',textAlign:'center'}}>
                <div style={{fontSize:12,fontWeight:p!==null?500:400,color:sel?'var(--blue-tx)':'var(--text)'}}>{mn.slice(0,3)}</div>
                <div style={{fontSize:10,color:'var(--text2)',marginTop:2}}>{p!==null?`${p}%`:'—'}</div>
              </button>
            )
          })}
        </div>
      </div>

      {summary && resumoMes!==null && (
        <div style={{background:'var(--bg)',border:'var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden',marginBottom:24}}>
          <div style={{background:'#185FA5',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{color:'#fff',fontWeight:500,fontSize:14}}>Resumo — {MONTHS_PT[resumoMes]} 2026</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>navigate(`/assistencia?mes=${resumoMes}`)} style={{fontSize:11,padding:'3px 10px',borderRadius:20,border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',cursor:'pointer'}}>Ver planilha</button>
              <button onClick={()=>setResumoMes(null)} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',fontSize:18,padding:0}}><i className="ti ti-x"/></button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:1,background:'var(--border-strong)'}}>
            {[
              {label:'Média Semana (Qui)',value:summary.quiMedia,sub:`${summary.quiCount} quintas`,icon:'ti-calendar-week',color:'#185FA5',bg:'#E6F1FB'},
              {label:'Média Fim de Sem. (Dom)',value:summary.domMedia,sub:`${summary.domCount} domingos`,icon:'ti-calendar-event',color:'#993556',bg:'#FBEAF0'},
              {label:'Total Semana (Qui)',value:summary.quiTotal,sub:'soma das quintas',icon:'ti-sum',color:'#185FA5',bg:'#E6F1FB'},
              {label:'Total Fim de Sem. (Dom)',value:summary.domTotal,sub:'soma dos domingos',icon:'ti-sum',color:'#993556',bg:'#FBEAF0'},
            ].map(({label,value,sub,icon,color,bg})=>(
              <div key={label} style={{background:'var(--bg)',padding:'14px 16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <div style={{width:28,height:28,borderRadius:6,background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <i className={`ti ${icon}`} style={{fontSize:15,color}}/>
                  </div>
                  <div style={{fontSize:10,color:'var(--text2)',lineHeight:1.3}}>{label}</div>
                </div>
                <div style={{fontSize:28,fontWeight:500,color}}>{value}</div>
                <div style={{fontSize:10,color:'var(--text2)',marginTop:2}}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{padding:'14px 16px'}}>
            <div style={{fontSize:11,fontWeight:500,color:'var(--text2)',marginBottom:10}}>Detalhamento por reunião</div>
            {['qui','dom'].map(tipo=>{
              const cor=tipo==='qui'?'#185FA5':'#993556'
              const label=tipo==='qui'?'Quintas-feiras':'Domingos'
              const icon=tipo==='qui'?'ti-calendar-week':'ti-calendar-event'
              const total=tipo==='qui'?summary.quiTotal:summary.domTotal
              const media=tipo==='qui'?summary.quiMedia:summary.domMedia
              return (
                <div key={tipo} style={{marginBottom:tipo==='qui'?14:0}}>
                  <div style={{fontSize:11,fontWeight:500,color:cor,marginBottom:6,display:'flex',alignItems:'center',gap:5}}>
                    <i className={`ti ${icon}`} style={{fontSize:13}}/> {label}
                  </div>
                  <div style={{background:'var(--bg2)',borderRadius:'var(--radius)',overflow:'hidden'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead>
                        <tr style={{background:'var(--bg3)'}}>
                          <th style={{padding:'7px 10px',textAlign:'left',fontWeight:500,fontSize:11,color:'var(--text2)'}}>Data</th>
                          <th style={{padding:'7px 8px',textAlign:'center',fontWeight:500,fontSize:11,color:'var(--att-P-tx)'}}>Pres.</th>
                          <th style={{padding:'7px 8px',textAlign:'center',fontWeight:500,fontSize:11,color:'var(--att-Z-tx)'}}>Zoom</th>
                          <th style={{padding:'7px 8px',textAlign:'center',fontWeight:500,fontSize:11,color:'var(--amber-tx)'}}>Visit.</th>
                          <th style={{padding:'7px 10px',textAlign:'center',fontWeight:500,fontSize:11,color:'var(--text2)'}}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.dates.filter(d=>d.type===tipo).map(d=>(
                          <tr key={d.date} style={{borderTop:'var(--border)'}}>
                            <td style={{padding:'7px 10px',color:'var(--text)'}}>{tipo==='qui'?'Qui':'Dom'} {d.day}/{resumoMes+1}</td>
                            <td style={{padding:'7px 8px',textAlign:'center',color:'var(--att-P-tx)',fontWeight:500}}>{d.P}</td>
                            <td style={{padding:'7px 8px',textAlign:'center',color:'var(--att-Z-tx)',fontWeight:500}}>{d.Z}</td>
                            <td style={{padding:'7px 8px',textAlign:'center',color:'var(--amber-tx)',fontWeight:500}}>{d.E}</td>
                            <td style={{padding:'7px 10px',textAlign:'center',fontWeight:600}}>{d.total}</td>
                          </tr>
                        ))}
                        <tr style={{borderTop:'1.5px solid var(--border-strong)',background:'var(--bg3)'}}>
                          <td style={{padding:'7px 10px',fontWeight:500,fontSize:11,color:'var(--text2)'}}>Total / Média</td>
                          <td colSpan={3}/>
                          <td style={{padding:'7px 10px',textAlign:'center',fontWeight:600,color:cor}}>{total} / {media}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selGroup && <GroupDetailModal group={selGroup} members={members} attendance={attendance} events={events} onClose={()=>setSelGroup(null)}/>}
    </div>
  )
}
