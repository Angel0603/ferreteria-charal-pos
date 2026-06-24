'use client'

import { useSyncExternalStore } from 'react'

function subscribeNoop() { return () => {} }
function getClientSnapshot()  { return true }
function getServerSnapshot()  { return false }

export function useEstaMontado() {
  return useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot)
}