export default function Loading() {
  return (
    <div className="flex flex-col h-full w-full bg-slate-950">
      
      {/* --- HEADER SKELETON --- */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/90 flex items-center px-6 sticky top-0 z-10">
        <div className="flex items-center gap-4 w-full">
          {/* Menu Button Skeleton */}
          <div className="h-8 w-8 rounded-md bg-slate-800/50 animate-pulse" />
          
          {/* Title Skeleton */}
          <div className="h-6 w-32 bg-slate-800/50 rounded animate-pulse" />
        </div>
      </header>
      
      {/* --- CHAT AREA SKELETON --- */}
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Message 1: AI (Left, with Avatar) */}
          <div className="flex w-full justify-start gap-4 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-slate-800 shrink-0 mt-1" />
            <div className="space-y-2 max-w-[70%] w-full">
               <div className="h-4 w-[90%] bg-slate-800/50 rounded" />
               <div className="h-4 w-[75%] bg-slate-800/50 rounded" />
               <div className="h-4 w-[60%] bg-slate-800/50 rounded" />
            </div>
          </div>

          {/* Message 2: User (Right, No Avatar) */}
          <div className="flex w-full justify-end animate-pulse">
            <div className="space-y-2 max-w-[60%] w-full flex flex-col items-end">
               <div className="h-4 w-full bg-slate-800/30 rounded" />
               <div className="h-4 w-[80%] bg-slate-800/30 rounded" />
            </div>
          </div>

          {/* Message 3: AI (Left, with Avatar) */}
          <div className="flex w-full justify-start gap-4 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-slate-800 shrink-0 mt-1" />
            <div className="space-y-2 max-w-[70%] w-full">
               <div className="h-4 w-full bg-slate-800/50 rounded" />
               <div className="h-4 w-[85%] bg-slate-800/50 rounded" />
               <div className="h-4 w-[90%] bg-slate-800/50 rounded" />
               <div className="h-4 w-[50%] bg-slate-800/50 rounded" />
            </div>
          </div>

           {/* Message 4: User (Right, No Avatar) */}
           <div className="flex w-full justify-end animate-pulse">
            <div className="space-y-2 max-w-[50%] w-full flex flex-col items-end">
               <div className="h-4 w-full bg-slate-800/30 rounded" />
            </div>
          </div>

        </div>
      </div>

      {/* --- INPUT SKELETON --- */}
      {/* Matches the 'Floating Input' design exactly */}
      <div className="p-4 md:p-6 bg-slate-950 sticky bottom-0 z-20">
        <div className="max-w-3xl mx-auto">
          <div className="h-12 w-full bg-slate-800/50 rounded-full animate-pulse" />
        </div>
      </div>

    </div>
  )
}