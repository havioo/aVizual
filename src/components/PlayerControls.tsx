import { useEngineStore } from '../store/useEngineStore'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
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

    const handleTimeUpdate = () => {
      if (!isScrubbing.current) {
        setCurrentTime(video.currentTime)
      }
    }
    
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    // Initial sync
    setCurrentTime(video.currentTime)
    if (video.duration) setDuration(video.duration)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setVolume(volume === 0 ? 0.8 : 0)
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
    <div className="flex items-center gap-6 px-6 py-4 w-full metal-panel rounded-b-xl border-t-0 shadow-inner z-10">
      
      <button 
        onClick={togglePlay}
        className="metal-button w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-transform"
      >
        {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
      </button>

      <div className="flex-1 flex items-center gap-4 text-sm font-bold opacity-80">
        <span className="w-12 text-right">{formatTime(currentTime)}</span>
        <input 
          type="range" 
          min="0" 
          max={duration || 1} 
          step="0.1" 
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 accent-[#333] h-2 bg-[#999] rounded-full appearance-none cursor-pointer"
        />
        <span className="w-12">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggleMute} className="hover:opacity-60 transition-opacity">
          {volume === 0 ? <VolumeX /> : <Volume2 />}
        </button>
        <input 
          type="range" 
          min="0" max="1" step="0.01" 
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-24 accent-[#333] h-2 bg-[#999] rounded-full appearance-none cursor-pointer"
        />
      </div>

    </div>
  )
}

