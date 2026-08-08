import { create } from 'zustand'

export interface EngineState {
  // Audio configuration
  audioSensitivity: number
  audioSmoothing: number
  
  // Datamosh phase
  moshDecay: number
  moshThreshold: number
  
  // ASCII phase
  asciiGridSize: number
  customAscii: string
  
  // App state
  mediaUrl: string | null
  isPlaying: boolean
  isAudioUnlocked: boolean
  volume: number
  
  // Effect Toggles
  enableMosh: boolean
  enablePixelate: boolean
  enableAscii: boolean
  
  // Actions
  setAudioSensitivity: (val: number) => void
  setAudioSmoothing: (val: number) => void
  setMoshDecay: (val: number) => void
  setMoshThreshold: (val: number) => void
  setAsciiGridSize: (val: number) => void
  setCustomAscii: (val: string) => void
  setMediaUrl: (url: string | null) => void
  setIsPlaying: (playing: boolean) => void
  setIsAudioUnlocked: (unlocked: boolean) => void
  setVolume: (val: number) => void
  setEnableMosh: (val: boolean) => void
  setEnablePixelate: (val: boolean) => void
  setEnableAscii: (val: boolean) => void
}

export const useEngineStore = create<EngineState>((set) => ({
  audioSensitivity: 1.5,
  audioSmoothing: 0.8,
  
  moshDecay: 0.95,
  moshThreshold: 0.7,
  
  asciiGridSize: 64,
  customAscii: '@%#*+=-:. $', // Includes the requested $
  
  mediaUrl: null, // User can upload or use default
  isPlaying: false,
  isAudioUnlocked: false,
  volume: 0.8,
  
  enableMosh: true,
  enablePixelate: true,
  enableAscii: true,
  
  setAudioSensitivity: (val) => set({ audioSensitivity: val }),
  setAudioSmoothing: (val) => set({ audioSmoothing: val }),
  setMoshDecay: (val) => set({ moshDecay: val }),
  setMoshThreshold: (val) => set({ moshThreshold: val }),
  setAsciiGridSize: (val) => set({ asciiGridSize: val }),
  setCustomAscii: (val) => set({ customAscii: val }),
  setMediaUrl: (url) => set({ mediaUrl: url }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsAudioUnlocked: (unlocked) => set({ isAudioUnlocked: unlocked }),
  setVolume: (val) => set({ volume: val }),
  setEnableMosh: (val) => set({ enableMosh: val }),
  setEnablePixelate: (val) => set({ enablePixelate: val }),
  setEnableAscii: (val) => set({ enableAscii: val }),
}))

