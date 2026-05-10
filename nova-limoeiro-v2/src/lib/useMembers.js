import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Global cache so all pages share the same fetch
let cache = null
let listeners = []

function notify() {
  listeners.forEach(fn => fn([...cache]))
}

export function useMembers() {
  const [members, setMembers] = useState(cache || [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    listeners.push(setMembers)
    if (!cache) {
      supabase
        .from('members')
        .select('*')
        .eq('active', true)
        .order('group_name')
        .order('name')
        .then(({ data }) => {
          cache = data || []
          setLoading(false)
          notify()
        })
    }
    return () => {
      listeners = listeners.filter(fn => fn !== setMembers)
    }
  }, [])

  function invalidate() {
    cache = null
    setLoading(true)
    supabase
      .from('members')
      .select('*')
      .eq('active', true)
      .order('group_name')
      .order('name')
      .then(({ data }) => {
        cache = data || []
        setLoading(false)
        notify()
      })
  }

  return { members, loading, invalidate }
}
