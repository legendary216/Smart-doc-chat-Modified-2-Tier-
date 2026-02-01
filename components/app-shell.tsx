"use client"

import { useState, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation' // <--- 1. Import this
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
  const pathname = usePathname() // <--- 2. Get current path

  // --- 3. THE FIX: Hide Sidebar on Login ---
  // If we are on the login page, render ONLY the children (the form)
  // We skip the SidebarContext and the split-screen layout entirely.
  if (pathname === "/login") {
    return <main className="h-screen bg-slate-950">{children}</main>;
  }

  // Otherwise, render the standard App Layout with Sidebar
  return (
   <SidebarContext.Provider value={{ isOpen, toggle: () => setIsOpen(!isOpen) }}>
      <div className="flex h-screen bg-slate-950 overflow-hidden relative">
        
        {/* --- 1. MOBILE OVERLAY (Backdrop) --- */}
        {isOpen && (
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          />
        )}

        {/* --- 2. THE SIDEBAR PANEL --- */}
        <aside 
          className={`
            /* Mobile: Fixed overlay */
            fixed inset-y-0 left-0 z-50 w-72 
            /* Desktop: Relative push */
            lg:relative lg:shrink-0 lg:z-auto
            
            transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-900
            overflow-hidden whitespace-nowrap 
            ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full lg:w-0 opacity-0'}
          `}
        >
          <ChatSidebar />
        </aside>

        {/* --- 3. THE MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col min-w-0 relative">
           {children}
        </main>

      </div>
    </SidebarContext.Provider>
  )
}