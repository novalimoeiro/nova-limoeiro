import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useMembers } from '../lib/useMembers'
import { GROUPS, getGroupStyle, initials } from '../lib/data'

const EMPTY = { name: '', group_name: 'Agave' }

export default function Membros() {
  const { members, loading, invalidate } = useMembers()
  const [search, setSearch]       = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [modal, setModal]         = useState(null)   // null | 'add' | {id,name,group_name}
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(null) // member to deactivate

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchGroup  = groupFilter === 'all' || m.group_name === groupFilter
    return matchSearch && matchGroup
  })

  const byGroup = {}
  filtered.forEach(m => { (byGroup[m.group_name] = byGroup[m.group_name] || []).push(m) })

  function openAdd() {
    setForm(EMPTY)
    setModal('add')
  }

  function openEdit(m) {
    setForm({ name: m.name, group_name: m.group_name })
    setModal(m)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    if (modal === 'add') {
      await supabase.from('members').insert({ name: form.name.trim(), group_name: form.group_name, active: true })
    } else {
      await supabase.from('members').update({ name: form.name.trim(), group_name: form.group_name, updated_at: new Date().toISOString() }).eq('id', modal.id)
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
    invalidate()
  }

  return (
    <div style={{ padding: '20px 20px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>Membros</h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
            {members.length} membros ativos · 5 grupos
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="ti ti-plus" /> Novo membro
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search" placeholder="Buscar pelo nome…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ fontSize: 13, padding: '6px 10px', border: 'var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', width: 210 }}
        />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[['all', 'Todos'], ...GROUPS.map(g => [g.name, g.name.split(' ')[0]])].map(([v, l]) => (
            <button key={v} className={`pill ${groupFilter === v ? 'on' : ''}`} onClick={() => setGroupFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Carregando…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Nenhum membro encontrado.</p>
      ) : (
        Object.entries(byGroup).map(([grp, mems]) => {
          const g = getGroupStyle(grp)
          return (
            <div key={grp} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: g.tx, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: g.color, display: 'inline-block' }} />
                {grp}
                <span style={{ fontWeight: 400, color: 'var(--text2)' }}>({mems.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {mems.map(m => (
                  <div key={m.id} style={{
                    background: 'var(--bg)', border: 'var(--border)', borderRadius: 'var(--radius)',
                    padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', background: g.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 500, color: g.tx,
                    }}>
                      {initials(m.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: g.tx }}>{grp}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => openEdit(m)} title="Editar" style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, padding: 3 }}>
                        <i className="ti ti-edit" />
                      </button>
                      <button onClick={() => setConfirmDel(m)} title="Desativar" style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 16, padding: 3 }}>
                        <i className="ti ti-user-minus" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Add / Edit modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{modal === 'add' ? 'Novo membro' : 'Editar membro'}</h3>
            <div className="sub" style={{ marginBottom: 16 }}>
              {modal === 'add' ? 'Preencha os dados e salve.' : `Editando: ${modal.name}`}
            </div>

            <div className="field">
              <label>Nome completo</label>
              <input
                type="text" autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: João da Silva"
                onKeyDown={e => e.key === 'Enter' && save()}
              />
            </div>

            <div className="field">
              <label>Grupo</label>
              <select value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))}>
                {GROUPS.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.name.trim()} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button className="btn" onClick={() => setModal(null)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm deactivate */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Desativar membro</h3>
            <div className="sub">
              <strong>{confirmDel.name}</strong> será removido da lista ativa. O histórico de presenças é mantido.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn"
                onClick={() => deactivate(confirmDel)}
                disabled={saving}
                style={{ flex: 1, justifyContent: 'center', borderColor: '#A32D2D', color: '#A32D2D' }}
              >
                {saving ? 'Aguarde…' : 'Confirmar'}
              </button>
              <button className="btn" onClick={() => setConfirmDel(null)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
