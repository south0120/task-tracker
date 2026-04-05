'use client'

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        setValue(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true)
  }, [key])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, [key, value, isLoaded])

  return [value, setValue, isLoaded] as const
}
