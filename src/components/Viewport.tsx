import { useEffect, useRef } from 'react'
import { GLRenderer } from '../engine/pipeline/GLRenderer'
import { useEngineStore } from '../store/useEngineStore'

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<GLRenderer | null>(null)
  const isAudioUnlocked = useEngineStore((s) => s.isAudioUnlocked)

  useEffect(() => {
    if (!canvasRef.current || !isAudioUnlocked) return

    // Instantiate native WebGL pipeline
    rendererRef.current = new GLRenderer(canvasRef.current)
    
    // We attach the video element via a global window ref for pragmatism,
    // or we could pass it via Zustand. Let's look for the video tag by ID.
    const videoElement = document.getElementById('media-source') as HTMLVideoElement
    if (videoElement) {
      rendererRef.current.setVideo(videoElement)
    }

    rendererRef.current.start()

    return () => {
      rendererRef.current?.destroy()
    }
  }, [isAudioUnlocked])

  return (
    <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
      {/* 
        We don't use React state for dimensions here to avoid re-renders during resize. 
        GLRenderer handles canvas resizing natively via window event listener.
      */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block" 
      />
    </div>
  )
}
