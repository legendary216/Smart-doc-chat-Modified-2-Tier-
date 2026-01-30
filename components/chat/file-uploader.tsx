"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)

  // 1. The onDrop function
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // We only take the first file since we want to process one PDF at a time for now
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      console.log("File selected:", acceptedFiles[0].name)
    }
  }, [])

  // 2. The Hook Configuration
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }, // Restrict to PDF only
    maxSize: 10 * 1024 * 1024, // 10MB Limit
    multiple: false
  })

  return (
    <div className="w-full max-w-xl mx-auto mt-10">
      {!file ? (
        // --- STATE A: DROP ZONE ---
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
          `}
        >
          <input {...getInputProps()} /> {/* Hidden Input */}
          
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-slate-100 rounded-full">
              <Upload className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="font-semibold text-lg text-slate-700">
              {isDragActive ? "Drop the PDF here" : "Click to upload PDF"}
            </h3>
            <p className="text-sm text-slate-500">
              Drag & drop or browse your files. (Max 10MB)
            </p>
          </div>

          {/* Validation Errors */}
          {fileRejections.length > 0 && (
            <p className="text-red-500 text-sm mt-4">
              {fileRejections[0].errors[0].message}
            </p>
          )}
        </div>
      ) : (
        // --- STATE B: FILE SELECTED ---
        <Card className="p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setFile(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </Card>
      )}
    </div>
  )
}