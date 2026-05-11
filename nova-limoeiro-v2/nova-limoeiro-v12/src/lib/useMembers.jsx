import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const MembersCtx = createContext(null)

export function MembersProvider({ children }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .order('group_name')
      .order('name')
    setMembers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <MembersCtx.Provider value={{ members, loading, invalidate: load }}>
      {children}
    </MembersCtx.Provider>
  )
}

export function useMembers() {
  return useContext(MembersCtx)
}
