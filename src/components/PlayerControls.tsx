import { useEngineStore } from '../store/useEngineStore'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { audioAnalyzer } from '../engine/audio/AudioAnalyzer'
import { useEffect, useState, useRef } from 'react'

export function PlayerControls() {
  const { isPlaying, setIsPlaying, volume, setVolume } = useEngineStore()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(1)
  const isScrubbing = useRef(false)

  useEffect(() => {
    audioAnalyzer.setVolume(volume)
  }, [volume])

  useEffect(() => {
    const video = document.getElementById('media-source') as HTMLVideoElement
    if (!video) return

    let rafId: number
    
    const updateTime = () => {
      // Don't fight the slider if user is scrubbing or video is actively seeking asynchronously
      if (!isScrubbing.current && !video.seeking) {
        setCurrentTime(video.currentTime)
      }
      rafId = requestAnimationFrame(updateTime)
    }
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }
    
    // Pause slider updates while video is resolving a seek to prevent rubber-banding
    const handleSeeking = () => { isScrubbing.current = true }
    const handleSeeked = () => { isScrubbing.current = false }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('seeked', handleSeeked)
    rafId = requestAnimationFrame(updateTime)

    // Initial sync
    setCurrentTime(video.currentTime)
    if (video.duration) setDuration(video.duration)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('seeked', handleSeeked)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setVolume(volume === 0 ? 0.8 : 0)
  }

  const seekBack5s = () => {
    const video = document.getElementById('media-source') as HTMLVideoElement
    if (video) {
      video.currentTime = Math.max(0, video.currentTime - 5)
      setCurrentTime(video.currentTime)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    const video = document.getElementById('media-source') as HTMLVideoElement
    if (video) video.currentTime = time
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-6 px-8 py-6 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 rounded-b-xl">
      
      <button 
        onClick={seekBack5s}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors hover:bg-white/10"
        title="Seek Back 5s"
      >
        <RotateCcw size={20} />
      </button>

      <button 
        onClick={togglePlay}
        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg border border-white/10"
      >
        {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
      </button>

      <div className="flex-1 flex items-center gap-4 text-xs font-mono font-bold opacity-80 text-white">
        <span className="w-10 text-right">{formatTime(currentTime)}</span>
        <input 
          type="range" 
          min="0" 
          max={duration || 1} 
          step="0.01" 
          value={currentTime}
          onChange={handleSeek}
          onPointerDown={() => { isScrubbing.current = true }}
          onPointerUp={() => { isScrubbing.current = false }}
          onPointerCancel={() => { isScrubbing.current = false }}
          className="flex-1 accent-red-600 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer hover:bg-white/30 transition-colors"
        />
        <span className="w-10">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
        <button onClick={toggleMute}>
          {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 accent-red-600 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
        />
      </div>

    </div>
  )
}

