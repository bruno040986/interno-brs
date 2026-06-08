"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type MessengerDockConversation = {
  id: string
  participant: {
    id: string
    email: string
    full_name?: string
    short_name?: string
    nickname?: string | null
    avatar_url?: string | null
  }
}

type MessengerDockContextValue = {
  isCollapsed: boolean
  isExpanded: boolean
  isMobileOpen: boolean
  unreadCount: number
  hasUnread: boolean
  activeConversation: MessengerDockConversation | null
  setUnreadCount: (count: number) => void
  setActiveConversation: (conversation: MessengerDockConversation | null) => void
  expandDock: () => void
  collapseDock: () => void
  toggleDock: () => void
  openMobileDock: () => void
  closeMobileDock: () => void
}

const MessengerDockContext = createContext<MessengerDockContextValue | null>(null)

export function MessengerDockProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeConversation, setActiveConversation] = useState<MessengerDockConversation | null>(null)

  const expandDock = useCallback(() => {
    setIsCollapsed(false)
    setIsMobileOpen(false)
  }, [])

  const collapseDock = useCallback(() => {
    setIsCollapsed(true)
  }, [])

  const toggleDock = useCallback(() => {
    setIsCollapsed((current) => !current)
  }, [])

  const openMobileDock = useCallback(() => {
    setIsMobileOpen(true)
    setIsCollapsed(false)
  }, [])

  const closeMobileDock = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const value = useMemo<MessengerDockContextValue>(
    () => ({
      isCollapsed,
      isExpanded: !isCollapsed,
      isMobileOpen,
      unreadCount,
      hasUnread: unreadCount > 0,
      activeConversation,
      setUnreadCount,
      setActiveConversation,
      expandDock,
      collapseDock,
      toggleDock,
      openMobileDock,
      closeMobileDock,
    }),
    [activeConversation, collapseDock, closeMobileDock, expandDock, isCollapsed, isMobileOpen, openMobileDock, toggleDock, unreadCount],
  )

  return <MessengerDockContext.Provider value={value}>{children}</MessengerDockContext.Provider>
}

export function useMessengerDock() {
  const context = useContext(MessengerDockContext)
  if (!context) {
    throw new Error('useMessengerDock must be used within MessengerDockProvider')
  }
  return context
}
