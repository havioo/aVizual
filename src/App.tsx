import { Viewport } from './components/Viewport'
import { MediaProvider } from './components/MediaProvider'
import { ControlPanel } from './components/ControlPanel'
import { PlayerControls } from './components/PlayerControls'
import { useEngineStore } from './store/useEngineStore'

function App() {
  const isAudioUnlocked = useEngineStore(s => s.isAudioUnlocked)

  return (
    <main className="relative w-screen h-screen bg-[#050505] overflow-hidden flex items-center justify-center p-8">
      <MediaProvider />
      
      {/* Liquid Metal Player Container */}
      <div className="relative w-full max-w-5xl aspect-video rounded-xl flex flex-col overflow-visible shadow-[0_20px_50px_rgba(0,0,0,0.9)] ring-1 ring-white/10 group">
        
        {/* Canvas Area */}
        <div className="flex-1 relative bg-black rounded-xl overflow-hidden">
          <Viewport />
          
          {/* Media Controls Bottom Bar (Fades in on hover) */}
          {isAudioUnlocked && (
            <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out">
              <PlayerControls />
            </div>
          )}
        </div>

        {/* Parameter Panel attached to the right side */}
        {isAudioUnlocked && (
          <div className="absolute top-4 -right-[340px]">
            <ControlPanel />
          </div>
        )}
      </div>

    </main>
  )
}

export default App
