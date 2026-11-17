"use client"

import * as React from "react"
import { FileUp, Upload } from "lucide-react"

import { cn } from "@typhed/ui/lib/utils"

/**
 * File drop zone for CSV / XLSX uploads. Parsing happens in the workspace; this
 * component only surfaces the file. Data never leaves the browser.
 */
export function UploadPanel({
  onFile,
  error,
}: {
  onFile: (file: File) => void
  error?: string | null
}) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onFile(file)
  }

  return (
    <div className="mx-auto max-w-xl">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            // Space would also scroll the page without preventDefault.
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center transition-colors",
          dragging ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/50",
        )}
      >
        <span className="bg-brand/10 text-brand flex h-12 w-12 items-center justify-center rounded-full">
          {dragging ? <FileUp className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
        </span>
        <div>
          <p className="font-display text-base font-semibold">Drop a CSV or XLSX file</p>
          <p className="text-muted-foreground mt-1 text-sm">
            or click to browse. Your data is parsed in the browser and never uploaded.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-destructive mt-3 text-center text-sm">{error}</p>}

      <p className="text-muted-foreground mt-4 text-center text-xs">
        Expected columns: a timestamp plus open, high, low, close, and (optionally) volume.
      </p>
    </div>
  )
}
