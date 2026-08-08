import { useEffect, useRef, useState } from 'react'
import { audioAnalyzer } from '../engine/audio/AudioAnalyzer'
import { useEngineStore } from '../store/useEngineStore'
import { Play } from 'lucide-react'

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
  const setIsAudioUnlocked = useEngineStore((s) => s.setIsAudioUnlocked)
  const isAudioUnlocked = useEngineStore((s) => s.isAudioUnlocked)
  
  const isPlaying = useEngineStore((s) => s.isPlaying)
  const setIsPlaying = useEngineStore((s) => s.setIsPlaying)
  
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // If the user changed the URL, update the source
    if (videoRef.current && mediaUrl) {
      videoRef.current.src = mediaUrl
      if (isPlaying) videoRef.current.play().catch(console.error)
    }
  }, [mediaUrl])

  useEffect(() => {
    if (!videoRef.current || !isAudioUnlocked) return
    if (isPlaying) {
      videoRef.current.play().catch(console.error)
    } else {
      videoRef.current.pause()
    }
  }, [isPlaying, isAudioUnlocked])

  const unlockAudio = async () => {
    if (!videoRef.current) return
    
    try {
      // Browser autoplay policies dictate this must happen on a user interaction
      audioAnalyzer.init(videoRef.current)
      audioAnalyzer.resume()
      
      // Start the default video
      videoRef.current.src = mediaUrl || DEFAULT_VIDEO_URL
      videoRef.current.crossOrigin = "anonymous" // Crucial for WebGL texImage2D
      videoRef.current.loop = true
      
      await videoRef.current.play()
      
      setIsAudioUnlocked(true)
      setIsPlaying(true)
      setShowSplash(false)
    } catch (err) {
      console.error('Failed to unlock audio context:', err)
      alert("Failed to play video. If using a custom URL, ensure it supports CORS.")
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 p-8 border border-[#262626] bg-[#141414] rounded-lg shadow-2xl">
            <h1 className="text-2xl font-bold tracking-widest text-white">AVIZUAL DAW</h1>
            <p className="text-sm text-gray-400 max-w-sm text-center">
              Real-time ASCII datamosh synthesis driven by Web Audio FFT. 
              <br/><br/>
              Interaction required to unlock AudioContext.
            </p>
            <button
              onClick={unlockAudio}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold uppercase tracking-wider rounded hover:bg-gray-200 transition-colors"
            >
              <Play size={18} />
              Engage Synthesis
            </button>
          </div>
        </div>
      )}
    </>
  )
}
