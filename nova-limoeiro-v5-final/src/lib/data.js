export const GROUPS = [
  { name: 'Agave',           color: '#639922', bg: '#EAF3DE', tx: '#3B6D11' },
  { name: 'Augusto Antunes', color: '#185FA5', bg: '#E6F1FB', tx: '#0C447C' },
  { name: 'Coronel Alves',   color: '#993556', bg: '#FBEAF0', tx: '#72243E' },
  { name: 'Floco de Neve',   color: '#5F5E5A', bg: '#F1EFE8', tx: '#444441' },
  { name: 'Rock Estrela',    color: '#854F0B', bg: '#FAEEDA', tx: '#633806' },
]

export const EVENT_TYPES = [
  { id: 'AC', label: 'Assembleia de Circuito',             icon: 'ti-users-group'      },
  { id: 'CO', label: 'Congresso',                           icon: 'ti-building-stadium' },
  { id: 'CM', label: 'Celebração da Morte de Jesus Cristo', icon: 'ti-heart'            },
  { id: 'ES', label: 'Evento Especial',                     icon: 'ti-star'             },
  { id: 'VS', label: 'Visita do Superintendente',           icon: 'ti-user-check'       },
]

export const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export function getGroupStyle(name) {
  return GROUPS.find(g => g.name === name) || GROUPS[0]
}

export function getMeetings(year, month) {
  const meetings = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    const dow = d.getDay()
    if (dow === 0 || dow === 4) {
      meetings.push({ date: new Date(d), type: dow === 4 ? 'qui' : 'dom' })
    }
    d.setDate(d.getDate() + 1)
  }
  return meetings
}

export function dateStr(d) {
  return d.toISOString().slice(0, 10)
}

export function initials(name) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('')
}
