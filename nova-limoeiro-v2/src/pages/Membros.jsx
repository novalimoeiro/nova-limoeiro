import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useMembers } from '../lib/useMembers.jsx'
import { useGroups } from '../lib/useGroups.jsx'
import { initials } from '../lib/data'

const PRIVILEGES = ['Publicador','Pioneiro Auxiliar','Pioneiro Regular','Ancião','Servo Ministerial']
const PALETTE = [
  {color:'#639922',bg:'#EAF3DE',tx:'#3B6D11',label:'Verde'},
  {color:'#185FA5',bg:'#E6F1FB',tx:'#0C447C',label:'Azul'},
  {color:'#993556',bg:'#FBEAF0',tx:'#72243E',label:'Rosa'},
  {color:'#5F5E5A',bg:'#F1EFE8',tx:'#444441',label:'Cinza'},
  {color:'#854F0B',bg:'#FAEEDA',tx:'#633806',label:'Âmbar'},
  {color:'#1D9E75',bg:'#E1F5EE',tx:'#085041',label:'Teal'},
  {color:'#7F77DD',bg:'#EEEDFE',tx:'#3C3489',label:'Roxo'},
  {color:'#D85A30',bg:'#FAECE7',tx:'#4A1B0C',label:'Coral'},
]
const EM = {name:'',group_name:'',address:'',number:'',complement:'',cep:'',neighborhood:'',birthdate:'',phone_home:'',phone_cell:'',privilege:'Publicador'}
const EG = {name:'',color:'#639922',bg:'#EAF3DE',tx:'#3B6D11'}

function fmtDate(d) { if(!d) return ''; const [y,m,day]=d.split('-'); return `${day}/${m}/${y}` }

