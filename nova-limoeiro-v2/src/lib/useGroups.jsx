import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const GroupsCtx = createContext(null)

export function GroupsProvider({ children }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('active', true)
      .order('sort_order')
    setGroups(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <GroupsCtx.Provider value={{ groups, loading, invalidate: load }}>
      {children}
    </GroupsCtx.Provider>
  )
}

export function useGroups() {
  return useContext(GroupsCtx)
}
