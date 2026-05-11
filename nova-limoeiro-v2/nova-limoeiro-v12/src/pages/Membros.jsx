import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useMembers } from '../lib/useMembers.jsx'
import { useGroups } from '../lib/useGroups.jsx'
import { initials } from '../lib/data'

const PRIVILEGES = ['Publicador','Pioneiro Auxiliar','Pioneiro Regular','Ancião','Servo Ministerial']
const PALETTE = [
  { color:'#639922',bg:'#EAF3DE',tx:'#3B6D11',label:'Verde'  },
  { color:'#185FA5',bg:'#E6F1FB',tx:'#0C447C',label:'Azul'   },
  { color:'#993556',bg:'#FBEAF0',tx:'#72243E',label:'Rosa'   },
  { color:'#5F5E5A',bg:'#F1EFE8',tx:'#444441',label:'Cinza'  },
  { color:'#854F0B',bg:'#FAEEDA',tx:'#633806',label:'Âmbar'  },
  { color:'#1D9E75',bg:'#E1F5EE',tx:'#085041',label:'Teal'   },
  { color:'#7F77DD',bg:'#EEEDFE',tx:'#3C3489',label:'Roxo'   },
  { color:'#D85A30',bg:'#FAECE7',tx:'#4A1B0C',label:'Coral'  },
]
const EMPTY_MEMBER = { name:'',group_name:'',address:'',number:'',complement:'',cep:'',neighborhood:'',birthdate:'',phone_home:'',phone_cell:'',privilege:'Publicador' }
const EMPTY_GROUP  = { name:'',color:'#639922',bg:'#EAF3DE',tx:'#3B6D11' }

function formatDate(d) {
  if (!d) return ''
  const [y,m,day] = d.split('-')
  return `${day}/${m}/${y}`
}

// Field component — shows value or input depending on editing mode
function Field({ label, icon, value, editing, type='text', children, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize:10, color:'var(--text2)', marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize:12 }} aria-hidden="true"/>}
        {label}
      </div>
      {editing ? (
        children || (
          <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ width:'100%', padding:'7px 10px', border:'var(--border-strong)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)', fontSize:13, fontFamily:'var(--font)' }} />
        )
      ) : (
        <div style={{ fontSize:13, color: value ? 'var(--text)' : 'var(--text3)', opacity: value ? 1 : 0.5, padding:'7px 0', borderBottom:'var(--border)' }}>
          {value || '—'}
        </div>
      )}
    </div>
  )
}

