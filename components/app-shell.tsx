"use client"

import { useState, createContext, useContext } from 'react'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 1. Create a Context so any child component can toggle the sidebar
const SidebarContext = createContext({
  isOpen: true,
  toggle: () => {}
})

export function useSidebar() {
  return useContext(SidebarContext)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true) // Default to open

  return (
    <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen(!isOpen) }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        
        {/* --- THE SIDEBAR PANEL --- */}
        {/* We use CSS transitions for that smooth "push" effect */}
        <div 
  className={`
    shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-900
    overflow-hidden whitespace-nowrap  // <--- MOVED HERE (Always Active)
    
    ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'}
  `}
>
          <ChatSidebar />
        </div>

        {/* --- THE MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col min-w-0">
           {children}
        </div>

      </div>
    </SidebarContext.Provider>
  )
}