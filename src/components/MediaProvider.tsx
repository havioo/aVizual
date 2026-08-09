import { useEffect, useRef, useState } from 'react'
import { audioAnalyzer } from '../engine/audio/AudioAnalyzer'
import { useEngineStore } from '../store/useEngineStore'
import { SplashBackground } from './SplashBackground'

// Use Vite's glob import to find any .mp4 files in the public directory at build time
const publicMp4s = import.meta.glob('/public/*.mp4', { eager: true })
const firstMp4Path = Object.keys(publicMp4s)[0]
// public files are served at the root '/'
const AUTO_LOCAL_VIDEO_URL = firstMp4Path ? firstMp4Path.replace('/public', '') : null

// Fallback to the public domain video if no local file is found
const DEFAULT_VIDEO_URL = AUTO_LOCAL_VIDEO_URL || 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

export function MediaProvider() {
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const mediaUrl = useEngineStore((s) => s.mediaUrl)
  const setMediaUrl = useEngineStore((s) => s.setMediaUrl)
  
  const isPlaying = useEngineStore((s) => s.isPlaying)
  const setIsPlaying = useEngineStore((s) => s.setIsPlaying)
  
  const isAudioUnlocked = useEngineStore((s) => s.isAudioUnlocked)
  const setIsAudioUnlocked = useEngineStore((s) => s.setIsAudioUnlocked)
  
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // If no mediaUrl, use default fallback
    if (!mediaUrl) {
      setMediaUrl(DEFAULT_VIDEO_URL)
    }
  }, [mediaUrl, setMediaUrl])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = mediaUrl || ''
      if (isPlaying && isAudioUnlocked) {
        videoRef.current.play().catch(console.error)
      } else {
        videoRef.current.pause()
      }
    }
  }, [mediaUrl, isPlaying, isAudioUnlocked])

  const handleStart = async () => {
    if (!videoRef.current) return
    
    try {
      audioAnalyzer.init(videoRef.current)
      audioAnalyzer.resume()
      
      videoRef.current.src = mediaUrl || DEFAULT_VIDEO_URL
      videoRef.current.crossOrigin = "anonymous"
      videoRef.current.loop = true
      
      await videoRef.current.play()
      
      setIsAudioUnlocked(true)
      setIsPlaying(true)
      setShowSplash(false)
    } catch (err) {
      console.error('Failed to unlock audio context:', err)
      alert("Failed to play video.")
    }
  }

  return (
    <>
      <video
        id="media-source"
        ref={videoRef}
        className="hidden" // Never visible, only used as texture and audio source
        crossOrigin="anonymous"
        playsInline
      />
      
      {showSplash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050506]">
          <SplashBackground />
          <div className="relative z-10 metal-panel p-12 rounded-2xl flex flex-col items-center gap-6 max-w-md text-center">
            <h1 className="text-4xl font-black uppercase tracking-widest bg-gradient-to-br from-red-500 via-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-lg">
              aVizual
            </h1>
            <p className="text-sm text-gray-300 tracking-wide">
              Real-time GLSL audio-reactive visualizer engine.
            </p>
            <button 
              onClick={handleStart}
              className="mt-4 px-10 py-4 metal-button text-sm font-bold uppercase tracking-widest rounded-lg transition-transform"
            >
              Initialize Engine
            </button>
          </div>
        </div>
      )}
    </>
  )
}
