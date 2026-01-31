export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <header className="h-16 border-b bg-white px-6 flex items-center">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
      </header>
      
      {/* Chat Area Skeleton */}
      <div className="flex-1 p-4 space-y-6">
        {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-200" />
                <div className="h-12 w-[60%] rounded-2xl bg-slate-200" />
            </div>
        ))}
      </div>
    </div>
  )
}