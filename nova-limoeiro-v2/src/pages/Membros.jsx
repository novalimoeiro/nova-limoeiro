import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useMembers } from '../lib/useMembers.jsx'
import { GROUPS, getGroupStyle, initials } from '../lib/data'

const PRIVILEGES = ['Publicador','Pioneiro Auxiliar','Pioneiro Regular','Ancião','Servo Ministerial']

const EMPTY = {
  name: '', group_name: 'Agave', address: '', number: '', complement: '',
  cep: '', neighborhood: '', birthdate: '', phone_home: '', phone_cell: '',
  privilege: 'Publicador',
}

function formatDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export default function Membros() {
  const { members, loading, invalidate } = useMembers()
  const [search, setSearch]           = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [modal, setModal]             = useState(null) // null | 'view' | 'edit' | 'add'
  const [selected, setSelected]       = useState(null)
  const [form, setForm]               = useState(EMPTY)
  const [saving, setSaving]           = useState(false)
  const [confirmDel, setConfirmDel]   = useState(null)

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchGroup  = groupFilter === 'all' || m.group_name === groupFilter
    return matchSearch && matchGroup
  })

  const byGroup = {}
  filtered.forEach(m => { (byGroup[m.group_name] = byGroup[m.group_name] || []).push(m) })

  function openAdd() { setForm(EMPTY); setModal('add') }

  function openView(m) { setSelected(m); setModal('view') }

  function switchToEdit() {
    setForm({
      name: selected.name || '', group_name: selected.group_name || 'Agave',
      address: selected.address || '', number: selected.number || '',
      complement: selected.complement || '', cep: selected.cep || '',
      neighborhood: selected.neighborhood || '', birthdate: selected.birthdate || '',
      phone_home: selected.phone_home || '', phone_cell: selected.phone_cell || '',
      privilege: selected.privilege || 'Publicador',
    })
    setModal('edit')
  }

  function field(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(), group_name: form.group_name,
      address: form.address || null, number: form.number || null,
      complement: form.complement || null, cep: form.cep || null,
      neighborhood: form.neighborhood || null,
      birthdate: form.birthdate || null,
      phone_home: form.phone_home || null, phone_cell: form.phone_cell || null,
      privilege: form.privilege || 'Publicador',
      active: true, updated_at: new Date().toISOString(),
    }
    if (modal === 'add') {
      await supabase.from('members').insert(payload)
    } else {
      await supabase.from('members').update(payload).eq('id', selected.id)
    }
    setSaving(false)
    setModal(null)
    invalidate()
  }

  async function deactivate(member) {
    setSaving(true)
    await supabase.from('members').update({ active: false, updated_at: new Date().toISOString() }).eq('id', member.id)
    setSaving(false)
    setConfirmDel(null)
    setModal(null)
    invalidate()
  }

  const g = selected ? getGroupStyle(selected.group_name) : null

  return (
    <div style={{ padding: '20px 20px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>Membros</h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{members.length} membros ativos · 5 grupos</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="ti ti-plus" aria-hidden="true" /> Novo membro
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="search" placeholder="Buscar pelo nome…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ fontSize: 13, padding: '6px 10px', border: 'var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', width: 210 }} />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[['all','Todos'], ...GROUPS.map(g => [g.name, g.name.split(' ')[0]])].map(([v,l]) => (
            <button key={v} className={`pill ${groupFilter===v?'on':''}`} onClick={() => setGroupFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Members by group */}
      {loading ? <p style={{ color:'var(--text2)', fontSize:13 }}>Carregando…</p>
      : filtered.length === 0 ? <p style={{ color:'var(--text2)', fontSize:13 }}>Nenhum membro encontrado.</p>
      : Object.entries(byGroup).map(([grp, mems]) => {
        const gs = getGroupStyle(grp)
        return (
          <div key={grp} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: gs.tx, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, borderLeft: `3px solid ${gs.color}`, paddingLeft: 10 }}>
              {grp} <span style={{ fontWeight: 400, color: 'var(--text2)', fontSize: 13 }}>({mems.length})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {mems.map(m => (
                <div key={m.id} style={{ background: 'var(--bg)', border: 'var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: gs.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: gs.tx }}>
                    {initials(m.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.privilege || 'Publicador'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button onClick={() => openView(m)} title="Ver detalhes"
                      style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, padding: 3 }}>
                      <i className="ti ti-eye" aria-hidden="true" />
                    </button>
                    <button onClick={() => setConfirmDel(m)} title="Desativar"
                      style={{ background: 'none', border: 'none', color: 'var(--red-tx)', cursor: 'pointer', fontSize: 16, padding: 3 }}>
                      <i className="ti ti-user-minus" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* VIEW modal */}
      {modal === 'view' && selected && g && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            {/* Member header */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: 'var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: g.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: g.tx, flexShrink: 0 }}>
                {initials(selected.name)}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: g.tx, fontWeight: 500 }}>{selected.group_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{selected.privilege || 'Publicador'}</div>
              </div>
            </div>

            {/* Info rows */}
            {selected.birthdate && (
              <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: 'var(--border)', alignItems: 'center' }}>
                <i className="ti ti-cake" style={{ fontSize: 15, color: 'var(--text2)', width: 18, textAlign: 'center', flexShrink: 0 }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>Data de Nascimento</div>
                  <div style={{ fontSize: 13 }}>{formatDate(selected.birthdate)}</div>
                </div>
              </div>
            )}

            {(selected.address || selected.neighborhood) && (
              <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: 'var(--border)', alignItems: 'flex-start' }}>
                <i className="ti ti-map-pin" style={{ fontSize: 15, color: 'var(--text2)', width: 18, textAlign: 'center', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>Endereço</div>
                  {selected.address && <div style={{ fontSize: 13 }}>{selected.address}{selected.number ? `, ${selected.number}` : ''}{selected.complement ? ` — ${selected.complement}` : ''}</div>}
                  {selected.neighborhood && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{selected.neighborhood}{selected.cep ? ` · ${selected.cep}` : ''}</div>}
                </div>
              </div>
            )}

            {selected.phone_home && (
              <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: 'var(--border)', alignItems: 'center' }}>
                <i className="ti ti-phone" style={{ fontSize: 15, color: 'var(--text2)', width: 18, textAlign: 'center', flexShrink: 0 }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>Tel. Residencial</div>
                  <a href={`tel:${selected.phone_home}`} style={{ fontSize: 13, color: 'var(--blue)', textDecoration: 'none' }}>{selected.phone_home}</a>
                </div>
              </div>
            )}

            {selected.phone_cell && (
              <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: 'var(--border)', alignItems: 'center' }}>
                <i className="ti ti-brand-whatsapp" style={{ fontSize: 15, color: '#25D366', width: 18, textAlign: 'center', flexShrink: 0 }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text2)' }}>Tel. Celular</div>
                  <a href={`https://wa.me/55${selected.phone_cell.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 13, color: '#25D366', textDecoration: 'none' }}>{selected.phone_cell}</a>
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={switchToEdit}>
                <i className="ti ti-edit" aria-hidden="true" /> Editar
              </button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModal(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <h3>{modal === 'add' ? 'Novo membro' : 'Editar membro'}</h3>
            <div className="sub" style={{ marginBottom: 14 }}>{modal === 'edit' ? selected?.name : 'Preencha os dados'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Nome completo *</label>
                <input type="text" value={form.name} onChange={e => field('name', e.target.value)} placeholder="Nome completo" autoFocus />
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Grupo *</label>
                <select value={form.group_name} onChange={e => field('group_name', e.target.value)}>
                  {GROUPS.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Privilégio</label>
                <select value={form.privilege} onChange={e => field('privilege', e.target.value)}>
                  {PRIVILEGES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label><i className="ti ti-cake" style={{ fontSize: 12 }} aria-hidden="true" /> Data de Nascimento</label>
                <input type="date" value={form.birthdate} onChange={e => field('birthdate', e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label><i className="ti ti-map-pin" style={{ fontSize: 12 }} aria-hidden="true" /> Endereço</label>
                <input type="text" value={form.address} onChange={e => field('address', e.target.value)} placeholder="Rua / Av." />
              </div>
              <div className="field">
                <label>N.°</label>
                <input type="text" value={form.number} onChange={e => field('number', e.target.value)} placeholder="Número" />
              </div>
              <div className="field">
                <label>Casa / AP</label>
                <input type="text" value={form.complement} onChange={e => field('complement', e.target.value)} placeholder="Complemento" />
              </div>
              <div className="field">
                <label>CEP</label>
                <input type="text" value={form.cep} onChange={e => field('cep', e.target.value)} placeholder="00000-000" />
              </div>
              <div className="field">
                <label>Bairro</label>
                <input type="text" value={form.neighborhood} onChange={e => field('neighborhood', e.target.value)} placeholder="Bairro" />
              </div>
              <div className="field">
                <label><i className="ti ti-phone" style={{ fontSize: 12 }} aria-hidden="true" /> Tel. Residencial</label>
                <input type="tel" value={form.phone_home} onChange={e => field('phone_home', e.target.value)} placeholder="(00) 0000-0000" />
              </div>
              <div className="field">
                <label><i className="ti ti-brand-whatsapp" style={{ fontSize: 12, color: '#25D366' }} aria-hidden="true" /> Celular</label>
                <input type="tel" value={form.phone_cell} onChange={e => field('phone_cell', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.name.trim()} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button className="btn" onClick={() => modal === 'edit' ? setModal('view') : setModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm deactivate */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Desativar membro</h3>
            <div className="sub"><strong>{confirmDel.name}</strong> será removido da lista ativa. O histórico de presenças é mantido.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => deactivate(confirmDel)} disabled={saving}
                style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--red-tx)', color: 'var(--red-tx)' }}>
                {saving ? 'Aguarde…' : 'Confirmar'}
              </button>
              <button className="btn" onClick={() => setConfirmDel(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
