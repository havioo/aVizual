import { create } from 'zustand'

export interface EngineState {
  // Audio config
  audioSensitivity: number
  audioSmoothing: number
  
  // Mosh Params
  moshDecay: number
  moshThreshold: number
  moshScatter: number
  
  // Global Effects
  edgeGlow: number
  chromaShift: number
  
  // ASCII Params
  asciiGridSize: number
  customAscii: string
  
  // Media State
  mediaUrl: string | null
  isPlaying: boolean
  isAudioUnlocked: boolean
  volume: number
  
  // Effect Toggles
  enableMosh: boolean
  enableAscii: boolean
  
  setAudioSensitivity: (val: number) => void
  setAudioSmoothing: (val: number) => void
  setMoshDecay: (val: number) => void
  setMoshThreshold: (val: number) => void
  setMoshScatter: (val: number) => void
  setEdgeGlow: (val: number) => void
  setChromaShift: (val: number) => void
  setAsciiGridSize: (val: number) => void
  setCustomAscii: (val: string) => void
  setMediaUrl: (url: string | null) => void
  setIsPlaying: (playing: boolean) => void
  setIsAudioUnlocked: (unlocked: boolean) => void
  setVolume: (val: number) => void
  setEnableMosh: (val: boolean) => void
  setEnableAscii: (val: boolean) => void
}

export const useEngineStore = create<EngineState>((set) => ({
  audioSensitivity: 0.0,
  audioSmoothing: 0.8,
  
  moshDecay: 0.98,
  moshThreshold: 0.1,
  moshScatter: 0.0,
  
  edgeGlow: 0.0,
  chromaShift: 0.0,
  
  asciiGridSize: 32.0,
  customAscii: ' .:*+oa&#@',
  
  mediaUrl: null, // User can upload or use default
  isPlaying: false,
  isAudioUnlocked: false,
  volume: 0.8,
  
  enableMosh: false,
  enableAscii: false,
  
  setAudioSensitivity: (val) => set({ audioSensitivity: val }),
  setAudioSmoothing: (val) => set({ audioSmoothing: val }),
  setMoshDecay: (val) => set({ moshDecay: val }),
  setMoshThreshold: (val) => set({ moshThreshold: val }),
  setMoshScatter: (val) => set({ moshScatter: val }),
  setEdgeGlow: (val) => set({ edgeGlow: val }),
  setChromaShift: (val) => set({ chromaShift: val }),
  setAsciiGridSize: (val) => set({ asciiGridSize: val }),
  setCustomAscii: (val) => set({ customAscii: val }),
  setMediaUrl: (url) => set({ mediaUrl: url }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsAudioUnlocked: (unlocked) => set({ isAudioUnlocked: unlocked }),
  setVolume: (val) => set({ volume: val }),
  setEnableMosh: (val) => set({ enableMosh: val }),
  setEnableAscii: (val) => set({ enableAscii: val }),
}))
