"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, FileType, CheckCircle2, CloudUpload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { parseFile } from '@/lib/pdf-parser'
import { saveDocument } from '@/lib/storage'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("") 
  
  const { user } = useAuthStore()
  const router = useRouter()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      if (!user) {
        alert("Please log in first")
        return
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        setIsProcessing(true)
        setProgress(0)

        setStatus("Reading file...")
        const pages = await parseFile(selectedFile)
        
        setStatus("Preparing AI...")
        const chatId = await saveDocument(selectedFile.name, pages, user.id, (current, total) => {
           const percentage = Math.round((current / total) * 100)
           setProgress(percentage)
           setStatus(`Processing Page ${current} of ${total}...`)
        })

        setStatus("Done! Redirecting...")
        setProgress(100)
        
        setTimeout(() => {
             router.push(`/chat/${chatId}`) 
        }, 500)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Failed to process file.")
      setFile(null)
      setIsProcessing(false)
    }
  }, [user, router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 
        'application/pdf': ['.pdf'],
        'text/plain': ['.txt', '.md']
      }, 
      maxSize: 10 * 1024 * 1024,
      multiple: false,
      disabled: isProcessing
    })

    return (
      <div className="w-full max-w-xl mx-auto">
        {!file ? (
          <div
            {...getRootProps()}
            className={`
              relative overflow-hidden group border-2 rounded-[2.5rem] p-12 text-center cursor-pointer transition-all duration-500
              ${isDragActive 
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_50px_rgba(59,130,246,0.2)] scale-[1.02]' 
                : 'border-slate-800/50 border-dashed bg-slate-900/20 backdrop-blur-xl hover:border-slate-600 hover:bg-slate-800/30'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center gap-5 relative z-10">
               {/* Icon Squircle with Gradient */}
               <div className={`
                 p-5 rounded-2xl transition-all duration-500 shadow-2xl
                 ${isDragActive 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-linear-to-b from-slate-800 to-slate-900 text-slate-400 group-hover:text-blue-400 group-hover:scale-110'
                 }
               `}>
                 <CloudUpload className={`h-8 w-8 ${!isDragActive && 'animate-[bounce_3s_infinite]'}`} />
               </div>
               
               <div className="space-y-2">
                 <h3 className={`text-xl font-semibold transition-colors ${isDragActive ? 'text-blue-400' : 'text-slate-200'}`}>
                   {isDragActive ? "Drop to analyze" : "Click or drag to upload"}
                 </h3>
                 <p className="text-xs text-slate-500 tracking-wide uppercase font-medium">
                   PDF, TXT, or Markdown (Max 10MB)
                 </p>
               </div>
            </div>

            {/* Subtle Inner Glow Decoration */}
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
          </div>
        ) : (
          /* --- SELECTED FILE GLASS CARD --- */
          <Card className="p-8 bg-slate-900/40 backdrop-blur-2xl border-white/5 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start justify-between mb-8">
               <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl shadow-inner ${file.type === 'application/pdf' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                    {file.type === 'application/pdf' 
                      ? <FileText className="h-7 w-7 text-red-400" /> 
                      : <FileType className="h-7 w-7 text-blue-400" />
                    }
                  </div>
                  
                  <div>
                    <p className="text-lg font-semibold text-white truncate max-w-240px tracking-tight">{file.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1 tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
               </div>
               
               <button 
                onClick={() => setFile(null)}
                disabled={isProcessing}
                className="p-2 rounded-full text-slate-500 hover:bg-white/5 hover:text-white transition-all disabled:opacity-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* --- RECESSED PROGRESS BAR --- */}
            {isProcessing && (
              <div className="space-y-4">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                   <span className="animate-pulse">{status}</span>
                   <span className="text-blue-400">{progress}%</span>
                 </div>
                 
                 <div className="h-3 w-full bg-slate-950 rounded-full p-1 shadow-inner border border-white/5">
                    <div 
                      className="h-full bg-linear-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                      style={{ width: `${progress}%` }} 
                    />
                 </div>
              </div>
            )}

            {!isProcessing && status === "Done! Redirecting..." && (
               <div className="flex items-center justify-center gap-3 text-emerald-400 text-sm font-bold mt-4 py-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 animate-pulse">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="tracking-wide">ANALYSIS COMPLETE</span>
               </div>
            )}
          </Card>
        )}
      </div>
    )
}