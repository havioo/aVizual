import { useState, useRef } from 'react'
import { useEngineStore } from '../store/useEngineStore'
import { Upload } from 'lucide-react'

export function ControlPanel() {
  const store = useEngineStore()
  
  // Dragging logic
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag by the header
    const target = e.target as HTMLElement
    if (!target.closest('.drag-handle')) return
    target.setPointerCapture(e.pointerId)
    isDragging.current = true
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false
    const target = e.target as HTMLElement
    target.releasePointerCapture(e.pointerId)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      store.setMediaUrl(url)
    }
  }

  return (
    <div 
      ref={panelRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className="absolute top-4 right-4 w-80 metal-panel p-5 rounded-xl flex flex-col gap-5 shadow-2xl border border-gray-400 z-50 text-gray-900 select-none"
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-500 drag-handle cursor-move active:cursor-grabbing">
        <h2 className="text-[13px] font-bold uppercase tracking-widest flex items-center gap-2">
          Synthesis Params
        </h2>
        <div className="flex gap-1.5 opacity-50">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-700 shadow-inner"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-700 shadow-inner"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-gray-700 shadow-inner"></div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider">Audio Reactive Gain</label>
        </div>
        <input 
          type="range" min="0" max="5" step="0.1" 
          value={store.audioSensitivity} onChange={(e) => store.setAudioSensitivity(parseFloat(e.target.value))}
          className="accent-gray-800 h-1.5 bg-gray-400 rounded-full appearance-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider">Datamosh Filter</label>
          <input 
            type="checkbox" 
            checked={store.enableMosh} 
            onChange={(e) => store.setEnableMosh(e.target.checked)}
            className="accent-gray-800 w-3.5 h-3.5 cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] w-12">DECAY</span>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={store.moshDecay} onChange={(e) => store.setMoshDecay(parseFloat(e.target.value))}
            className="flex-1 accent-gray-800 h-1.5 bg-gray-400 rounded-full appearance-none"
            disabled={!store.enableMosh}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] w-12">THRES</span>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={store.moshThreshold} onChange={(e) => store.setMoshThreshold(parseFloat(e.target.value))}
            className="flex-1 accent-gray-800 h-1.5 bg-gray-400 rounded-full appearance-none"
            disabled={!store.enableMosh}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider">Pixelate Grid</label>
          <input 
            type="checkbox" 
            checked={store.enablePixelate} 
            onChange={(e) => store.setEnablePixelate(e.target.checked)}
            className="accent-gray-800 w-3.5 h-3.5 cursor-pointer"
          />
        </div>
        <input 
          type="range" min="10" max="256" step="1" 
          value={store.asciiGridSize} onChange={(e) => store.setAsciiGridSize(parseInt(e.target.value))}
          className="accent-gray-800 h-1.5 bg-gray-400 rounded-full appearance-none"
          disabled={!store.enablePixelate}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider">ASCII Remap</label>
          <input 
            type="checkbox" 
            checked={store.enableAscii} 
            onChange={(e) => store.setEnableAscii(e.target.checked)}
            className="accent-gray-800 w-3.5 h-3.5 cursor-pointer"
          />
        </div>
        <input 
          type="text" 
          value={store.customAscii} onChange={(e) => store.setCustomAscii(e.target.value)}
          className="bg-gray-200 border-2 border-gray-400 px-2 py-1 font-mono text-[11px] rounded focus:outline-none w-full shadow-inner"
          placeholder="Characters..."
          disabled={!store.enableAscii}
        />
      </div>

      <div className="border-t border-gray-400 pt-3">
        <label className="metal-button flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-transform">
          <Upload size={14} />
          <span>Upload Custom Media</span>
          <input 
            type="file" 
            accept="video/mp4,video/webm" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </label>
      </div>
      
    </div>
  )
}