export default function Membros() {
  const { members, loading: mLoading, invalidate: mInvalidate } = useMembers()
  const { groups,  loading: gLoading, invalidate: gInvalidate  } = useGroups()

  const [view,        setView]       = useState('list')
  const [search,      setSearch]     = useState('')
  const [gFilter,     setGFilter]    = useState('all')
  const [modal,       setModal]      = useState(null)   // null | 'member' | 'newgroup' | 'editgroup'
  const [editing,     setEditing]    = useState(false)  // inside member modal
  const [selected,    setSelected]   = useState(null)
  const [selGroup,    setSelGroup]   = useState(null)
  const [mForm,       setMForm]      = useState(EMPTY_MEMBER)
  const [gForm,       setGForm]      = useState(EMPTY_GROUP)
  const [saving,      setSaving]     = useState(false)
  const [confirmDel,  setConfirmDel] = useState(null)
  const [confirmDelG, setConfirmDelG]= useState(null)
  const [isNew,       setIsNew]      = useState(false)
  const dragMember    = useRef(null)

  const loading = mLoading || gLoading
  function gs(name) { return groups.find(g => g.name === name) || { color:'#888', bg:'#eee', tx:'#444' } }

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) &&
    (gFilter === 'all' || m.group_name === gFilter)
  )
  const byGroup = {}
  groups.forEach(g => { byGroup[g.name] = [] })
  filtered.forEach(m => { if (!byGroup[m.group_name]) byGroup[m.group_name] = []; byGroup[m.group_name].push(m) })

  // Open member modal in VIEW mode (read-only)
  function openView(m) {
    setSelected(m)
    setMForm({ name:m.name||'', group_name:m.group_name||'', address:m.address||'', number:m.number||'', complement:m.complement||'', cep:m.cep||'', neighborhood:m.neighborhood||'', birthdate:m.birthdate||'', phone_home:m.phone_home||'', phone_cell:m.phone_cell||'', privilege:m.privilege||'Publicador' })
    setEditing(false)
    setIsNew(false)
    setModal('member')
  }

  // Open member modal in ADD mode (editing)
  function openAdd() {
    setSelected(null)
    setMForm({ ...EMPTY_MEMBER, group_name: groups[0]?.name || '' })
    setEditing(true)
    setIsNew(true)
    setModal('member')
  }

  function mf(key, val) { setMForm(f => ({ ...f, [key]: val })) }

  async function saveMember() {
    if (!mForm.name.trim()) return
    setSaving(true)
    const payload = {
      name: mForm.name.trim(), group_name: mForm.group_name,
      address: mForm.address||null, number: mForm.number||null,
      complement: mForm.complement||null, cep: mForm.cep||null,
      neighborhood: mForm.neighborhood||null, birthdate: mForm.birthdate||null,
      phone_home: mForm.phone_home||null, phone_cell: mForm.phone_cell||null,
      privilege: mForm.privilege||'Publicador',
      active: true, updated_at: new Date().toISOString(),
    }
    if (isNew) {
      await supabase.from('members').insert(payload)
    } else {
      await supabase.from('members').update(payload).eq('id', selected.id)
    }
    setSaving(false)
    setModal(null)
    mInvalidate()
  }

  async function deactivateMember(member) {
    setSaving(true)
    await supabase.from('members').update({ active:false, updated_at:new Date().toISOString() }).eq('id', member.id)
    setSaving(false); setConfirmDel(null); setModal(null); mInvalidate()
  }

  // Group modal
  function openNewGroup() { setGForm(EMPTY_GROUP); setModal('newgroup') }
  function openEditGroup(g) { setSelGroup(g); setGForm({ name:g.name, color:g.color, bg:g.bg, tx:g.tx }); setModal('editgroup') }
  function gf(key, val) { setGForm(f => ({ ...f, [key]: val })) }
  function pickPalette(p) { setGForm(f => ({ ...f, color:p.color, bg:p.bg, tx:p.tx })) }

  async function saveGroup() {
    if (!gForm.name.trim()) return
    setSaving(true)
    if (modal === 'newgroup') {
      await supabase.from('groups').insert({ name:gForm.name.trim(), color:gForm.color, bg:gForm.bg, tx:gForm.tx, active:true, sort_order:groups.length+1 })
    } else {
      await supabase.from('groups').update({ name:gForm.name.trim(), color:gForm.color, bg:gForm.bg, tx:gForm.tx }).eq('id', selGroup.id)
      if (gForm.name.trim() !== selGroup.name) {
        await supabase.from('members').update({ group_name:gForm.name.trim() }).eq('group_name', selGroup.name)
      }
    }
    setSaving(false); setModal(null); gInvalidate(); mInvalidate()
  }

  async function deactivateGroup(g) {
    setSaving(true)
    await supabase.from('groups').update({ active:false }).eq('id', g.id)
    setSaving(false); setConfirmDelG(null); gInvalidate()
  }

  // Drag and drop
  async function onDrop(e, groupName) {
    e.preventDefault()
    const m = dragMember.current
    if (!m || m.group_name === groupName) return
    await supabase.from('members').update({ group_name:groupName, updated_at:new Date().toISOString() }).eq('id', m.id)
    dragMember.current = null; mInvalidate()
  }

  const g = selected ? gs(selected.group_name) : (mForm.group_name ? gs(mForm.group_name) : null)

  return (
    <div style={{ padding:'20px 20px 40px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:16, fontWeight:500 }}>Membros</h2>
          <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{members.length} membros · {groups.length} grupos</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn" onClick={openNewGroup}><i className="ti ti-folder-plus" aria-hidden="true"/> Novo grupo</button>
          <button className={`btn ${view==='drag'?'btn-primary':''}`} onClick={() => setView(v => v==='drag'?'list':'drag')}>
            <i className="ti ti-drag-drop" aria-hidden="true"/> {view==='drag'?'Sair':'Reorganizar'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}><i className="ti ti-plus" aria-hidden="true"/> Novo membro</button>
        </div>
      </div>

      {/* Drag mode banner */}
      {view === 'drag' && (
        <div style={{ background:'#E6F1FB', border:'0.5px solid #85B7EB', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:16, fontSize:12, color:'#0C447C', display:'flex', alignItems:'center', gap:8 }}>
          <i className="ti ti-info-circle" style={{ fontSize:16 }} aria-hidden="true"/>
          Arraste os membros entre os grupos. Mudanças salvas automaticamente.
        </div>
      )}

      {/* Filters — list mode */}
      {view === 'list' && (
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <input type="search" placeholder="Buscar pelo nome…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ fontSize:13, padding:'6px 10px', border:'var(--border)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--text)', width:210 }} />
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            <button className={`pill ${gFilter==='all'?'on':''}`} onClick={() => setGFilter('all')}>Todos</button>
            {groups.map(g => (
              <button key={g.id} className={`pill ${gFilter===g.name?'on':''}`} onClick={() => setGFilter(g.name)}>{g.name.split(' ')[0]}</button>
            ))}
          </div>
        </div>
      )}

      {loading && <p style={{ color:'var(--text2)', fontSize:13 }}>Carregando…</p>}

      {/* LIST VIEW */}
      {view === 'list' && !loading && Object.entries(byGroup).map(([grp, mems]) => {
        if (mems.length === 0 && gFilter !== 'all') return null
        const g = gs(grp)
        const grpObj = groups.find(gr => gr.name === grp)
        return (
          <div key={grp} style={{ marginBottom:24 }}>
            <div style={{ fontSize:15, fontWeight:600, color:g.tx, marginBottom:10, display:'flex', alignItems:'center', gap:8, borderLeft:`3px solid ${g.color}`, paddingLeft:10 }}>
              {grp}
              <span style={{ fontWeight:400, color:'var(--text2)', fontSize:13 }}>({mems.length})</span>
              {grpObj && (
                <button onClick={() => openEditGroup(grpObj)} title="Editar grupo"
                  style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:14, padding:'0 4px' }}>
                  <i className="ti ti-settings" aria-hidden="true"/>
                </button>
              )}
            </div>
            {mems.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--text2)', fontStyle:'italic' }}>Nenhum membro neste grupo</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8 }}>
                {mems.map(m => (
                  <div key={m.id} style={{ background:'var(--bg)', border:'var(--border)', borderRadius:'var(--radius)', padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:g.bg, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, color:g.tx }}>
                      {initials(m.name)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</div>
                      <div style={{ fontSize:11, color:'var(--text2)' }}>{m.privilege||'Publicador'}</div>
                    </div>
                    <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                      <button onClick={() => openView(m)} title="Ver detalhes"
                        style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:16, padding:3 }}>
                        <i className="ti ti-eye" aria-hidden="true"/>
                      </button>
                      <button onClick={() => setConfirmDel(m)} title="Desativar"
                        style={{ background:'none', border:'none', color:'var(--red-tx)', cursor:'pointer', fontSize:16, padding:3 }}>
                        <i className="ti ti-user-minus" aria-hidden="true"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* DRAG VIEW */}
      {view === 'drag' && !loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12, alignItems:'start' }}>
          {groups.map(grp => {
            const gm = members.filter(m => m.group_name === grp.name)
            return (
              <div key={grp.id}
                onDragOver={e => e.preventDefault()}
                onDrop={e => onDrop(e, grp.name)}
                style={{ background:'var(--bg)', border:`2px dashed ${grp.color}50`, borderRadius:'var(--radius-lg)', padding:10, minHeight:80 }}>
                <div style={{ fontSize:13, fontWeight:600, color:grp.tx, marginBottom:8, paddingBottom:8, borderBottom:`1px solid ${grp.bg}`, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:grp.color, flexShrink:0 }}/>
                  {grp.name} <span style={{ fontWeight:400, color:'var(--text2)', fontSize:11 }}>({gm.length})</span>
                </div>
                {gm.length === 0 && <div style={{ fontSize:11, color:'var(--text2)', textAlign:'center', padding:'12px 0', fontStyle:'italic' }}>Solte aqui</div>}
                {gm.map(m => (
                  <div key={m.id} draggable onDragStart={() => { dragMember.current = m }}
                    style={{ background:grp.bg, borderRadius:'var(--radius)', padding:'7px 10px', marginBottom:6, cursor:'grab', display:'flex', alignItems:'center', gap:8, userSelect:'none' }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:600, color:grp.tx, flexShrink:0 }}>
                      {initials(m.name)}
                    </div>
                    <div style={{ fontSize:12, fontWeight:500, color:grp.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{m.name}</div>
                    <i className="ti ti-grip-vertical" style={{ fontSize:14, color:`${grp.tx}80`, flexShrink:0 }} aria-hidden="true"/>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MEMBER MODAL (view + edit unified) ── */}
      {modal === 'member' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, paddingBottom:14, borderBottom:'var(--border)' }}>
              {g && (
                <div style={{ width:48, height:48, borderRadius:'50%', background:g.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:600, color:g.tx, flexShrink:0, opacity: editing ? 1 : 0.8 }}>
                  {initials(mForm.name || '?')}
                </div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                {editing ? (
                  <input type="text" value={mForm.name} onChange={e => mf('name',e.target.value)}
                    placeholder="Nome completo *" autoFocus
                    style={{ width:'100%', fontSize:15, fontWeight:600, border:'none', borderBottom:'2px solid var(--blue)', background:'transparent', color:'var(--text)', padding:'2px 0', outline:'none' }} />
                ) : (
                  <div style={{ fontSize:15, fontWeight:600 }}>{mForm.name}</div>
                )}
                {/* Group selector or display */}
                {editing ? (
                  <select value={mForm.group_name} onChange={e => mf('group_name',e.target.value)}
                    style={{ fontSize:12, marginTop:4, border:'none', background:'transparent', color: g?.tx||'var(--text2)', fontWeight:500, cursor:'pointer', padding:0 }}>
                    {groups.map(gr => <option key={gr.id} value={gr.name}>{gr.name}</option>)}
                  </select>
                ) : (
                  <div style={{ fontSize:12, color: g?.tx||'var(--text2)', fontWeight:500, marginTop:2 }}>{mForm.group_name}</div>
                )}
                {editing ? (
                  <select value={mForm.privilege} onChange={e => mf('privilege',e.target.value)}
                    style={{ fontSize:11, marginTop:2, border:'none', background:'transparent', color:'var(--text2)', cursor:'pointer', padding:0 }}>
                    {PRIVILEGES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:2, opacity:0.7 }}>{mForm.privilege||'Publicador'}</div>
                )}
              </div>
              {/* Edit lock icon */}
              {!editing && !isNew && (
                <div title="Clique em Editar para alterar" style={{ color:'var(--text3)', fontSize:18 }}>
                  <i className="ti ti-lock" aria-hidden="true"/>
                </div>
              )}
            </div>

            {/* Fields */}
            <div style={{ opacity: editing ? 1 : 0.55, pointerEvents: editing ? 'auto' : 'none', transition:'opacity .2s' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="Data de Nascimento" icon="ti-cake" value={editing ? mForm.birthdate : formatDate(mForm.birthdate)} editing={editing} type="date" onChange={v => mf('birthdate',v)} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="Endereço" icon="ti-map-pin" value={mForm.address} editing={editing} onChange={v => mf('address',v)} placeholder="Rua / Av." />
                </div>
                <Field label="N.°" value={mForm.number} editing={editing} onChange={v => mf('number',v)} placeholder="Número" />
                <Field label="Casa / AP" value={mForm.complement} editing={editing} onChange={v => mf('complement',v)} placeholder="Complemento" />
                <Field label="CEP" value={mForm.cep} editing={editing} onChange={v => mf('cep',v)} placeholder="00000-000" />
                <Field label="Bairro" value={mForm.neighborhood} editing={editing} onChange={v => mf('neighborhood',v)} placeholder="Bairro" />
                <Field label="Tel. Residencial" icon="ti-phone" value={mForm.phone_home} editing={editing} type="tel" onChange={v => mf('phone_home',v)} placeholder="(00) 0000-0000" />
                <Field label="Celular (WhatsApp)" icon="ti-brand-whatsapp" value={mForm.phone_cell} editing={editing} type="tel" onChange={v => mf('phone_cell',v)} placeholder="(00) 00000-0000" />
              </div>
            </div>

            {/* Links when viewing */}
            {!editing && (mForm.phone_home || mForm.phone_cell) && (
              <div style={{ display:'flex', gap:8, marginTop:8, paddingTop:8, borderTop:'var(--border)' }}>
                {mForm.phone_home && (
                  <a href={`tel:${mForm.phone_home}`} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--blue)', textDecoration:'none' }}>
                    <i className="ti ti-phone" style={{ fontSize:14 }} aria-hidden="true"/> Ligar
                  </a>
                )}
                {mForm.phone_cell && (
                  <a href={`https://wa.me/55${mForm.phone_cell.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#25D366', textDecoration:'none' }}>
                    <i className="ti ti-brand-whatsapp" style={{ fontSize:14 }} aria-hidden="true"/> WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* Footer buttons */}
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              {editing ? (
                <>
                  <button className="btn btn-primary" onClick={saveMember} disabled={saving||!mForm.name.trim()} style={{ flex:1, justifyContent:'center' }}>
                    <i className="ti ti-device-floppy" aria-hidden="true"/> {saving?'Salvando…':'Salvar'}
                  </button>
                  <button className="btn" onClick={() => isNew ? setModal(null) : setEditing(false)} style={{ flex:1, justifyContent:'center' }}>Cancelar</button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => setEditing(true)} style={{ flex:1, justifyContent:'center' }}>
                    <i className="ti ti-edit" aria-hidden="true"/> Editar
                  </button>
                  <button className="btn" style={{ flex:1, justifyContent:'center', borderColor:'var(--red-tx)', color:'var(--red-tx)' }}
                    onClick={() => setConfirmDel(selected)}>
                    <i className="ti ti-user-minus" aria-hidden="true"/> Desativar
                  </button>
                  <button className="btn" onClick={() => setModal(null)} style={{ justifyContent:'center', padding:'8px 12px' }}>
                    <i className="ti ti-x" aria-hidden="true"/>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW/EDIT GROUP MODAL */}
      {(modal==='newgroup'||modal==='editgroup') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth:340 }} onClick={e => e.stopPropagation()}>
            <h3>{modal==='newgroup'?'Novo grupo':'Editar grupo'}</h3>
            <div className="sub" style={{ marginBottom:14 }}>{modal==='editgroup'?selGroup?.name:'Defina nome e cor'}</div>
            <div className="field">
              <label>Nome do grupo *</label>
              <input type="text" value={gForm.name} onChange={e => gf('name',e.target.value)} placeholder="Ex: Novo Grupo" autoFocus />
            </div>
            <div className="field">
              <label>Cor</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:4 }}>
                {PALETTE.map(p => (
                  <button key={p.color} onClick={() => pickPalette(p)} style={{
                    height:36, borderRadius:'var(--radius)', border:`2px solid ${gForm.color===p.color?p.color:'transparent'}`,
                    background:p.bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11, color:p.tx,
                  }}>
                    <span style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }}/>{p.label}
                  </button>
                ))}
              </div>
            </div>
            {modal==='editgroup' && (
              <button onClick={() => { setConfirmDelG(selGroup); setModal(null) }}
                style={{ width:'100%', padding:'8px', border:'0.5px solid var(--red-tx)', borderRadius:'var(--radius)', background:'none', color:'var(--red-tx)', fontSize:12, cursor:'pointer', marginBottom:8 }}>
                <i className="ti ti-trash" aria-hidden="true"/> Excluir grupo
              </button>
            )}
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary" onClick={saveGroup} disabled={saving||!gForm.name.trim()} style={{ flex:1, justifyContent:'center' }}>{saving?'Salvando…':'Salvar'}</button>
              <button className="btn" onClick={() => setModal(null)} style={{ flex:1, justifyContent:'center' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DEACTIVATE MEMBER */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Desativar membro</h3>
            <div className="sub"><strong>{confirmDel.name}</strong> será removido da lista ativa. O histórico de presenças é mantido.</div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="btn" onClick={() => deactivateMember(confirmDel)} disabled={saving}
                style={{ flex:1, justifyContent:'center', borderColor:'var(--red-tx)', color:'var(--red-tx)' }}>{saving?'Aguarde…':'Confirmar'}</button>
              <button className="btn" onClick={() => setConfirmDel(null)} style={{ flex:1, justifyContent:'center' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE GROUP */}
      {confirmDelG && (
        <div className="modal-overlay" onClick={() => setConfirmDelG(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Excluir grupo</h3>
            <div className="sub"><strong>{confirmDelG.name}</strong> será removido. Mova os membros para outro grupo antes de excluir.</div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="btn" onClick={() => deactivateGroup(confirmDelG)} disabled={saving}
                style={{ flex:1, justifyContent:'center', borderColor:'var(--red-tx)', color:'var(--red-tx)' }}>{saving?'Aguarde…':'Confirmar'}</button>
              <button className="btn" onClick={() => setConfirmDelG(null)} style={{ flex:1, justifyContent:'center' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
