"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, X, FileType, CheckCircle2, CloudUpload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { parseFile } from '@/lib/pdf-parser'
import { saveDocument } from '@/lib/storage'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
/**
 * References:
 * Tailwind Glassmorphism: https://tailwindcss.com/docs/backdrop-blur
 * React Dropzone: https://react-dropzone.js.org/
 */

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("") 
  
  const { user } = useAuthStore()
  const router = useRouter()
const queryClient = useQueryClient()

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
await queryClient.invalidateQueries({ queryKey: ['chats'] })
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
              relative overflow-hidden group border-2 rounded-[2.5rem] p-12 text-center cursor-pointer transition-all duration-700 ease-in-out
              ${isDragActive 
                ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_60px_rgba(59,130,246,0.3)] scale-[1.03]' 
                : 'border-white/10 border-dashed bg-slate-900/30 backdrop-blur-2xl hover:border-blue-500/40 hover:bg-blue-500/5'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {/* Animated Border Gradient Overlay */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_var(--x,_50%)_var(--y,_50%),rgba(59,130,246,0.1)_0%,transparent_50%)]`} />
            
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center gap-6 relative z-10">
               {/* Refined Icon Squircle */}
               <div className={`
                 p-6 rounded-[2rem] transition-all duration-700 shadow-2xl border border-white/5
                 ${isDragActive 
                    ? 'bg-blue-600 text-white shadow-blue-500/50 rotate-3' 
                    : 'bg-slate-950/80 text-slate-400 group-hover:text-blue-400 group-hover:scale-110 group-hover:-rotate-3'
                 }
               `}>
                 <CloudUpload className={`h-10 w-10 ${isDragActive ? 'animate-bounce' : 'animate-[pulse_4s_infinite]'}`} />
               </div>
               
               <div className="space-y-3">
                 <h3 className={`text-2xl font-bold tracking-tight transition-colors ${isDragActive ? 'text-blue-300' : 'text-slate-100'}`}>
                   {isDragActive ? "Drop to analyze" : "Upload Document"}
                 </h3>
                 <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase font-black opacity-60">
                   PDF • TXT • MARKDOWN (MAX 10MB)
                 </p>
               </div>
            </div>

            {/* Ambient Background Blur Decoration */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          </div>
        ) : (
          /* --- SELECTED FILE GLASS CARD --- */
          <Card className="p-8 bg-slate-950/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl shadow-inner border border-white/5 ${file.type === 'application/pdf' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                    {file.type === 'application/pdf' 
                      ? <FileText className="h-7 w-7 text-red-400" /> 
                      : <FileType className="h-7 w-7 text-blue-400" />
                    }
                  </div>
                  
                  <div>
                    <p className="text-lg font-bold text-white truncate max-w-200px tracking-tight">{file.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-widest uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
               </div>
               
               <button 
                onClick={() => setFile(null)}
                disabled={isProcessing}
                className="p-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* --- RECESSED PROGRESS BAR --- */}
            {isProcessing && (
              <div className="space-y-5">
                 <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                   <span className="flex items-center gap-2">
                     <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                     {status}
                   </span>
                   <span className="text-blue-400">{progress}%</span>
                 </div>
                 
                 <div className="h-3 w-full bg-slate-950 rounded-full p-1 shadow-inner border border-white/5 overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-blue-600 via-cyan-400 to-blue-600 bg-size-[200%_auto] animate-[gradient_2s_linear_infinite] rounded-full transition-all duration-500 ease-out shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                      style={{ width: `${progress}%` }} 
                    />
                 </div>
              </div>
            )}

            {!isProcessing && progress === 100 && (
               <div className="flex items-center justify-center gap-3 text-emerald-400 text-[10px] font-black tracking-[0.4em] mt-4 py-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 animate-pulse">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>TRANSMISSION COMPLETE</span>
               </div>
            )}
          </Card>
        )}
      </div>
    )
}