export default function Membros() {
  const {members,loading:mL,invalidate:mI} = useMembers()
  const {groups, loading:gL,invalidate:gI}  = useGroups()
  const [view,      setView]    = useState('list')
  const [search,    setSearch]  = useState('')
  const [gFilter,   setGFilter] = useState('all')
  const [modal,     setModal]   = useState(null)
  const [editing,   setEditing] = useState(false)
  const [isNew,     setIsNew]   = useState(false)
  const [sel,       setSel]     = useState(null)
  const [selG,      setSelG]    = useState(null)
  const [mForm,     setMForm]   = useState(EM)
  const [gForm,     setGForm]   = useState(EG)
  const [saving,    setSaving]  = useState(false)
  const [confDel,   setConfDel] = useState(null)
  const [confDelG,  setConfDelG]= useState(null)
  const dragRef = useRef(null)

  function gs(name) { return groups.find(g=>g.name===name)||{color:'#888',bg:'#eee',tx:'#444'} }

  const filtered = members.filter(m=>
    m.name.toLowerCase().includes(search.toLowerCase()) &&
    (gFilter==='all'||m.group_name===gFilter)
  )
  const byGroup={}
  groups.forEach(g=>{byGroup[g.name]=[]})
  filtered.forEach(m=>{if(!byGroup[m.group_name])byGroup[m.group_name]=[];byGroup[m.group_name].push(m)})

  function openAdd() { setMForm({...EM,group_name:groups[0]?.name||''}); setEditing(true); setIsNew(true); setSel(null); setModal('member') }
  function openView(m) { setSel(m); setMForm({name:m.name||'',group_name:m.group_name||'',address:m.address||'',number:m.number||'',complement:m.complement||'',cep:m.cep||'',neighborhood:m.neighborhood||'',birthdate:m.birthdate||'',phone_home:m.phone_home||'',phone_cell:m.phone_cell||'',privilege:m.privilege||'Publicador'}); setEditing(false); setIsNew(false); setModal('member') }
  function mf(k,v) { setMForm(f=>({...f,[k]:v})) }

  async function saveMember() {
    if(!mForm.name.trim()) return
    setSaving(true)
    const p={name:mForm.name.trim(),group_name:mForm.group_name,address:mForm.address||null,number:mForm.number||null,complement:mForm.complement||null,cep:mForm.cep||null,neighborhood:mForm.neighborhood||null,birthdate:mForm.birthdate||null,phone_home:mForm.phone_home||null,phone_cell:mForm.phone_cell||null,privilege:mForm.privilege||'Publicador',active:true,updated_at:new Date().toISOString()}
    if(isNew) await supabase.from('members').insert(p)
    else await supabase.from('members').update(p).eq('id',sel.id)
    setSaving(false); setModal(null); mI()
  }

  async function deactivate(m) { setSaving(true); await supabase.from('members').update({active:false,updated_at:new Date().toISOString()}).eq('id',m.id); setSaving(false); setConfDel(null); setModal(null); mI() }

  function openNewGroup() { setGForm(EG); setModal('newgroup') }
  function openEditGroup(g) { setSelG(g); setGForm({name:g.name,color:g.color,bg:g.bg,tx:g.tx}); setModal('editgroup') }
  function gf(k,v) { setGForm(f=>({...f,[k]:v})) }
  function pickPal(p) { setGForm(f=>({...f,color:p.color,bg:p.bg,tx:p.tx})) }

  async function saveGroup() {
    if(!gForm.name.trim()) return
    setSaving(true)
    if(modal==='newgroup') { await supabase.from('groups').insert({name:gForm.name.trim(),color:gForm.color,bg:gForm.bg,tx:gForm.tx,active:true,sort_order:groups.length+1}) }
    else { await supabase.from('groups').update({name:gForm.name.trim(),color:gForm.color,bg:gForm.bg,tx:gForm.tx}).eq('id',selG.id); if(gForm.name.trim()!==selG.name) await supabase.from('members').update({group_name:gForm.name.trim()}).eq('group_name',selG.name) }
    setSaving(false); setModal(null); gI(); mI()
  }

  async function deactivateGroup(g) { setSaving(true); await supabase.from('groups').update({active:false}).eq('id',g.id); setSaving(false); setConfDelG(null); gI() }

  async function onDrop(e, groupName) {
    e.preventDefault()
    const m=dragRef.current
    if(!m||m.group_name===groupName) return
    await supabase.from('members').update({group_name:groupName,updated_at:new Date().toISOString()}).eq('id',m.id)
    dragRef.current=null; mI()
  }

  const g = sel ? gs(sel.group_name) : (mForm.group_name ? gs(mForm.group_name) : null)

  return (
    <div style={{padding:'20px 20px 40px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{flex:1}}>
          <h2 style={{fontSize:16,fontWeight:500}}>Membros</h2>
          <p style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{members.length} membros · {groups.length} grupos</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn" onClick={openNewGroup}><i className="ti ti-folder-plus"/> Novo grupo</button>
          <button className={`btn ${view==='drag'?'btn-primary':''}`} onClick={()=>setView(v=>v==='drag'?'list':'drag')}>
            <i className="ti ti-drag-drop"/> {view==='drag'?'Sair':'Reorganizar'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}><i className="ti ti-plus"/> Novo membro</button>
        </div>
      </div>

      {view==='drag' && (
        <div style={{background:'var(--blue-bg)',border:'0.5px solid var(--blue)',borderRadius:'var(--radius)',padding:'10px 14px',marginBottom:16,fontSize:12,color:'var(--blue-tx)',display:'flex',alignItems:'center',gap:8}}>
          <i className="ti ti-info-circle" style={{fontSize:16}}/>
          Arraste os membros entre os grupos. Mudanças salvas automaticamente.
        </div>
      )}

      {view==='list' && (
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <input type="search" placeholder="Buscar pelo nome…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{fontSize:13,padding:'6px 10px',border:'var(--border)',borderRadius:'var(--radius)',background:'var(--bg)',color:'var(--text)',width:210}}/>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            <button className={`pill ${gFilter==='all'?'on':''}`} onClick={()=>setGFilter('all')}>Todos</button>
            {groups.map(g=><button key={g.id} className={`pill ${gFilter===g.name?'on':''}`} onClick={()=>setGFilter(g.name)}>{g.name.split(' ')[0]}</button>)}
          </div>
        </div>
      )}

      {(mL||gL) && <p style={{color:'var(--text2)',fontSize:13}}>Carregando…</p>}

      {view==='list' && !mL && !gL && Object.entries(byGroup).map(([grp,mems])=>{
        if(mems.length===0&&gFilter!=='all') return null
        const g=gs(grp), grpObj=groups.find(gr=>gr.name===grp)
        return (
          <div key={grp} style={{marginBottom:24}}>
            <div style={{fontSize:15,fontWeight:600,color:g.color,marginBottom:10,display:'flex',alignItems:'center',gap:8,borderLeft:`3px solid ${g.color}`,paddingLeft:10}}>
              {grp} <span style={{fontWeight:400,color:'var(--text2)',fontSize:13}}>({mems.length})</span>
              {grpObj && <button onClick={()=>openEditGroup(grpObj)} style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:14,padding:'0 4px'}}><i className="ti ti-settings"/></button>}
            </div>
            {mems.length===0 ? <div style={{fontSize:12,color:'var(--text2)',fontStyle:'italic'}}>Nenhum membro neste grupo</div> : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
                {mems.map(m=>(
                  <div key={m.id} style={{background:'var(--bg)',border:'var(--border)',borderRadius:'var(--radius)',padding:'10px 12px',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:g.bg,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:500,color:g.tx}}>{initials(m.name)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name}</div>
                      <div style={{fontSize:11,color:'var(--text2)'}}>{m.privilege||'Publicador'}</div>
                    </div>
                    <div style={{display:'flex',gap:2,flexShrink:0}}>
                      <button onClick={()=>openView(m)} title="Ver detalhes" style={{background:'none',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:16,padding:3}}><i className="ti ti-eye"/></button>
                      <button onClick={()=>setConfDel(m)} title="Desativar" style={{background:'none',border:'none',color:'var(--red-tx)',cursor:'pointer',fontSize:16,padding:3}}><i className="ti ti-user-minus"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {view==='drag' && !mL && !gL && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12,alignItems:'start'}}>
          {groups.map(grp=>{
            const gm=members.filter(m=>m.group_name===grp.name)
            return (
              <div key={grp.id} onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,grp.name)}
                style={{background:'var(--bg)',border:`2px dashed ${grp.color}50`,borderRadius:'var(--radius-lg)',padding:10,minHeight:80}}>
                <div style={{fontSize:13,fontWeight:600,color:grp.color,marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${grp.bg}`,display:'flex',alignItems:'center',gap:6}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:grp.color,flexShrink:0}}/>
                  {grp.name} <span style={{fontWeight:400,color:'var(--text2)',fontSize:11}}>({gm.length})</span>
                </div>
                {gm.length===0&&<div style={{fontSize:11,color:'var(--text2)',textAlign:'center',padding:'12px 0',fontStyle:'italic'}}>Solte aqui</div>}
                {gm.map(m=>(
                  <div key={m.id} draggable onDragStart={()=>{dragRef.current=m}}
                    style={{background:`${grp.color}20`,borderRadius:'var(--radius)',padding:'7px 10px',marginBottom:6,cursor:'grab',display:'flex',alignItems:'center',gap:8,userSelect:'none'}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(255,255,255,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:600,color:grp.color,flexShrink:0}}>{initials(m.name)}</div>
                    <div style={{fontSize:12,fontWeight:500,color:grp.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{m.name}</div>
                    <i className="ti ti-grip-vertical" style={{fontSize:14,color:`${grp.color}80`,flexShrink:0}}/>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* MEMBER MODAL */}
      {modal==='member' && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,paddingBottom:14,borderBottom:'var(--border)'}}>
              {g && <div style={{width:48,height:48,borderRadius:'50%',background:g.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:600,color:g.tx,flexShrink:0}}>{initials(mForm.name||'?')}</div>}
              <div style={{flex:1,minWidth:0}}>
                {editing ? (
                  <input type="text" value={mForm.name} onChange={e=>mf('name',e.target.value)} placeholder="Nome completo *" autoFocus
                    style={{width:'100%',fontSize:15,fontWeight:600,border:'none',borderBottom:'2px solid var(--blue)',background:'transparent',color:'var(--text)',padding:'2px 0',outline:'none'}}/>
                ) : <div style={{fontSize:15,fontWeight:600}}>{mForm.name}</div>}
                {editing ? (
                  <select value={mForm.group_name} onChange={e=>mf('group_name',e.target.value)} style={{fontSize:12,marginTop:4,border:'none',background:'transparent',color:g?.color||'var(--text2)',fontWeight:500,cursor:'pointer',padding:0}}>
                    {groups.map(gr=><option key={gr.id} value={gr.name}>{gr.name}</option>)}
                  </select>
                ) : <div style={{fontSize:12,color:g?.color,fontWeight:500,marginTop:2}}>{mForm.group_name}</div>}
                {editing ? (
                  <select value={mForm.privilege} onChange={e=>mf('privilege',e.target.value)} style={{fontSize:11,marginTop:2,border:'none',background:'transparent',color:'var(--text2)',cursor:'pointer',padding:0}}>
                    {PRIVILEGES.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                ) : <div style={{fontSize:11,color:'var(--text2)',marginTop:2,opacity:0.7}}>{mForm.privilege||'Publicador'}</div>}
              </div>
              {!editing&&!isNew&&<div style={{color:'var(--text3)',fontSize:18}}><i className="ti ti-lock"/></div>}
            </div>

            <div style={{opacity:editing?1:0.5,pointerEvents:editing?'auto':'none',transition:'opacity .2s'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
                <div style={{gridColumn:'1/-1'}} className="field">
                  <label><i className="ti ti-cake" style={{fontSize:12}}/> Data de Nascimento</label>
                  <input type="date" value={mForm.birthdate} onChange={e=>mf('birthdate',e.target.value)}/>
                </div>
                <div style={{gridColumn:'1/-1'}} className="field">
                  <label><i className="ti ti-map-pin" style={{fontSize:12}}/> Endereço</label>
                  <input type="text" value={mForm.address} onChange={e=>mf('address',e.target.value)} placeholder="Rua / Av."/>
                </div>
                <div className="field"><label>N.°</label><input type="text" value={mForm.number} onChange={e=>mf('number',e.target.value)} placeholder="Número"/></div>
                <div className="field"><label>Casa / AP</label><input type="text" value={mForm.complement} onChange={e=>mf('complement',e.target.value)} placeholder="Complemento"/></div>
                <div className="field"><label>CEP</label><input type="text" value={mForm.cep} onChange={e=>mf('cep',e.target.value)} placeholder="00000-000"/></div>
                <div className="field"><label>Bairro</label><input type="text" value={mForm.neighborhood} onChange={e=>mf('neighborhood',e.target.value)} placeholder="Bairro"/></div>
                <div className="field"><label><i className="ti ti-phone" style={{fontSize:12}}/> Tel. Residencial</label><input type="tel" value={mForm.phone_home} onChange={e=>mf('phone_home',e.target.value)} placeholder="(00) 0000-0000"/></div>
                <div className="field"><label><i className="ti ti-brand-whatsapp" style={{fontSize:12,color:'#25D366'}}/> Celular</label><input type="tel" value={mForm.phone_cell} onChange={e=>mf('phone_cell',e.target.value)} placeholder="(00) 00000-0000"/></div>
              </div>
            </div>

            {!editing && (mForm.phone_home||mForm.phone_cell) && (
              <div style={{display:'flex',gap:10,marginTop:8,paddingTop:8,borderTop:'var(--border)'}}>
                {mForm.phone_home && <a href={`tel:${mForm.phone_home}`} style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--blue)',textDecoration:'none'}}><i className="ti ti-phone" style={{fontSize:14}}/> Ligar</a>}
                {mForm.phone_cell && <a href={`https://wa.me/55${mForm.phone_cell.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'#25D366',textDecoration:'none'}}><i className="ti ti-brand-whatsapp" style={{fontSize:14}}/> WhatsApp</a>}
              </div>
            )}

            <div style={{display:'flex',gap:8,marginTop:16}}>
              {editing ? (
                <>
                  <button className="btn btn-primary" onClick={saveMember} disabled={saving||!mForm.name.trim()} style={{flex:1,justifyContent:'center'}}><i className="ti ti-device-floppy"/> {saving?'Salvando…':'Salvar'}</button>
                  <button className="btn" onClick={()=>isNew?setModal(null):setEditing(false)} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={()=>setEditing(true)} style={{flex:1,justifyContent:'center'}}><i className="ti ti-edit"/> Editar</button>
                  <button className="btn" onClick={()=>setConfDel(sel)} style={{flex:1,justifyContent:'center',borderColor:'var(--red-tx)',color:'var(--red-tx)'}}><i className="ti ti-user-minus"/> Desativar</button>
                  <button className="btn" onClick={()=>setModal(null)} style={{justifyContent:'center',padding:'8px 12px'}}><i className="ti ti-x"/></button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GROUP MODAL */}
      {(modal==='newgroup'||modal==='editgroup') && (
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:340}} onClick={e=>e.stopPropagation()}>
            <h3>{modal==='newgroup'?'Novo grupo':'Editar grupo'}</h3>
            <div className="sub" style={{marginBottom:14}}>{modal==='editgroup'?selG?.name:'Defina nome e cor'}</div>
            <div className="field"><label>Nome *</label><input type="text" value={gForm.name} onChange={e=>gf('name',e.target.value)} placeholder="Nome do grupo" autoFocus/></div>
            <div className="field">
              <label>Cor</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:4}}>
                {PALETTE.map(p=>(
                  <button key={p.color} onClick={()=>pickPal(p)} style={{height:36,borderRadius:'var(--radius)',border:`2px solid ${gForm.color===p.color?p.color:'transparent'}`,background:p.bg,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4,fontSize:11,color:p.tx}}>
                    <span style={{width:10,height:10,borderRadius:'50%',background:p.color,flexShrink:0}}/>{p.label}
                  </button>
                ))}
              </div>
            </div>
            {modal==='editgroup' && <button onClick={()=>{setConfDelG(selG);setModal(null)}} style={{width:'100%',padding:'8px',border:'0.5px solid var(--red-tx)',borderRadius:'var(--radius)',background:'none',color:'var(--red-tx)',fontSize:12,cursor:'pointer',marginBottom:8}}><i className="ti ti-trash"/> Excluir grupo</button>}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary" onClick={saveGroup} disabled={saving||!gForm.name.trim()} style={{flex:1,justifyContent:'center'}}>{saving?'Salvando…':'Salvar'}</button>
              <button className="btn" onClick={()=>setModal(null)} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confDel && (
        <div className="modal-overlay" onClick={()=>setConfDel(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Desativar membro</h3>
            <div className="sub"><strong>{confDel.name}</strong> será removido da lista ativa. O histórico é mantido.</div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button className="btn" onClick={()=>deactivate(confDel)} disabled={saving} style={{flex:1,justifyContent:'center',borderColor:'var(--red-tx)',color:'var(--red-tx)'}}>{saving?'Aguarde…':'Confirmar'}</button>
              <button className="btn" onClick={()=>setConfDel(null)} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confDelG && (
        <div className="modal-overlay" onClick={()=>setConfDelG(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Excluir grupo</h3>
            <div className="sub"><strong>{confDelG.name}</strong> será removido. Mova os membros antes de excluir.</div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button className="btn" onClick={()=>deactivateGroup(confDelG)} disabled={saving} style={{flex:1,justifyContent:'center',borderColor:'var(--red-tx)',color:'var(--red-tx)'}}>{saving?'Aguarde…':'Confirmar'}</button>
              <button className="btn" onClick={()=>setConfDelG(null)} style={{flex:1,justifyContent:'center'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
